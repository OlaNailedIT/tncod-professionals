-- Phase 4: durable registration compensation.
--
-- Auth and application data cannot share one transaction. The Auth trigger
-- therefore creates a private provisioning record for application-created join
-- identities. A successful application transaction removes that record in the
-- same commit that activates the user. Failed/stale records remain retryable.

CREATE TABLE app.registration_provisioning (
  user_id uuid PRIMARY KEY,
  state text NOT NULL DEFAULT 'PENDING'
    CHECK (state IN ('PENDING', 'MANUAL_REVIEW')),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  -- Give a live request time to complete before the scheduled worker may claim
  -- it. The request-level failure path bypasses this delay for immediate cleanup.
  next_attempt_at timestamptz NOT NULL
    DEFAULT (pg_catalog.now() + INTERVAL '15 minutes'),
  lease_token uuid,
  lease_expires_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error_code text
);

CREATE INDEX registration_provisioning_retry_idx
  ON app.registration_provisioning (next_attempt_at, lease_expires_at);

REVOKE ALL ON TABLE app.registration_provisioning FROM PUBLIC, anon, authenticated;
ALTER TABLE app.registration_provisioning ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE app.registration_provisioning IS
  'Private durable saga records for incomplete application-managed registrations.';

CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, phone, account_status, created_at, updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULL,
    'DEACTIVATED',
    pg_catalog.now(),
    pg_catalog.now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id
  FROM public.roles r
  WHERE r.name = 'MEMBER'
  ON CONFLICT DO NOTHING;

  IF COALESCE(NEW.raw_app_meta_data ->> 'registration_provisioning', 'false') = 'true' THEN
    INSERT INTO app.registration_provisioning (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION app.handle_new_auth_user() TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION app.guard_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.account_status <> 'DEACTIVATED'
     AND NEW.account_status IS DISTINCT FROM OLD.account_status
     AND EXISTS (
       SELECT 1
       FROM app.registration_provisioning jobs
       WHERE jobs.user_id = NEW.id
     ) THEN
    RAISE EXCEPTION 'registration_provisioning_incomplete';
  END IF;

  IF TG_OP = 'UPDATE'
     AND auth.uid() IS NOT NULL
     AND NOT app.is_super_admin() THEN
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'privileged_field: account_status';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'privileged_field: users.id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.guard_users_privileged_columns() FROM PUBLIC;

-- Bound the registration-rate-limit table. The worker also performs this
-- deletion, while the index prevents the retention sweep becoming a table scan.
CREATE INDEX IF NOT EXISTS registration_rate_limits_window_idx
  ON app.registration_rate_limits (window_started_at);
