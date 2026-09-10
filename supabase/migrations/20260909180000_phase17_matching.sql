-- Phase 17 — Deterministic Matching (structured requirements only)
-- Additive refinement of opportunities + opportunity_skills.
-- No AI. No persisted match rows. Prisma is not migration authority.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS required_profession TEXT;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS min_years_experience INTEGER;

COMMENT ON COLUMN public.opportunities.required_profession IS
  'Phase 17: optional structured profession requirement. Case-insensitive exact match against professional_details.profession.';
COMMENT ON COLUMN public.opportunities.min_years_experience IS
  'Phase 17: optional minimum years_experience. Professional years_experience must be >= this value.';

ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_min_years_experience_chk;
ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_min_years_experience_chk
  CHECK (min_years_experience IS NULL OR (min_years_experience >= 0 AND min_years_experience <= 80));

CREATE TABLE IF NOT EXISTS public.opportunity_skills (
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE ON UPDATE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT opportunity_skills_pkey PRIMARY KEY (opportunity_id, skill_id)
);

CREATE INDEX IF NOT EXISTS opportunity_skills_skill_id_idx
  ON public.opportunity_skills (skill_id);

COMMENT ON TABLE public.opportunity_skills IS
  'Phase 17: required skills for deterministic matching. ALL listed skills must be present on the professional.';

ALTER TABLE public.opportunity_skills ENABLE ROW LEVEL SECURITY;

-- Same visibility as opportunities: EXCO all, members ACTIVE opportunities' skills only.
CREATE POLICY opportunity_skills_select ON public.opportunity_skills
  FOR SELECT TO authenticated
  USING (
    app.is_exco_viewer()
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id AND o.status = 'ACTIVE'
    )
  );

CREATE POLICY opportunity_skills_write ON public.opportunity_skills
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission('opportunity.manage'));

CREATE POLICY opportunity_skills_delete ON public.opportunity_skills
  FOR DELETE TO authenticated
  USING (app.has_permission('opportunity.manage'));
