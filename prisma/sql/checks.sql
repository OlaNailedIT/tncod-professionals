-- Applied via Supabase SQL migrations when Postgres exists (Phase 4).
-- Not Prisma migrate. Prisma cannot express these CHECKs cleanly.

ALTER TABLE verification_records
  ADD CONSTRAINT verification_records_subject_xor
  CHECK (
    (profile_id IS NOT NULL AND business_id IS NULL)
    OR (profile_id IS NULL AND business_id IS NOT NULL)
  );

ALTER TABLE publications
  ADD CONSTRAINT publications_subject_xor
  CHECK (
    (profile_id IS NOT NULL AND business_id IS NULL)
    OR (profile_id IS NULL AND business_id IS NOT NULL)
  );

ALTER TABLE admin_notes
  ADD CONSTRAINT admin_notes_subject_xor
  CHECK (
    (profile_id IS NOT NULL AND business_id IS NULL)
    OR (profile_id IS NULL AND business_id IS NOT NULL)
  );

ALTER TABLE experiences
  ADD CONSTRAINT experiences_current_end_date
  CHECK (NOT (is_current AND end_date IS NOT NULL));

-- Cross-dimension invariant: DIRECTORY requires VERIFIED.
-- Status columns stay independent; this does not collapse them into one field.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_directory_requires_verified
  CHECK (
    visibility_status <> 'DIRECTORY'
    OR verification_status = 'VERIFIED'
  );
