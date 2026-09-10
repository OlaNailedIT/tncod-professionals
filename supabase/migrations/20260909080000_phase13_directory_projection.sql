-- Phase 13 — Extend authoritative public directory projection
-- Eligibility unchanged: VERIFIED + DIRECTORY + not deleted
-- Additive allowlist fields only. Prisma is not migration authority.

DROP VIEW IF EXISTS public.directory_professionals;
DROP FUNCTION IF EXISTS app.directory_professionals();

CREATE FUNCTION app.directory_professionals()
RETURNS TABLE (
  public_slug text,
  display_name text,
  headline text,
  location text,
  profession text,
  professional_title text,
  industry_name text,
  skill_names text[],
  service_names text[]
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
    pd.professional_title,
    i.name AS industry_name,
    COALESCE(
      (
        SELECT array_agg(s.name ORDER BY s.name)
        FROM public.profile_skills ps
        INNER JOIN public.skills s ON s.id = ps.skill_id AND s.is_active = true
        WHERE ps.profile_id = p.id
      ),
      '{}'::text[]
    ) AS skill_names,
    COALESCE(
      (
        SELECT array_agg(sv.name ORDER BY sv.name)
        FROM public.profile_services psv
        INNER JOIN public.services sv ON sv.id = psv.service_id AND sv.is_active = true
        WHERE psv.profile_id = p.id
      ),
      '{}'::text[]
    ) AS service_names
  FROM public.profiles p
  LEFT JOIN public.professional_details pd ON pd.profile_id = p.id
  LEFT JOIN public.industries i ON i.id = pd.industry_id AND i.is_active = true
  WHERE p.visibility_status = 'DIRECTORY'
    AND p.verification_status = 'VERIFIED'
    AND p.deleted_at IS NULL
    AND p.public_slug IS NOT NULL
$$;

CREATE VIEW public.directory_professionals AS
SELECT * FROM app.directory_professionals();

GRANT SELECT ON public.directory_professionals TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app.directory_professionals() TO anon, authenticated;

COMMENT ON FUNCTION app.directory_professionals() IS
  'Phase 13 public directory projection. Allowlisted columns only. VERIFIED+DIRECTORY gate.';
