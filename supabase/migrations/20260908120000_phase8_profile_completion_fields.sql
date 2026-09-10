-- Phase 8 forensic reconciliation — minimal additive fields only.
-- Does not redesign Phase 2 ownership, statuses, or business_professionals.
-- Industry taxonomy already exists; person-level link was missing.
-- Opportunity preference flags are profile intent, not marketplace rows.

ALTER TABLE public.professional_details
  ADD COLUMN IF NOT EXISTS industry_id UUID,
  ADD COLUMN IF NOT EXISTS opportunity_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_details_industry_id_fkey'
  ) THEN
    ALTER TABLE public.professional_details
      ADD CONSTRAINT professional_details_industry_id_fkey
      FOREIGN KEY (industry_id)
      REFERENCES public.industries(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS professional_details_industry_id_idx
  ON public.professional_details(industry_id);

COMMENT ON COLUMN public.professional_details.industry_id IS
  'Person-level industry (taxonomy). Distinct from organisation_name (workplace) and businesses.industry_id.';

COMMENT ON COLUMN public.professional_details.opportunity_preferences IS
  'Member intent flags: collaboration, mentorship, referrals, training as JSON booleans (null/absent = unset). Not marketplace Opportunity rows.';

-- Seed catalogue (idempotent on slug). updated_at is NOT NULL without default in Phase 2 DDL.
INSERT INTO public.industries (name, slug, description, is_active, updated_at)
VALUES
  ('Technology', 'technology', 'Software, IT, telecoms', true, NOW()),
  ('Financial services', 'financial-services', 'Banking, insurance, fintech', true, NOW()),
  ('Healthcare', 'healthcare', 'Clinical and health services', true, NOW()),
  ('Education', 'education', 'Teaching, training, academia', true, NOW()),
  ('Professional services', 'professional-services', 'Legal, accounting, consulting', true, NOW()),
  ('Creative & media', 'creative-media', 'Design, media, communications', true, NOW()),
  ('Construction & engineering', 'construction-engineering', null, true, NOW()),
  ('Retail & trade', 'retail-trade', null, true, NOW()),
  ('Faith & community organisations', 'faith-community', null, true, NOW()),
  ('Other', 'other', 'Catch-all when no better match', true, NOW())
ON CONFLICT (slug) DO NOTHING;
