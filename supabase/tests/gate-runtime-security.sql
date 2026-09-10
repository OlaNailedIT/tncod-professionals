-- Database gate + Phase 4 runtime security tests. EXECUTED against local disposable Supabase.
-- Uses SET ROLE anon/authenticated + JWT claims. Postgres superuser is not the subject under test.
-- Mutation denials must be RLS (42501), privileged-field raise (P0001), or zero-row RLS filter.
-- Arbitrary SQL errors are FAILED, not treated as successful denial.

CREATE TEMP TABLE IF NOT EXISTS gate_results (
  test text PRIMARY KEY,
  outcome text NOT NULL,
  detail text
);

CREATE OR REPLACE FUNCTION pg_temp.record(p_test text, p_ok boolean, p_detail text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO gate_results(test, outcome, detail)
  VALUES (p_test, CASE WHEN p_ok THEN 'PASSED' ELSE 'FAILED' END, p_detail)
  ON CONFLICT (test) DO UPDATE SET outcome = EXCLUDED.outcome, detail = EXCLUDED.detail;
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.claim(uid uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', uid::text, false);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', false);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated')::text,
    false
  );
END;
$$;

-- Classifies expected authorization denial vs unexpected database errors.
CREATE OR REPLACE FUNCTION pg_temp.expect_denied(p_test text, p_sql text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  n int := -2;
  st text;
  msg text;
BEGIN
  BEGIN
    EXECUTE p_sql;
    GET DIAGNOSTICS n = ROW_COUNT;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RESET ROLE;
      PERFORM pg_temp.record(p_test, true, 'sqlstate=42501');
      RETURN;
    WHEN raise_exception THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      RESET ROLE;
      PERFORM pg_temp.record(p_test, true, 'sqlstate=P0001 ' || left(msg, 80));
      RETURN;
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS st = RETURNED_SQLSTATE, msg = MESSAGE_TEXT;
      RESET ROLE;
      PERFORM pg_temp.record(
        p_test,
        false,
        'UNEXPECTED sqlstate=' || st || ' ' || left(msg, 120)
      );
      RETURN;
  END;
  RESET ROLE;
  IF n = 0 THEN
    PERFORM pg_temp.record(p_test, true, 'denied_rowcount=0');
  ELSE
    PERFORM pg_temp.record(p_test, false, 'MUTATION_SUCCEEDED rowcount=' || n);
  END IF;
END;
$$;

DO $$
DECLARE
  member_a uuid;
  member_b uuid;
  owner uuid;
  partner uuid;
  viewer uuid;
  admin uuid;
  super uuid;
  n int;
  slug text;
  leaked text;
  bid uuid;
  did uuid;
  rid uuid;
  oid uuid;
  owner_profile uuid;
  partner_profile uuid;
BEGIN
  SELECT id INTO STRICT member_a FROM users WHERE email = 'incomplete.private@seed.test';
  SELECT id INTO STRICT member_b FROM users WHERE email = 'complete.private@seed.test';
  SELECT id INTO STRICT owner FROM users WHERE email = 'verified.members@seed.test';
  SELECT id INTO STRICT partner FROM users WHERE email = 'coowner.two@seed.test';
  SELECT id INTO STRICT viewer FROM users WHERE email = 'viewer.only@seed.test';
  SELECT id INTO STRICT admin FROM users WHERE email = 'admin.exco@seed.test';
  SELECT id INTO STRICT super FROM users WHERE email = 'super.admin@seed.test';
  SELECT d.id INTO did FROM documents d JOIN profiles p ON p.id = d.profile_id WHERE p.user_id = partner;
  SELECT id INTO STRICT bid FROM businesses WHERE name = 'Seed Advisory Ltd';
  SELECT id INTO STRICT rid FROM roles WHERE name = 'EXCO_ADMIN';
  SELECT id INTO STRICT owner_profile FROM profiles WHERE user_id = owner;
  SELECT id INTO STRICT partner_profile FROM profiles WHERE user_id = partner;
  SELECT o.id INTO STRICT oid FROM opportunities o WHERE o.profile_id = owner_profile LIMIT 1;

  SET ROLE anon;
  SELECT count(*) INTO n FROM profiles;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_profiles', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM users;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_users', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM documents;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_documents', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM admin_notes;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_admin_notes', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM church_information;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_church', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM verification_records;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_verification', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM audit_logs;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_audit', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM consents;
  RESET ROLE;
  PERFORM pg_temp.record('anon_select_consents', n = 0, 'count=' || n);

  SET ROLE anon;
  SELECT count(*) INTO n FROM app.directory_professionals();
  SELECT string_agg(display_name, ',') INTO leaked FROM app.directory_professionals();
  RESET ROLE;
  PERFORM pg_temp.record(
    'anon_directory_projection',
    n = 1 AND leaked LIKE 'Seed Verified Directory%',
    'count=' || n || ' names=' || coalesce(leaked, '')
  );

  SET ROLE anon;
  SELECT count(*) INTO n FROM app.directory_professionals() d
  WHERE d.display_name ILIKE '%incomplete%' OR d.display_name ILIKE '%pending%';
  RESET ROLE;
  PERFORM pg_temp.record('anon_directory_excludes_non_verified_directory', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM profiles p JOIN users u ON u.id = p.user_id WHERE u.email = 'complete.private@seed.test';
  RESET ROLE;
  PERFORM pg_temp.record('member_a_cannot_read_b_private_profile', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM profiles WHERE user_id = member_a;
  RESET ROLE;
  PERFORM pg_temp.record('member_a_reads_own_profile', n = 1, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_update_b_profile',
    format(
      $q$UPDATE profiles SET display_name = 'hacked' FROM users u WHERE profiles.user_id = u.id AND u.email = %L$q$,
      'complete.private@seed.test'
    )
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_cannot_self_publish_directory',
    'UPDATE profiles SET visibility_status = ''DIRECTORY'' WHERE user_id = ' || quote_literal(member_a)
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_cannot_self_verify',
    'UPDATE profiles SET verification_status = ''VERIFIED'' WHERE user_id = ' || quote_literal(member_a)
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_cannot_assign_exco_admin',
    format(
      'INSERT INTO user_roles (user_id, role_id) VALUES (%L::uuid, %L::uuid)',
      member_a,
      rid
    )
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM documents d JOIN profiles p ON p.id = d.profile_id WHERE p.user_id = partner;
  RESET ROLE;
  PERFORM pg_temp.record('member_a_cannot_read_b_documents', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM admin_notes;
  RESET ROLE;
  PERFORM pg_temp.record('member_cannot_read_admin_notes', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(viewer);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'viewer_cannot_delete_professional_details',
    'DELETE FROM professional_details'
  );
  RESET ROLE;

  PERFORM pg_temp.claim(viewer);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM admin_notes;
  RESET ROLE;
  PERFORM pg_temp.record('viewer_cannot_select_admin_notes', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(viewer);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM church_information;
  RESET ROLE;
  PERFORM pg_temp.record('viewer_cannot_select_church', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(viewer);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM users WHERE id <> viewer;
  RESET ROLE;
  PERFORM pg_temp.record('viewer_cannot_dump_user_emails', n = 0, 'other_rows=' || n);

  SELECT id INTO rid FROM roles WHERE name = 'SUPER_ADMIN';
  PERFORM pg_temp.claim(admin);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'exco_admin_cannot_assign_super_admin',
    format(
      'INSERT INTO user_roles (user_id, role_id) VALUES (%L::uuid, %L::uuid)',
      admin,
      rid
    )
  );
  RESET ROLE;

  PERFORM pg_temp.claim(super);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'super_admin_cannot_insert_audit_client',
    format(
      $q$INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (%L::uuid, 'GATE_TEST', 'users', %L::uuid)$q$,
      super,
      super
    )
  );
  RESET ROLE;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
  VALUES (super, 'GATE_FIXTURE', 'users', super);
  PERFORM pg_temp.claim(super);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM audit_logs WHERE action = 'GATE_FIXTURE';
  RESET ROLE;
  PERFORM pg_temp.record('super_admin_can_select_audit', n >= 1, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM audit_logs;
  RESET ROLE;
  PERFORM pg_temp.record('member_cannot_select_audit', n = 0, 'count=' || n);

  SELECT count(*) INTO n
  FROM information_schema.routines
  WHERE routine_schema = 'app' AND routine_name = 'directory_professionals';
  PERFORM pg_temp.record('directory_function_exists', n = 1, 'count=' || n);

  -- Opportunity IDOR: Member A cannot mutate Member B (verified owner) opportunity.
  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_update_b_opportunity',
    format($q$UPDATE opportunities SET title = 'hacked-idor' WHERE id = %L::uuid$q$, oid)
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_delete_b_opportunity',
    format($q$DELETE FROM opportunities WHERE id = %L::uuid$q$, oid)
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_insert_b_opportunity',
    format(
      $q$INSERT INTO opportunities (profile_id, type, title, status, updated_at) VALUES (%L::uuid, 'COLLABORATION', 'idor-insert', 'DRAFT', now())$q$,
      owner_profile
    )
  );
  RESET ROLE;

  -- business_professionals IDOR: Member A cannot mutate partner relationship.
  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_update_b_business_professional',
    format(
      $q$UPDATE business_professionals SET relationship_type = 'EMPLOYEE' WHERE profile_id = %L::uuid AND business_id = %L::uuid$q$,
      partner_profile,
      bid
    )
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_delete_b_business_professional',
    format(
      $q$DELETE FROM business_professionals WHERE profile_id = %L::uuid AND business_id = %L::uuid$q$,
      partner_profile,
      bid
    )
  );
  RESET ROLE;

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_insert_b_business_professional',
    format(
      $q$INSERT INTO business_professionals (business_id, profile_id, relationship_type, updated_at) VALUES (%L::uuid, %L::uuid, 'EMPLOYEE', now())$q$,
      bid,
      partner_profile
    )
  );
  RESET ROLE;

  INSERT INTO storage.objects (bucket_id, name)
  VALUES (
    'member-documents',
    'documents/' || partner::text || '/' || gen_random_uuid()::text
  )
  RETURNING name INTO slug;

  SET ROLE anon;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'member-documents';
  RESET ROLE;
  PERFORM pg_temp.record('anon_cannot_read_storage_objects', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'member-documents';
  RESET ROLE;
  PERFORM pg_temp.record('member_a_cannot_read_b_storage_object', n = 0, 'count=' || n);

  PERFORM pg_temp.claim(partner);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = 'member-documents' AND name = slug;
  RESET ROLE;
  PERFORM pg_temp.record('owner_can_read_own_storage_object', n = 1, 'count=' || n);

  PERFORM pg_temp.claim(member_a);
  SET ROLE authenticated;
  PERFORM pg_temp.expect_denied(
    'member_a_cannot_delete_b_storage_object',
    format($q$DELETE FROM storage.objects WHERE name = %L$q$, slug)
  );
  RESET ROLE;

  PERFORM pg_temp.claim(admin);
  SET ROLE authenticated;
  SELECT count(*) INTO n FROM storage.objects WHERE name = slug;
  RESET ROLE;
  PERFORM pg_temp.record('exco_admin_document_review_can_read_storage', n = 1, 'count=' || n);
END $$;

SELECT test, outcome, detail FROM gate_results ORDER BY outcome DESC, test;
