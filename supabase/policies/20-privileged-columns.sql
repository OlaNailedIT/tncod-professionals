-- Privileged column guards (DESIGN ONLY, NOT APPLIED — applied copies live in migrations)
-- Row access (RLS) ≠ column mutability ≠ domain workflow authorization.
-- Phase 12: JWT members may transition own verification_status into PENDING from
-- NOT_REVIEWED | NEEDS_CLARIFICATION | REJECTED. Privileged Prisma (auth.uid null)
-- still requires mandatory domain authorization in application code.

CREATE OR REPLACE FUNCTION app.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Application DATABASE_URL / service connections: no JWT. Domain authz is mandatory in app code.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NOT app.is_exco_admin() THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      IF app.owns_profile(NEW.id)
         AND NEW.verification_status = 'PENDING'
         AND OLD.verification_status IN ('NOT_REVIEWED', 'NEEDS_CLARIFICATION', 'REJECTED') THEN
        NULL;
      ELSE
        RAISE EXCEPTION 'privileged_field: verification_status';
      END IF;
    END IF;
    -- Member may prefer PRIVATE | MEMBERS_ONLY. DIRECTORY is administrative only.
    IF NEW.visibility_status = 'DIRECTORY' AND OLD.visibility_status IS DISTINCT FROM 'DIRECTORY' THEN
      RAISE EXCEPTION 'privileged_field: visibility_status DIRECTORY';
    END IF;
    IF OLD.visibility_status = 'DIRECTORY' AND NEW.visibility_status IS DISTINCT FROM 'DIRECTORY' THEN
      RAISE EXCEPTION 'privileged_field: unpublish is administrative';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT app.is_exco_admin() THEN
    IF NEW.verification_status NOT IN ('NOT_REVIEWED', 'PENDING') THEN
      RAISE EXCEPTION 'privileged_field: verification_status on insert';
    END IF;
    IF NEW.visibility_status = 'DIRECTORY' THEN
      RAISE EXCEPTION 'privileged_field: visibility_status on insert';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_business_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NOT app.is_exco_admin() THEN
    IF NEW.business_status IS DISTINCT FROM OLD.business_status THEN
      RAISE EXCEPTION 'privileged_field: business_status';
    END IF;
    IF NEW.visibility_status IS DISTINCT FROM OLD.visibility_status THEN
      RAISE EXCEPTION 'privileged_field: business visibility_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NOT app.is_super_admin() THEN
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

CREATE OR REPLACE FUNCTION app.guard_document_storage_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NOT app.is_exco_admin() THEN
    IF NEW.storage_key IS DISTINCT FROM OLD.storage_key THEN
      RAISE EXCEPTION 'privileged_field: storage_key';
    END IF;
    IF NEW.profile_id IS DISTINCT FROM OLD.profile_id THEN
      RAISE EXCEPTION 'privileged_field: documents.profile_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.guard_consent_history()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.consent_type IS DISTINCT FROM OLD.consent_type
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.granted_at IS DISTINCT FROM OLD.granted_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'consent_history_immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
