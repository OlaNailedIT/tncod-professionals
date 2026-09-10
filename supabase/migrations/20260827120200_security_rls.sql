-- Requires Supabase: auth.uid(), roles anon + authenticated.
-- Not applicable to vanilla PostgreSQL without those objects.
-- Prisma privileged DATABASE_URL bypasses RLS.

-- TNCOD Professionals — RLS helpers (APPLIED VIA MIGRATION — requires Supabase auth.uid() and roles anon/authenticated)
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


-- TNCOD Professionals — table RLS (DESIGN ONLY, NOT APPLIED)
-- Default deny: ENABLE ROW LEVEL SECURITY; no policy = no access for that command.
-- anon is not granted SELECT on sensitive base tables.
-- Prisma privileged DATABASE_URL bypasses these policies — domain authz remains mandatory.

-- ========== Enable RLS ==========
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ========== Directory projection (anon + authenticated) ==========
-- SECURITY DEFINER so anon never needs SELECT on profiles.
CREATE OR REPLACE FUNCTION app.directory_professionals()
RETURNS TABLE (
  public_slug text,
  display_name text,
  headline text,
  location text,
  profession text,
  professional_title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.public_slug,
    p.display_name,
    p.headline,
    p.location,
    pd.profession,
    pd.professional_title
  FROM public.profiles p
  LEFT JOIN public.professional_details pd ON pd.profile_id = p.id
  WHERE p.visibility_status = 'DIRECTORY'
    AND p.verification_status = 'VERIFIED'
    AND p.deleted_at IS NULL
$$;

CREATE OR REPLACE VIEW public.directory_professionals AS
SELECT * FROM app.directory_professionals();

GRANT USAGE ON SCHEMA app TO anon;
GRANT EXECUTE ON FUNCTION app.directory_professionals() TO anon, authenticated;
GRANT SELECT ON public.directory_professionals TO anon, authenticated;

-- ========== users ==========
-- SELECT: own row. Email/phone are MEMBER_PRIVATE — not EXCO_VIEWER.
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() AND app.account_is_active());

CREATE POLICY users_select_admin ON public.users
  FOR SELECT TO authenticated
  USING (app.is_exco_admin() AND app.account_is_active());

-- INSERT: NO POLICY (auth trigger / service role only)
-- UPDATE: own limited columns enforced by trigger; Super Admin account_status
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND app.account_is_active())
  WITH CHECK (id = auth.uid());

CREATE POLICY users_update_super ON public.users
  FOR UPDATE TO authenticated
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());

-- DELETE: NO POLICY

-- ========== profiles ==========
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY profiles_select_members_only ON public.profiles
  FOR SELECT TO authenticated
  USING (
    app.account_is_active()
    AND deleted_at IS NULL
    AND visibility_status = 'MEMBERS_ONLY'
    AND verification_status = 'VERIFIED'
  );

CREATE POLICY profiles_select_exco ON public.profiles
  FOR SELECT TO authenticated
  USING (app.is_exco_viewer() AND deleted_at IS NULL);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND app.account_is_active());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND app.account_is_active())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (app.is_exco_admin())
  WITH CHECK (app.is_exco_admin());

-- DELETE: NO POLICY (soft-delete via UPDATE by admin)

-- ========== professional_details / experiences ==========
-- Never FOR ALL with a Viewer USING clause — Viewer would inherit DELETE.
CREATE POLICY professional_details_select ON public.professional_details
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_viewer());

CREATE POLICY professional_details_insert ON public.professional_details
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY professional_details_update ON public.professional_details
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_admin())
  WITH CHECK (app.owns_profile(profile_id) OR app.is_exco_admin());

CREATE POLICY professional_details_delete ON public.professional_details
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

CREATE POLICY experiences_select ON public.experiences
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_viewer());

CREATE POLICY experiences_write_own ON public.experiences
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id) AND app.account_is_active());

CREATE POLICY experiences_update_own ON public.experiences
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id))
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY experiences_delete_own ON public.experiences
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

-- ========== taxonomies (read active; write Super Admin) ==========
CREATE POLICY skills_select ON public.skills FOR SELECT TO authenticated USING (is_active OR app.is_super_admin());
CREATE POLICY services_select ON public.services FOR SELECT TO authenticated USING (is_active OR app.is_super_admin());
CREATE POLICY industries_select ON public.industries FOR SELECT TO authenticated USING (is_active OR app.is_super_admin());

CREATE POLICY skills_insert_super ON public.skills FOR INSERT TO authenticated
  WITH CHECK (app.is_super_admin());
CREATE POLICY skills_update_super ON public.skills FOR UPDATE TO authenticated
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());
CREATE POLICY skills_delete_super ON public.skills FOR DELETE TO authenticated
  USING (app.is_super_admin());
CREATE POLICY services_insert_super ON public.services FOR INSERT TO authenticated
  WITH CHECK (app.is_super_admin());
CREATE POLICY services_update_super ON public.services FOR UPDATE TO authenticated
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());
CREATE POLICY services_delete_super ON public.services FOR DELETE TO authenticated
  USING (app.is_super_admin());
CREATE POLICY industries_insert_super ON public.industries FOR INSERT TO authenticated
  WITH CHECK (app.is_super_admin());
CREATE POLICY industries_update_super ON public.industries FOR UPDATE TO authenticated
  USING (app.is_super_admin()) WITH CHECK (app.is_super_admin());
CREATE POLICY industries_delete_super ON public.industries FOR DELETE TO authenticated
  USING (app.is_super_admin());

-- ========== profile_skills / profile_services ==========
CREATE POLICY profile_skills_select ON public.profile_skills
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_viewer());
CREATE POLICY profile_skills_insert ON public.profile_skills
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id));
CREATE POLICY profile_skills_delete ON public.profile_skills
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

CREATE POLICY profile_services_select ON public.profile_services
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_viewer());
CREATE POLICY profile_services_insert ON public.profile_services
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id));
CREATE POLICY profile_services_delete ON public.profile_services
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

-- ========== businesses ==========
CREATE POLICY businesses_select_associated ON public.businesses
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      app.associated_business(id)
      OR app.is_exco_admin()
      OR (app.has_role('EXCO_VIEWER') AND business_status = 'APPROVED')
    )
  );

CREATE POLICY businesses_insert ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (app.account_is_active());
-- Phase 4 domain: INSERT business + business_professionals in one authorized transaction.
-- RLS alone does not prevent an orphan business row.

CREATE POLICY businesses_update_associated ON public.businesses
  FOR UPDATE TO authenticated
  USING (app.associated_business(id) AND app.account_is_active())
  WITH CHECK (app.associated_business(id));

CREATE POLICY businesses_update_admin ON public.businesses
  FOR UPDATE TO authenticated
  USING (app.is_exco_admin())
  WITH CHECK (app.is_exco_admin());

-- ========== business_professionals ==========
CREATE POLICY bp_select ON public.business_professionals
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.associated_business(business_id) OR app.is_exco_viewer());

CREATE POLICY bp_insert ON public.business_professionals
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id) OR app.is_exco_admin());

CREATE POLICY bp_delete ON public.business_professionals
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_admin());

-- ========== opportunities ==========
CREATE POLICY opportunities_select ON public.opportunities
  FOR SELECT TO authenticated
  USING (
    app.owns_profile(profile_id)
    OR app.is_exco_admin()
    OR (app.has_role('EXCO_VIEWER') AND status <> 'DRAFT')
  );

CREATE POLICY opportunities_write_own ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY opportunities_update ON public.opportunities
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_admin())
  WITH CHECK (app.owns_profile(profile_id) OR app.is_exco_admin());

CREATE POLICY opportunities_delete ON public.opportunities
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_admin());

-- ========== church_information — never anon / directory ==========
CREATE POLICY church_select_own ON public.church_information
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id) OR app.is_exco_admin());

CREATE POLICY church_write_own ON public.church_information
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY church_update_own ON public.church_information
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id))
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY church_delete_own ON public.church_information
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

-- EXCO_VIEWER: NO POLICY on church (need-based later = new explicit policy)

-- ========== documents ==========
CREATE POLICY documents_select_own ON public.documents
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id));

CREATE POLICY documents_select_review ON public.documents
  FOR SELECT TO authenticated
  USING (app.has_permission('document.review'));

CREATE POLICY documents_insert_own ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id) AND app.account_is_active());

CREATE POLICY documents_update_own ON public.documents
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id))
  WITH CHECK (app.owns_profile(profile_id));

CREATE POLICY documents_update_review ON public.documents
  FOR UPDATE TO authenticated
  USING (app.has_permission('document.review'))
  WITH CHECK (app.has_permission('document.review'));

-- DELETE: NO POLICY until retention policy exists

-- ========== consents — insert new rows; no UPDATE of history except withdraw ==========
CREATE POLICY consents_select_own ON public.consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY consents_select_admin ON public.consents
  FOR SELECT TO authenticated
  USING (app.is_exco_admin());

CREATE POLICY consents_insert_own ON public.consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY consents_update_withdraw ON public.consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND withdrawn_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- DELETE: NO POLICY

-- ========== verification_records ==========
CREATE POLICY verification_select_admin ON public.verification_records
  FOR SELECT TO authenticated
  USING (app.is_exco_admin());

CREATE POLICY verification_insert_admin ON public.verification_records
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission('professional.verify') OR app.has_permission('business.verify'));

-- UPDATE/DELETE: NO POLICY (append-only)

-- ========== publications ==========
CREATE POLICY publications_select_admin ON public.publications
  FOR SELECT TO authenticated
  USING (app.is_exco_admin());

CREATE POLICY publications_insert_admin ON public.publications
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission('professional.publish') OR app.has_permission('business.publish'));

-- UPDATE/DELETE: NO POLICY

-- ========== admin_notes — Viewer has NO policy ==========
CREATE POLICY admin_notes_select ON public.admin_notes
  FOR SELECT TO authenticated
  USING (app.is_exco_admin());
CREATE POLICY admin_notes_insert ON public.admin_notes
  FOR INSERT TO authenticated
  WITH CHECK (app.is_exco_admin());
CREATE POLICY admin_notes_update ON public.admin_notes
  FOR UPDATE TO authenticated
  USING (app.is_exco_admin())
  WITH CHECK (app.is_exco_admin());
CREATE POLICY admin_notes_delete ON public.admin_notes
  FOR DELETE TO authenticated
  USING (app.is_exco_admin());

-- ========== spotlights ==========
CREATE POLICY spotlights_select_admin ON public.spotlights
  FOR SELECT TO authenticated
  USING (app.is_exco_admin() OR status = 'PUBLISHED');

CREATE POLICY spotlights_write_admin ON public.spotlights
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission('spotlight.manage'));

CREATE POLICY spotlights_update_admin ON public.spotlights
  FOR UPDATE TO authenticated
  USING (app.has_permission('spotlight.manage'))
  WITH CHECK (app.has_permission('spotlight.manage'));

-- ========== notifications ==========
CREATE POLICY notifications_own ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update_read ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE: NO POLICY (system / service role)

-- ========== audit_logs ==========
CREATE POLICY audit_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (app.has_permission('audit.view'));

-- INSERT/UPDATE/DELETE: NO POLICY (service role / SECURITY DEFINER writer only)

-- ========== RBAC tables ==========
CREATE POLICY roles_select_assigned ON public.roles
  FOR SELECT TO authenticated
  USING (
    app.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.role_id = roles.id AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY permissions_select_super ON public.permissions
  FOR SELECT TO authenticated
  USING (app.is_super_admin());

CREATE POLICY user_roles_select_super ON public.user_roles
  FOR SELECT TO authenticated
  USING (app.is_super_admin() OR user_id = auth.uid());

CREATE POLICY user_roles_insert_super ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (app.is_super_admin());
CREATE POLICY user_roles_update_super ON public.user_roles
  FOR UPDATE TO authenticated
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());
CREATE POLICY user_roles_delete_super ON public.user_roles
  FOR DELETE TO authenticated
  USING (app.is_super_admin());

CREATE POLICY role_permissions_select_super ON public.role_permissions
  FOR SELECT TO authenticated
  USING (app.is_super_admin());
CREATE POLICY role_permissions_insert_super ON public.role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (app.is_super_admin());
CREATE POLICY role_permissions_update_super ON public.role_permissions
  FOR UPDATE TO authenticated
  USING (app.is_super_admin())
  WITH CHECK (app.is_super_admin());
CREATE POLICY role_permissions_delete_super ON public.role_permissions
  FOR DELETE TO authenticated
  USING (app.is_super_admin());


-- Privileged column guards (DESIGN ONLY, NOT APPLIED)
-- Row access (RLS) ≠ column mutability ≠ domain workflow authorization.

CREATE OR REPLACE FUNCTION app.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NOT app.is_exco_admin() THEN
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'privileged_field: verification_status';
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


-- Privileged-column triggers (frozen Phase 3 design, applied at database gate when Postgres exists).

DROP TRIGGER IF EXISTS trg_guard_profile_privileged ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_profile_privileged_columns();

DROP TRIGGER IF EXISTS trg_guard_profile_insert ON public.profiles;
CREATE TRIGGER trg_guard_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_profile_insert();

DROP TRIGGER IF EXISTS trg_guard_business_privileged ON public.businesses;
CREATE TRIGGER trg_guard_business_privileged
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_business_privileged_columns();

DROP TRIGGER IF EXISTS trg_guard_users_privileged ON public.users;
CREATE TRIGGER trg_guard_users_privileged
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_users_privileged_columns();

DROP TRIGGER IF EXISTS trg_guard_document_storage_key ON public.documents;
CREATE TRIGGER trg_guard_document_storage_key
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_document_storage_key();

DROP TRIGGER IF EXISTS trg_guard_consent_history ON public.consents;
CREATE TRIGGER trg_guard_consent_history
  BEFORE UPDATE ON public.consents
  FOR EACH ROW
  EXECUTE FUNCTION app.guard_consent_history();
