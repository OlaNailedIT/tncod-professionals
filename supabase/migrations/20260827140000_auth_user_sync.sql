-- Phase 4 Auth identity sync.
-- Frozen contract: auth.users.id = public.users.id
-- MUST NOT assign EXCO_VIEWER, EXCO_ADMIN, or SUPER_ADMIN.
-- MUST NOT read privileged roles or statuses from user metadata.
-- Inserts only id/email into public.users (account_status defaults ACTIVE) and MEMBER.

CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULL,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id
  FROM public.roles r
  WHERE r.name = 'MEMBER'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION app.handle_new_auth_user();

REVOKE ALL ON FUNCTION app.handle_new_auth_user() FROM PUBLIC;
GRANT USAGE ON SCHEMA app TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION app.handle_new_auth_user() TO supabase_auth_admin;
