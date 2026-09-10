-- TNCOD Professionals — RLS helpers (DESIGN ONLY)
-- Status: NOT APPLIED. Fold into supabase/migrations in the database gate / Phase 4.
-- Do not use USING (true) on sensitive tables.
-- Identity: auth.uid() = public.users.id

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION app.account_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
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
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name::text = p_role
  )
$$;

CREATE OR REPLACE FUNCTION app.has_permission(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND p.key = p_key
  )
$$;

-- Read-tier helper: EXCO_VIEWER or higher. Not "exactly Viewer".
-- Never use this USING clause on FOR INSERT/UPDATE/DELETE.
CREATE OR REPLACE FUNCTION app.is_exco_viewer()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.has_role('EXCO_VIEWER') OR app.has_role('EXCO_ADMIN') OR app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.is_exco_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.has_role('EXCO_ADMIN') OR app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT app.has_role('SUPER_ADMIN')
$$;

CREATE OR REPLACE FUNCTION app.own_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
    AND p.deleted_at IS NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION app.owns_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_profile_id IS NOT NULL AND p_profile_id = app.own_profile_id()
$$;

CREATE OR REPLACE FUNCTION app.associated_business(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_professionals bp
    WHERE bp.business_id = p_business_id
      AND bp.profile_id = app.own_profile_id()
  )
$$;

REVOKE ALL ON SCHEMA app FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;
-- Directory projection only (see 10-rls-policies.sql): GRANT USAGE + EXECUTE
-- on app.directory_professionals() to anon. Do not grant other app.* to anon.
