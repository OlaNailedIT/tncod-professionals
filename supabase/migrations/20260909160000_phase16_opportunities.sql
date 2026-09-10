-- Phase 16 — Opportunities V1.1 (connection-engine seed)
-- Refine existing opportunities for EXCO-curated posts + member interest.
-- Prisma is not migration authority.

-- ========== 1. Opportunity type enum (replace Phase 2 member-intent types) ==========
CREATE TYPE "OpportunityType_p16" AS ENUM (
  'JOBS',
  'BUSINESS',
  'COLLABORATION',
  'TRAINING',
  'MENTORSHIP',
  'OTHER'
);

ALTER TABLE public.opportunities
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE public.opportunities
  ALTER COLUMN type TYPE "OpportunityType_p16"
  USING (
    CASE type::text
      WHEN 'SEEKING_EMPLOYMENT' THEN 'JOBS'::"OpportunityType_p16"
      WHEN 'OFFERING_SERVICES' THEN 'BUSINESS'::"OpportunityType_p16"
      WHEN 'COLLABORATION' THEN 'COLLABORATION'::"OpportunityType_p16"
      ELSE 'OTHER'::"OpportunityType_p16"
    END
  );

DROP TYPE "OpportunityType";
ALTER TYPE "OpportunityType_p16" RENAME TO "OpportunityType";

-- ========== 2. Creator + publish metadata ==========
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ(6);

-- Backfill created_by from owning profile's user
UPDATE public.opportunities o
SET created_by = p.user_id
FROM public.profiles p
WHERE o.profile_id = p.id
  AND o.created_by IS NULL;

-- Any remaining (should be none) — fail closed by requiring a user
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.opportunities WHERE created_by IS NULL) THEN
    RAISE EXCEPTION 'phase16: opportunities.created_by backfill incomplete';
  END IF;
END $$;

ALTER TABLE public.opportunities
  ALTER COLUMN created_by SET NOT NULL;

-- Platform opportunities no longer require a member profile owner
ALTER TABLE public.opportunities
  ALTER COLUMN profile_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS opportunities_created_by_idx ON public.opportunities (created_by);
CREATE INDEX IF NOT EXISTS opportunities_status_created_at_idx
  ON public.opportunities (status, created_at DESC);
CREATE INDEX IF NOT EXISTS opportunities_published_at_idx ON public.opportunities (published_at);

COMMENT ON COLUMN public.opportunities.created_by IS
  'Phase 16 authoritative creator (session user). Client cannot supply.';
COMMENT ON COLUMN public.opportunities.profile_id IS
  'Legacy member-intent owner; nullable for EXCO-curated platform opportunities.';
COMMENT ON COLUMN public.opportunities.published_at IS
  'Set when status becomes ACTIVE for the first time.';

-- ========== 3. Interest relationship ==========
CREATE TABLE IF NOT EXISTS public.opportunity_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE ON UPDATE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT opportunity_interests_pkey PRIMARY KEY (id),
  CONSTRAINT opportunity_interests_one_per_member_uq UNIQUE (opportunity_id, profile_id)
);

CREATE INDEX IF NOT EXISTS opportunity_interests_profile_id_idx
  ON public.opportunity_interests (profile_id);
CREATE INDEX IF NOT EXISTS opportunity_interests_opportunity_id_idx
  ON public.opportunity_interests (opportunity_id);

COMMENT ON TABLE public.opportunity_interests IS
  'Phase 16 connection signal only. Not application, consent, match, or contact exchange.';

ALTER TABLE public.opportunity_interests ENABLE ROW LEVEL SECURITY;

-- Members: own interest only. EXCO: read for ops (no CRM UI required; RLS allows Viewer+).
CREATE POLICY opportunity_interests_select ON public.opportunity_interests
  FOR SELECT TO authenticated
  USING (
    app.owns_profile(profile_id)
    OR app.is_exco_viewer()
  );

CREATE POLICY opportunity_interests_insert_own ON public.opportunity_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    app.owns_profile(profile_id)
    AND app.account_is_active()
  );

CREATE POLICY opportunity_interests_delete_own ON public.opportunity_interests
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id));

-- No UPDATE policy — interest is create/delete only.

-- ========== 4. Opportunities RLS (EXCO create; members read ACTIVE) ==========
DROP POLICY IF EXISTS opportunities_select ON public.opportunities;
DROP POLICY IF EXISTS opportunities_write_own ON public.opportunities;
DROP POLICY IF EXISTS opportunities_update ON public.opportunities;
DROP POLICY IF EXISTS opportunities_delete ON public.opportunities;

CREATE POLICY opportunities_select ON public.opportunities
  FOR SELECT TO authenticated
  USING (
    app.is_exco_viewer()
    OR status = 'ACTIVE'
  );

CREATE POLICY opportunities_insert_manage ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (app.has_permission('opportunity.manage'));

CREATE POLICY opportunities_update_manage ON public.opportunities
  FOR UPDATE TO authenticated
  USING (app.has_permission('opportunity.manage'))
  WITH CHECK (app.has_permission('opportunity.manage'));

-- No client DELETE — close via status update.

-- ========== 5. MEMBER may view but not manage platform opportunities ==========
-- Remove opportunity.manage from MEMBER role grants (keep opportunity.view).
DELETE FROM public.role_permissions rp
USING public.roles r, public.permissions p
WHERE rp.role_id = r.id
  AND rp.permission_id = p.id
  AND r.name = 'MEMBER'
  AND p.key = 'opportunity.manage';
