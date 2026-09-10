-- Phase 12 — Verification centre foundation
-- Additive: professional clarification_message; member submit transition in privileged guard.
-- Prisma is not migration authority.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clarification_message TEXT;

COMMENT ON COLUMN public.profiles.clarification_message IS
  'Member-facing clarification/rejection guidance from EXCO. Not private admin notes.';

-- Allow JWT members to perform submit/resubmit into PENDING only.
-- Privileged Prisma (auth.uid null) still requires mandatory domain authorization in app code.
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
