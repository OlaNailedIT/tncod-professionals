-- Phase 18 — Historical Google Form migration metadata
-- Additive. No production import authorization. Prisma is not migration authority.
--
-- Design:
--   profiles.legacy_*  → distinguish legacy members for UX / completion prompts
--   legacy_import_batches + legacy_import_rows → lineage, idempotency, audit
-- Does NOT create Auth users, consents, verification, or directory publication.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_import BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_source TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_imported_at TIMESTAMPTZ(6);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_batch_id TEXT;

COMMENT ON COLUMN public.profiles.legacy_import IS
  'Phase 18: true when profile originated from historical import (not new registration).';
COMMENT ON COLUMN public.profiles.legacy_source IS
  'Phase 18: source system key, e.g. GOOGLE_FORM.';
COMMENT ON COLUMN public.profiles.legacy_imported_at IS
  'Phase 18: when the profile was imported from a legacy batch.';
COMMENT ON COLUMN public.profiles.legacy_batch_id IS
  'Phase 18: human batch key linking to legacy_import_batches.batch_key.';

CREATE TABLE IF NOT EXISTS public.legacy_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_key TEXT NOT NULL,
  source_filename TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  mode TEXT NOT NULL,
  environment TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT legacy_import_batches_batch_key_uq UNIQUE (batch_key),
  CONSTRAINT legacy_import_batches_mode_chk CHECK (mode IN ('DRY_RUN', 'IMPORT')),
  CONSTRAINT legacy_import_batches_env_chk CHECK (environment IN ('local', 'disposable', 'staging', 'production'))
);

COMMENT ON TABLE public.legacy_import_batches IS
  'Phase 18: one row per migration execution (dry-run or import). Production IMPORT requires separate governance gate.';

CREATE TABLE IF NOT EXISTS public.legacy_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.legacy_import_batches(id) ON DELETE CASCADE ON UPDATE CASCADE,
  source_row_number INTEGER NOT NULL,
  source_row_hash TEXT NOT NULL,
  classification TEXT NOT NULL,
  proposed_action TEXT NOT NULL,
  email_fingerprint TEXT,
  phone_normalized TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  manual_review_reason TEXT,
  masked_preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT legacy_import_rows_action_chk CHECK (
    proposed_action IN (
      'CREATE',
      'GAP_ONLY',
      'MATCH_EXISTING',
      'SKIP_ALREADY_IMPORTED',
      'AMBIGUOUS',
      'INVALID',
      'MANUAL_REVIEW'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_import_rows_source_row_hash_imported_uq
  ON public.legacy_import_rows (source_row_hash)
  WHERE proposed_action IN ('CREATE', 'GAP_ONLY', 'MATCH_EXISTING', 'SKIP_ALREADY_IMPORTED')
    AND profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS legacy_import_rows_batch_id_idx
  ON public.legacy_import_rows (batch_id);

CREATE INDEX IF NOT EXISTS legacy_import_rows_source_row_hash_idx
  ON public.legacy_import_rows (source_row_hash);

COMMENT ON TABLE public.legacy_import_rows IS
  'Phase 18: per-source-row classification and lineage. source_row_hash is deterministic over canonicalized source fields.';
COMMENT ON COLUMN public.legacy_import_rows.source_row_hash IS
  'SHA-256 hex of canonical JSON: sourceSha256|rowNumber|normalizedEmail|normalizedPhone|fullNameTrimmed (see docs).';
COMMENT ON COLUMN public.legacy_import_rows.email_fingerprint IS
  'SHA-256 of normalized email — matching aid without logging raw email in reports.';

ALTER TABLE public.legacy_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_import_rows ENABLE ROW LEVEL SECURITY;

-- EXCO read-only visibility; no member/anon write. Mutations are offline privileged scripts only.
CREATE POLICY legacy_import_batches_select ON public.legacy_import_batches
  FOR SELECT TO authenticated
  USING (app.is_exco_viewer());

CREATE POLICY legacy_import_rows_select ON public.legacy_import_rows
  FOR SELECT TO authenticated
  USING (app.is_exco_viewer());

-- No INSERT/UPDATE/DELETE policies for authenticated — scripts use privileged DATABASE_URL.
