-- Phase 9 — Business profile & verification (additive)
-- Preserves business_professionals M:N. No businesses.profile_id.
-- Does not weaken visibility/publication rules.

-- 1) Extend business_status for clarification (member-facing lifecycle mapping)
ALTER TYPE "BusinessStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CLARIFICATION';

-- 2) Business content fields for Phase 9 requirements not already present
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS services_offered TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cac_registered BOOLEAN,
  ADD COLUMN IF NOT EXISTS clarification_message TEXT;

COMMENT ON COLUMN public.businesses.social_links IS
  'Structured social URLs (linkedin, twitter/x, facebook, instagram). Not scraped.';
COMMENT ON COLUMN public.businesses.services_offered IS
  'Business services (distinct from profile_services).';
COMMENT ON COLUMN public.businesses.cac_registered IS
  'Member-claimed CAC registration flag. Not independently verified by claim alone.';
COMMENT ON COLUMN public.businesses.clarification_message IS
  'Member-facing clarification/rejection guidance from EXCO. Not private admin notes.';

-- 3) Allow associated members to SUBMIT/RESUBMIT only when JWT present;
--    privileged Prisma path (auth.uid() null) relies on application domain authz.
CREATE OR REPLACE FUNCTION app.guard_business_privileged_columns()
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
    IF NEW.business_status IS DISTINCT FROM OLD.business_status THEN
      IF app.associated_business(NEW.id)
         AND NEW.business_status = 'SUBMITTED'
         AND OLD.business_status IN ('DRAFT', 'NEEDS_CLARIFICATION', 'REJECTED') THEN
        NULL;
      ELSE
        RAISE EXCEPTION 'privileged_field: business_status';
      END IF;
    END IF;
    IF NEW.visibility_status IS DISTINCT FROM OLD.visibility_status THEN
      RAISE EXCEPTION 'privileged_field: business visibility_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- EXCO_VIEWER may list submitted businesses for verification queue (read-only), not only APPROVED.
DROP POLICY IF EXISTS businesses_select_associated ON public.businesses;
CREATE POLICY businesses_select_associated ON public.businesses
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      app.associated_business(id)
      OR app.is_exco_admin()
      OR (
        app.has_role('EXCO_VIEWER')
        AND business_status IN ('SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'NEEDS_CLARIFICATION', 'REJECTED')
      )
    )
  );

-- Strong uniqueness when CAC number is supplied (advisory for unregistered businesses remains name-based only).
CREATE UNIQUE INDEX IF NOT EXISTS businesses_cac_number_unique
  ON public.businesses (cac_number)
  WHERE cac_number IS NOT NULL AND btrim(cac_number) <> '' AND deleted_at IS NULL;
