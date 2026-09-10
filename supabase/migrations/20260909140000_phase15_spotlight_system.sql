-- Phase 15 — Spotlight System
-- Additive: member spotlight_interest; one non-ARCHIVED spotlight per profile;
-- EXCO-only SELECT (tighten published visibility for V1);
-- member-owned interest guard (EXCO JWT cannot override).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spotlight_interest BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.spotlight_interest IS
  'Phase 15 member interest in being featured. Not legal consent. Not Phase 14 visibility. EXCO cannot override.';

-- At most one active (non-ARCHIVED) Spotlight per profile
CREATE UNIQUE INDEX IF NOT EXISTS spotlights_one_active_per_profile_uq
  ON public.spotlights (profile_id)
  WHERE status <> 'ARCHIVED';

COMMENT ON INDEX public.spotlights_one_active_per_profile_uq IS
  'Phase 15: max one DRAFT|SCHEDULED|PUBLISHED Spotlight per profile; ARCHIVED history unlimited.';

-- EXCO-only V1: viewers/admins may read all Spotlights; members/anon cannot.
DROP POLICY IF EXISTS spotlights_select_admin ON public.spotlights;
DROP POLICY IF EXISTS spotlights_select_exco ON public.spotlights;
CREATE POLICY spotlights_select_exco ON public.spotlights
  FOR SELECT TO authenticated
  USING (app.is_exco_viewer());

-- Member-owned spotlight_interest: JWT EXCO cannot override; only profile owner may change via JWT.
-- Privileged Prisma (auth.uid null) relies on domain authorization (updateOwnSpotlightInterest only).
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

  IF TG_OP = 'UPDATE' THEN
    -- Spotlight interest is member-owned (Phase 15). Not EXCO-overridable via JWT.
    IF NEW.spotlight_interest IS DISTINCT FROM OLD.spotlight_interest THEN
      IF NOT app.owns_profile(NEW.id) THEN
        RAISE EXCEPTION 'privileged_field: spotlight_interest is member-owned';
      END IF;
    END IF;

    IF NOT app.is_exco_admin() THEN
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
  END IF;
  RETURN NEW;
END;
$$;
