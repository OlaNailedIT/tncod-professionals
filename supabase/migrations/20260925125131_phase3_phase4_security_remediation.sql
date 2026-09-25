-- Phase 3/4 production-readiness remediation.
-- Forward-only: do not edit historical migrations already applied to Production.

-- ---------------------------------------------------------------------------
-- Foreign-key support indexes reported by the Supabase performance advisor.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS admin_notes_author_id_idx
  ON public.admin_notes (author_id);
CREATE INDEX IF NOT EXISTS legacy_import_rows_profile_id_idx
  ON public.legacy_import_rows (profile_id);
CREATE INDEX IF NOT EXISTS legacy_import_rows_user_id_idx
  ON public.legacy_import_rows (user_id);
CREATE INDEX IF NOT EXISTS profile_services_service_id_idx
  ON public.profile_services (service_id);
CREATE INDEX IF NOT EXISTS profile_skills_skill_id_idx
  ON public.profile_skills (skill_id);
CREATE INDEX IF NOT EXISTS publications_actor_id_idx
  ON public.publications (actor_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx
  ON public.role_permissions (permission_id);
CREATE INDEX IF NOT EXISTS spotlights_created_by_idx
  ON public.spotlights (created_by);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx
  ON public.user_roles (role_id);

-- ---------------------------------------------------------------------------
-- Central identity/RBAC helpers. Every privilege decision now requires an
-- ACTIVE, non-deleted application identity. Fully qualified names permit an
-- empty search_path on SECURITY DEFINER functions.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION app.account_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.account_status = 'ACTIVE'
      AND u.deleted_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION app.has_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.roles r ON r.id = ur.role_id
    INNER JOIN public.users u ON u.id = ur.user_id
    WHERE ur.user_id = auth.uid()
      AND u.account_status = 'ACTIVE'
      AND u.deleted_at IS NULL
      AND r.name::text = p_role
  )
$$;

CREATE OR REPLACE FUNCTION app.has_permission(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    INNER JOIN public.users u ON u.id = ur.user_id
    INNER JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    INNER JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND u.account_status = 'ACTIVE'
      AND u.deleted_at IS NULL
      AND p.key = p_key
  )
$$;

CREATE OR REPLACE FUNCTION app.is_exco_viewer()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT app.has_role('EXCO_VIEWER')
      OR app.has_role('EXCO_ADMIN')
      OR app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.is_exco_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT app.has_role('EXCO_ADMIN') OR app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.own_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id
  FROM public.profiles p
  INNER JOIN public.users u ON u.id = p.user_id
  WHERE p.user_id = auth.uid()
    AND p.deleted_at IS NULL
    AND u.account_status = 'ACTIVE'
    AND u.deleted_at IS NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app.owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT p_profile_id IS NOT NULL AND p_profile_id = app.own_profile_id()
$$;

CREATE OR REPLACE FUNCTION app.associated_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_professionals bp
    WHERE bp.business_id = p_business_id
      AND bp.profile_id = app.own_profile_id()
  )
$$;

-- New Auth identities are deliberately inert. Only the application registration
-- transaction activates a complete account.
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

  RETURN NEW;
END;
$$;

-- Trusted server-side registration/status workflows use a direct database role
-- (auth.uid() IS NULL). Authenticated callers still require SUPER_ADMIN.
CREATE OR REPLACE FUNCTION app.guard_users_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
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

CREATE OR REPLACE FUNCTION app.touch_profile_visibility_preferences_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION app.seed_profile_visibility_preferences() SET search_path = '';
ALTER FUNCTION app.directory_professionals() SET search_path = '';
ALTER FUNCTION app.guard_business_privileged_columns() SET search_path = '';
ALTER FUNCTION app.guard_consent_history() SET search_path = '';
ALTER FUNCTION app.guard_document_storage_key() SET search_path = '';
ALTER FUNCTION app.guard_profile_insert() SET search_path = '';
ALTER FUNCTION app.guard_profile_privileged_columns() SET search_path = '';

-- ---------------------------------------------------------------------------
-- Durable, atomic registration throttling. The table/function remain private to
-- the trusted database connection and are not exposed through PostgREST.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.registration_rate_limits (
  client_key_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempt_count integer NOT NULL CHECK (attempt_count > 0)
);

REVOKE ALL ON TABLE app.registration_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app.consume_registration_rate_limit(
  p_client_key_hash text,
  p_limit integer DEFAULT 8,
  p_window_seconds integer DEFAULT 900
)
RETURNS TABLE (allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row app.registration_rate_limits%ROWTYPE;
BEGIN
  IF p_client_key_hash IS NULL OR p_client_key_hash = ''
     OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid registration rate-limit arguments';
  END IF;

  INSERT INTO app.registration_rate_limits AS limits (
    client_key_hash, window_started_at, attempt_count
  )
  VALUES (p_client_key_hash, v_now, 1)
  ON CONFLICT (client_key_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN limits.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
          THEN v_now
        ELSE limits.window_started_at
      END,
      attempt_count = CASE
        WHEN limits.window_started_at + pg_catalog.make_interval(secs => p_window_seconds) <= v_now
          THEN 1
        ELSE limits.attempt_count + 1
      END
  RETURNING * INTO v_row;

  allowed := v_row.attempt_count <= p_limit;
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (
        v_row.window_started_at
        + pg_catalog.make_interval(secs => p_window_seconds)
        - v_now
      )))::integer
    )
  END;
  RETURN NEXT;
END;
$$;

-- ---------------------------------------------------------------------------
-- Consolidate overlapping policies and wrap stable auth/helper calls so the
-- planner can initialize them once per statement.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_select_admin ON public.users;
CREATE POLICY users_select_authorized ON public.users
  FOR SELECT TO authenticated
  USING (
    (SELECT app.account_is_active())
    AND (
      id = (SELECT auth.uid())
      OR (SELECT app.is_exco_admin())
    )
  );

DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_update_super ON public.users;
CREATE POLICY users_update_authorized ON public.users
  FOR UPDATE TO authenticated
  USING (
    (SELECT app.account_is_active())
    AND (
      id = (SELECT auth.uid())
      OR (SELECT app.is_super_admin())
    )
  )
  WITH CHECK (
    (SELECT app.account_is_active())
    AND (
      id = (SELECT auth.uid())
      OR (SELECT app.is_super_admin())
    )
  );

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_members_only ON public.profiles;
DROP POLICY IF EXISTS profiles_select_exco ON public.profiles;
CREATE POLICY profiles_select_authorized ON public.profiles
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      (
        user_id = (SELECT auth.uid())
        AND (SELECT app.account_is_active())
      )
      OR (SELECT app.is_exco_viewer())
      OR (
        (SELECT app.account_is_active())
        AND (SELECT app.own_profile_id()) IS NOT NULL
        AND visibility_status = 'MEMBERS_ONLY'
        AND verification_status = 'VERIFIED'
      )
    )
  );

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_authorized ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (
      user_id = (SELECT auth.uid())
      AND (SELECT app.account_is_active())
    )
    OR (SELECT app.is_exco_admin())
  )
  WITH CHECK (
    (
      user_id = (SELECT auth.uid())
      AND (SELECT app.account_is_active())
    )
    OR (SELECT app.is_exco_admin())
  );

DROP POLICY IF EXISTS businesses_insert ON public.businesses;
REVOKE INSERT ON public.businesses FROM authenticated;

DROP POLICY IF EXISTS businesses_update_associated ON public.businesses;
DROP POLICY IF EXISTS businesses_update_admin ON public.businesses;
CREATE POLICY businesses_update_authorized ON public.businesses
  FOR UPDATE TO authenticated
  USING (
    (SELECT app.is_exco_admin())
    OR (
      (SELECT app.account_is_active())
      AND (SELECT app.associated_business(id))
    )
  )
  WITH CHECK (
    (SELECT app.is_exco_admin())
    OR (
      (SELECT app.account_is_active())
      AND (SELECT app.associated_business(id))
    )
  );

DROP POLICY IF EXISTS documents_select_own ON public.documents;
DROP POLICY IF EXISTS documents_select_review ON public.documents;
CREATE POLICY documents_select_authorized ON public.documents
  FOR SELECT TO authenticated
  USING (
    (SELECT app.owns_profile(profile_id))
    OR (SELECT app.has_permission('document.review'))
  );

DROP POLICY IF EXISTS documents_update_own ON public.documents;
DROP POLICY IF EXISTS documents_update_review ON public.documents;
CREATE POLICY documents_update_authorized ON public.documents
  FOR UPDATE TO authenticated
  USING (
    (SELECT app.owns_profile(profile_id))
    OR (SELECT app.has_permission('document.review'))
  )
  WITH CHECK (
    (SELECT app.owns_profile(profile_id))
    OR (SELECT app.has_permission('document.review'))
  );

DROP POLICY IF EXISTS consents_select_own ON public.consents;
DROP POLICY IF EXISTS consents_select_admin ON public.consents;
CREATE POLICY consents_select_authorized ON public.consents
  FOR SELECT TO authenticated
  USING (
    (
      user_id = (SELECT auth.uid())
      AND (SELECT app.account_is_active())
    )
    OR (SELECT app.is_exco_admin())
  );

DROP POLICY IF EXISTS consents_insert_own ON public.consents;
CREATE POLICY consents_insert_own ON public.consents
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS consents_update_withdraw ON public.consents;
CREATE POLICY consents_update_withdraw ON public.consents
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
    AND withdrawn_at IS NULL
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS notifications_update_read ON public.notifications;
CREATE POLICY notifications_update_read ON public.notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS roles_select_assigned ON public.roles;
CREATE POLICY roles_select_assigned ON public.roles
  FOR SELECT TO authenticated
  USING (
    (SELECT app.is_super_admin())
    OR (
      (SELECT app.account_is_active())
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.role_id = roles.id
          AND ur.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS user_roles_select_super ON public.user_roles;
CREATE POLICY user_roles_select_super ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    (SELECT app.is_super_admin())
    OR (
      user_id = (SELECT auth.uid())
      AND (SELECT app.account_is_active())
    )
  );

-- Storage receives the same active-identity and consolidated-policy treatment.
DROP POLICY IF EXISTS storage_documents_select_own ON storage.objects;
DROP POLICY IF EXISTS storage_documents_select_review ON storage.objects;
CREATE POLICY storage_documents_select_authorized
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (
      (
        (storage.foldername(name))[1] = 'documents'
        AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
        AND (SELECT app.account_is_active())
      )
      OR (SELECT app.has_permission('document.review'))
    )
  );

DROP POLICY IF EXISTS storage_documents_insert_own ON storage.objects;
CREATE POLICY storage_documents_insert_own
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS storage_documents_update_own ON storage.objects;
CREATE POLICY storage_documents_update_own
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (SELECT app.account_is_active())
  )
  WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (SELECT app.account_is_active())
  );

DROP POLICY IF EXISTS storage_documents_delete_own ON storage.objects;
CREATE POLICY storage_documents_delete_own
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = 'documents'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    AND (SELECT app.account_is_active())
  );

-- ---------------------------------------------------------------------------
-- Least-privilege function execution. PostgreSQL grants EXECUTE to PUBLIC on
-- new functions by default, so revoke schema-wide and grant only RLS helpers.
-- ---------------------------------------------------------------------------
REVOKE ALL ON SCHEMA app FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app TO authenticated, supabase_auth_admin;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.uid() TO authenticated;
GRANT EXECUTE ON FUNCTION app.account_is_active() TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.has_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_exco_viewer() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_exco_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION app.own_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION app.owns_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app.associated_business(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app.handle_new_auth_user() TO supabase_auth_admin;

-- Re-assert the Phase 21 PostgREST closure.
REVOKE SELECT ON public.directory_professionals FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION app.directory_professionals() FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA app
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
