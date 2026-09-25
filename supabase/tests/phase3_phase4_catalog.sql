\set ON_ERROR_STOP on

DO $$
DECLARE
  n integer;
  names text;
BEGIN
  SELECT count(*) INTO n FROM supabase_migrations.schema_migrations;
  IF n <> 18 THEN
    RAISE EXCEPTION 'expected 18 migrations, found %', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'app'
    AND NOT EXISTS (
      SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}'::text[])) setting
      WHERE setting LIKE 'search_path=%'
    );
  IF n <> 0 THEN
    RAISE EXCEPTION '% app functions have no fixed search_path', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) acl
  WHERE ns.nspname = 'app'
    AND acl.grantee = 0
    AND acl.privilege_type = 'EXECUTE';
  IF n <> 0 THEN
    RAISE EXCEPTION '% app functions remain executable by PUBLIC', n;
  END IF;

  SELECT string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ' ORDER BY p.proname)
  INTO names
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'app'
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
  IF names IS DISTINCT FROM
    'account_is_active(), associated_business(p_business_id uuid), has_permission(p_key text), has_role(p_role text), is_exco_admin(), is_exco_viewer(), is_super_admin(), own_profile_id(), owns_profile(p_profile_id uuid), uid()'
  THEN
    RAISE EXCEPTION 'unexpected authenticated app function grants: %', names;
  END IF;

  SELECT count(*) INTO n
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace ns ON ns.oid = t.relnamespace
  WHERE c.contype = 'f'
    AND ns.nspname = 'public'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = c.conrelid
        AND i.indisvalid
        AND (i.indkey::smallint[])[0:cardinality(c.conkey)-1] = c.conkey
    );
  IF n <> 0 THEN
    RAISE EXCEPTION '% public foreign keys lack a supporting index', n;
  END IF;

  SELECT count(*) INTO n
  FROM (
    SELECT tablename, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('businesses', 'consents', 'documents', 'profiles', 'users')
      AND cmd IN ('SELECT', 'UPDATE')
    GROUP BY tablename, cmd
    HAVING count(*) > 1
  ) policy_overlaps;
  IF n <> 0 THEN
    RAISE EXCEPTION '% remediated table/action pairs still have overlapping policies', n;
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN (
      'users_select_authorized', 'users_update_authorized',
      'profiles_select_authorized', 'profiles_insert_own', 'profiles_update_authorized',
      'consents_select_authorized', 'consents_insert_own', 'consents_update_withdraw',
      'notifications_own', 'notifications_update_read',
      'roles_select_assigned', 'user_roles_select_super'
    )
    AND (COALESCE(qual, '') || COALESCE(with_check, '')) ~ 'auth\.uid\(\)'
    AND (COALESCE(qual, '') || COALESCE(with_check, '')) !~ 'SELECT auth\.uid\(\)';
  IF n <> 0 THEN
    RAISE EXCEPTION '% remediated policies still call auth.uid() per row', n;
  END IF;

  IF has_table_privilege('authenticated', 'public.businesses', 'INSERT') THEN
    RAISE EXCEPTION 'authenticated still has INSERT on public.businesses';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'businesses' AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION 'an authenticated business INSERT policy still exists';
  END IF;

  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'profiles_select_authorized'
    AND qual LIKE '%own_profile_id%'
    AND qual LIKE '%MEMBERS_ONLY%';
  IF n <> 1 THEN
    RAISE EXCEPTION 'members-only profile boundary does not require a member profile';
  END IF;

  IF has_function_privilege(
    'authenticated',
    'app.consume_registration_rate_limit(text,integer,integer)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'registration rate-limit function is exposed to authenticated';
  END IF;
END $$;

SELECT 'PASSED: Phase 3/4 catalog remediation assertions' AS result;
