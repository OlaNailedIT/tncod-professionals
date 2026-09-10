-- Phase 6: store-normalized phone uniqueness for duplicate protection.
-- Application stores canonicalize via normalizePhone(); NULL phones remain allowed.

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_normalized_unique
  ON public.users (phone)
  WHERE phone IS NOT NULL AND phone <> '';
