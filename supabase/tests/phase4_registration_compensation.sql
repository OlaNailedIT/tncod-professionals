\set ON_ERROR_STOP on

DO $$
DECLARE
  tagged_id uuid := 'f4000000-0000-4000-8000-000000000001';
  untagged_id uuid := 'f4000000-0000-4000-8000-000000000002';
  n integer;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', tagged_id,
    'authenticated', 'authenticated', 'phase4-tagged@local.test', pg_catalog.now(),
    '', '', '', jsonb_build_object('registration_provisioning', true), '{}'::jsonb,
    pg_catalog.now(), pg_catalog.now()
  );

  SELECT count(*) INTO n
  FROM public.users
  WHERE id = tagged_id AND account_status = 'DEACTIVATED';
  IF n <> 1 THEN
    RAISE EXCEPTION 'tagged Auth identity did not create an inert application user';
  END IF;

  SELECT count(*) INTO n
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = tagged_id AND r.name = 'MEMBER';
  IF n <> 1 THEN
    RAISE EXCEPTION 'tagged Auth identity did not receive exactly one MEMBER role';
  END IF;

  SELECT count(*) INTO n
  FROM app.registration_provisioning
  WHERE user_id = tagged_id AND state = 'PENDING';
  IF n <> 1 THEN
    RAISE EXCEPTION 'tagged Auth identity did not create a durable provisioning job';
  END IF;

  UPDATE app.registration_provisioning
  SET lease_token = gen_random_uuid(),
      lease_expires_at = pg_catalog.now() + INTERVAL '15 minutes'
  WHERE user_id = tagged_id;
  DELETE FROM app.registration_provisioning
  WHERE user_id = tagged_id AND lease_token IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN
    RAISE EXCEPTION 'registration success incorrectly cleared a leased provisioning job';
  END IF;

  UPDATE app.registration_provisioning
  SET lease_token = NULL, lease_expires_at = NULL
  WHERE user_id = tagged_id;

  BEGIN
    UPDATE public.users SET account_status = 'ACTIVE' WHERE id = tagged_id;
    RAISE EXCEPTION 'activation succeeded while durable provisioning job existed';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM <> 'registration_provisioning_incomplete' THEN
        RAISE;
      END IF;
  END;

  BEGIN
    UPDATE public.users SET account_status = 'SUSPENDED' WHERE id = tagged_id;
    RAISE EXCEPTION 'suspension succeeded while durable provisioning job existed';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM <> 'registration_provisioning_incomplete' THEN
        RAISE;
      END IF;
  END;

  -- This mirrors the application transaction: clear the obligation immediately
  -- before activation in the same commit.
  DELETE FROM app.registration_provisioning WHERE user_id = tagged_id;
  UPDATE public.users SET account_status = 'ACTIVE' WHERE id = tagged_id;

  SELECT count(*) INTO n
  FROM public.users
  WHERE id = tagged_id AND account_status = 'ACTIVE';
  IF n <> 1 THEN
    RAISE EXCEPTION 'completed tagged identity did not activate';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', untagged_id,
    'authenticated', 'authenticated', 'phase4-untagged@local.test', pg_catalog.now(),
    '', '', '', '{}'::jsonb, '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
  );

  SELECT count(*) INTO n
  FROM app.registration_provisioning
  WHERE user_id = untagged_id;
  IF n <> 0 THEN
    RAISE EXCEPTION 'untagged Auth identity incorrectly created a provisioning job';
  END IF;

  DELETE FROM public.user_roles WHERE user_id IN (tagged_id, untagged_id);
  DELETE FROM public.users WHERE id IN (tagged_id, untagged_id);
  DELETE FROM auth.users WHERE id IN (tagged_id, untagged_id);
END $$;

SELECT 'PASSED: durable registration compensation lifecycle' AS result;
