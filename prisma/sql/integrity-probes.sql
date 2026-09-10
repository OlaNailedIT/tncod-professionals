-- Executable integrity probes. Each statement is expected to FAIL.
-- Wrap in a transaction that rolls back. Status: DEFINED; execute only against disposable DB.
-- Usage (when Postgres exists): BEGIN; \i prisma/sql/integrity-probes.sql  — expect exceptions; ROLLBACK;

-- Probe: duplicate email
-- Expected: unique violation
-- INSERT INTO users (id, email, created_at, updated_at)
-- SELECT id, email, now(), now() FROM users LIMIT 1;

-- Below: self-contained probes using DO blocks so they can run after seed.

DO $$
DECLARE
  u uuid := gen_random_uuid();
BEGIN
  INSERT INTO users (id, email, created_at, updated_at) VALUES (u, 'dup-probe@seed.test', now(), now());
  BEGIN
    INSERT INTO users (id, email, created_at, updated_at) VALUES (gen_random_uuid(), 'dup-probe@seed.test', now(), now());
    RAISE EXCEPTION 'PROBE_FAIL: duplicate email allowed';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;
  DELETE FROM users WHERE id = u;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO profiles (
      user_id, display_name, profile_status, verification_status, visibility_status, created_at, updated_at
    )
    SELECT id, 'xor-probe', 'COMPLETE', 'PENDING', 'DIRECTORY', now(), now()
    FROM users LIMIT 1;
    RAISE EXCEPTION 'PROBE_FAIL: DIRECTORY without VERIFIED allowed';
  EXCEPTION
    WHEN check_violation THEN NULL;
    WHEN raise_exception THEN
      IF SQLERRM LIKE 'privileged_field:%' THEN
        NULL;
      ELSE
        RAISE;
      END IF;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO verification_records (reviewer_id, created_at)
    SELECT id, now() FROM users LIMIT 1;
    RAISE EXCEPTION 'PROBE_FAIL: XOR neither subject allowed';
  EXCEPTION
    WHEN check_violation THEN NULL;
    WHEN not_null_violation THEN NULL;
  END;
END $$;

DO $$
DECLARE
  rid uuid;
  pid uuid;
  bid uuid;
BEGIN
  SELECT id INTO rid FROM users LIMIT 1;
  SELECT id INTO pid FROM profiles LIMIT 1;
  SELECT id INTO bid FROM businesses LIMIT 1;
  IF rid IS NULL OR pid IS NULL OR bid IS NULL THEN
    RAISE NOTICE 'PROBE_SKIP: seed data missing for XOR both-FKs';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO verification_records (profile_id, business_id, reviewer_id)
    VALUES (pid, bid, rid);
    RAISE EXCEPTION 'PROBE_FAIL: XOR both subjects allowed';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END $$;

DO $$
DECLARE
  pid uuid;
BEGIN
  SELECT id INTO pid FROM profiles LIMIT 1;
  IF pid IS NULL THEN
    RAISE NOTICE 'PROBE_SKIP: no profile for experience check';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO experiences (profile_id, organisation, role, is_current, end_date, created_at, updated_at)
    VALUES (pid, 'Probe Org', 'Probe', true, CURRENT_DATE, now(), now());
    RAISE EXCEPTION 'PROBE_FAIL: is_current AND end_date allowed';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO opportunities (profile_id, type, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', 'COLLABORATION', now(), now());
    RAISE EXCEPTION 'PROBE_FAIL: invalid opportunity FK allowed';
  EXCEPTION
    WHEN foreign_key_violation THEN NULL;
  END;
END $$;

DO $$
DECLARE
  bid uuid;
  pid uuid;
BEGIN
  SELECT business_id, profile_id INTO bid, pid FROM business_professionals LIMIT 1;
  IF bid IS NULL THEN
    RAISE NOTICE 'PROBE_SKIP: no business_professionals';
    RETURN;
  END IF;
  BEGIN
    INSERT INTO business_professionals (business_id, profile_id, relationship_type, created_at, updated_at)
    VALUES (bid, pid, 'OWNER', now(), now());
    RAISE EXCEPTION 'PROBE_FAIL: duplicate business_professionals allowed';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;
END $$;
