-- Narrow current-interest reads.
-- Members keep their own row. EXCO_ADMIN and SUPER_ADMIN may read for follow-up.
-- EXCO_VIEWER no longer satisfies the blanket EXCO select.
-- The application loader also checks roles. Prisma bypasses RLS.

DROP POLICY IF EXISTS opportunity_interests_select ON public.opportunity_interests;

CREATE POLICY opportunity_interests_select ON public.opportunity_interests
  FOR SELECT TO authenticated
  USING (
    app.owns_profile(profile_id)
    OR app.is_exco_admin()
  );
