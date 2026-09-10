-- Phase 14 — field/group visibility preferences (member comfort settings).
-- Visibility preference ≠ legal consent. Do not write consents from this table.
-- Preference never grants access; public exposure still requires VERIFIED ∧ DIRECTORY ∧ Phase 13 allowlist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'VisibilityPreferenceLevel'
  ) THEN
    CREATE TYPE public."VisibilityPreferenceLevel" AS ENUM ('PRIVATE', 'MEMBERS', 'PUBLIC');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profile_visibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
  group_key TEXT NOT NULL,
  preference public."VisibilityPreferenceLevel" NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_visibility_preferences_profile_group_uq UNIQUE (profile_id, group_key),
  CONSTRAINT profile_visibility_preferences_group_key_chk CHECK (
    group_key IN (
      'identity',
      'about',
      'professional',
      'skills_services',
      'location',
      'contact',
      'links',
      'community',
      'opportunities',
      'business'
    )
  ),
  CONSTRAINT profile_visibility_preferences_level_by_group_chk CHECK (
    (group_key IN ('contact', 'community') AND preference = 'PRIVATE')
    OR (group_key IN ('about', 'links', 'opportunities', 'business') AND preference IN ('PRIVATE', 'MEMBERS'))
    OR (group_key IN ('identity', 'professional', 'skills_services', 'location') AND preference IN ('PRIVATE', 'MEMBERS', 'PUBLIC'))
  )
);

CREATE INDEX IF NOT EXISTS profile_visibility_preferences_profile_id_idx
  ON public.profile_visibility_preferences (profile_id);

COMMENT ON TABLE public.profile_visibility_preferences IS
  'Phase 14 member visibility preferences by field group. Not legal consent. Preference ∩ allowlist ∩ eligibility ∩ authz.';

COMMENT ON COLUMN public.profile_visibility_preferences.preference IS
  'PRIVATE | MEMBERS | PUBLIC — UX labels: Private / TNCOD members / Public directory.';

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION app.touch_profile_visibility_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_visibility_preferences_updated_at
  ON public.profile_visibility_preferences;
CREATE TRIGGER trg_profile_visibility_preferences_updated_at
  BEFORE UPDATE ON public.profile_visibility_preferences
  FOR EACH ROW
  EXECUTE FUNCTION app.touch_profile_visibility_preferences_updated_at();

-- Seed defaults for every profile (idempotent)
INSERT INTO public.profile_visibility_preferences (profile_id, group_key, preference)
SELECT p.id, g.group_key, g.preference::public."VisibilityPreferenceLevel"
FROM public.profiles p
CROSS JOIN (
  VALUES
    ('identity', 'PUBLIC'),
    ('about', 'PRIVATE'),
    ('professional', 'PUBLIC'),
    ('skills_services', 'PUBLIC'),
    ('location', 'PUBLIC'),
    ('contact', 'PRIVATE'),
    ('links', 'PRIVATE'),
    ('community', 'PRIVATE'),
    ('opportunities', 'PRIVATE'),
    ('business', 'PRIVATE')
) AS g(group_key, preference)
ON CONFLICT (profile_id, group_key) DO NOTHING;

-- New profiles get defaults automatically
CREATE OR REPLACE FUNCTION app.seed_profile_visibility_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app
AS $$
BEGIN
  INSERT INTO public.profile_visibility_preferences (profile_id, group_key, preference)
  VALUES
    (NEW.id, 'identity', 'PUBLIC'),
    (NEW.id, 'about', 'PRIVATE'),
    (NEW.id, 'professional', 'PUBLIC'),
    (NEW.id, 'skills_services', 'PUBLIC'),
    (NEW.id, 'location', 'PUBLIC'),
    (NEW.id, 'contact', 'PRIVATE'),
    (NEW.id, 'links', 'PRIVATE'),
    (NEW.id, 'community', 'PRIVATE'),
    (NEW.id, 'opportunities', 'PRIVATE'),
    (NEW.id, 'business', 'PRIVATE')
  ON CONFLICT (profile_id, group_key) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_seed_visibility_preferences ON public.profiles;
CREATE TRIGGER trg_profiles_seed_visibility_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION app.seed_profile_visibility_preferences();

-- RLS: owner only (EXCO does not need preference rows for ops)
ALTER TABLE public.profile_visibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_visibility_preferences FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_visibility_preferences_select_own ON public.profile_visibility_preferences;
CREATE POLICY profile_visibility_preferences_select_own
  ON public.profile_visibility_preferences
  FOR SELECT TO authenticated
  USING (app.owns_profile(profile_id));

DROP POLICY IF EXISTS profile_visibility_preferences_insert_own ON public.profile_visibility_preferences;
CREATE POLICY profile_visibility_preferences_insert_own
  ON public.profile_visibility_preferences
  FOR INSERT TO authenticated
  WITH CHECK (app.owns_profile(profile_id) AND app.account_is_active());

DROP POLICY IF EXISTS profile_visibility_preferences_update_own ON public.profile_visibility_preferences;
CREATE POLICY profile_visibility_preferences_update_own
  ON public.profile_visibility_preferences
  FOR UPDATE TO authenticated
  USING (app.owns_profile(profile_id) AND app.account_is_active())
  WITH CHECK (app.owns_profile(profile_id) AND app.account_is_active());

DROP POLICY IF EXISTS profile_visibility_preferences_delete_own ON public.profile_visibility_preferences;
CREATE POLICY profile_visibility_preferences_delete_own
  ON public.profile_visibility_preferences
  FOR DELETE TO authenticated
  USING (app.owns_profile(profile_id) AND app.account_is_active());

REVOKE ALL ON public.profile_visibility_preferences FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_visibility_preferences TO authenticated;
-- Anon: no access
REVOKE ALL ON public.profile_visibility_preferences FROM anon;
