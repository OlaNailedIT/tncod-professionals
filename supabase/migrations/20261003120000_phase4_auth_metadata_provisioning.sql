-- GoTrue admin.createUser inserts auth.users before it applies app_metadata.
-- The original AFTER INSERT trigger therefore cannot always see the join marker.
-- Capture the false-to-true metadata transition in the same Auth transaction.

CREATE OR REPLACE FUNCTION app.handle_registration_provisioning_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF COALESCE(OLD.raw_app_meta_data ->> 'registration_provisioning', 'false') <> 'true'
     AND COALESCE(NEW.raw_app_meta_data ->> 'registration_provisioning', 'false') = 'true' THEN
    INSERT INTO app.registration_provisioning (user_id)
    SELECT NEW.id
    FROM public.users AS u
    WHERE u.id = NEW.id
      AND u.account_status = 'DEACTIVATED'
      AND u.deleted_at IS NULL
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION app.handle_registration_provisioning_metadata() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION app.handle_registration_provisioning_metadata() TO supabase_auth_admin;

CREATE TRIGGER on_auth_user_registration_metadata
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION app.handle_registration_provisioning_metadata();
