-- CHECK constraints from prisma/sql/checks.sql (frozen Phase 2).

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

ALTER TABLE profiles
  ADD CONSTRAINT profiles_directory_requires_verified
  CHECK (
    visibility_status <> 'DIRECTORY'
    OR verification_status = 'VERIFIED'
  );
