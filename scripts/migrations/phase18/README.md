# Phase 18 / 18A migration scripts

Offline / privileged historical Google Form tooling.

```text
raw/       — immutable source (GITIGNORED — PII)
derived/   — cleaned derivatives (GITIGNORED)
reports/   — masked audit + dry-run + plan outputs
dry-run.ts — classification only (no DB mutation)
import.ts  — plan-only by default; --execute-local / --execute-production gated
```

## Phase 18A (Auth-first importer)

Implemented under `src/features/legacy-migration/`:

* `plan.ts` — execution plan from the same dry-run classifier
* `execute.ts` — Auth → users → MEMBER → legacy profile → provenance
* `env-safety.ts` — Production mutation DENY unless exact authorization phrase + import credentials + project ref
* `target-safety.ts` — hosted Supabase project ref `brpppukzqgpzxjelwwrj`
* `auth-admin.ts` — service-role Auth create (no password; no OTP by default)

```bash
# Plan only (no mutation) — default
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/import.ts

# Local disposable execute (never Production)
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/import.ts \
  --execute-local --i-understand-this-mutates-local-db

# Production execute — ONLY with exact PHASE18_PRODUCTION_IMPORT_AUTHORIZED phrase
# + PHASE18_IMPORT_* credentials + project ref. Do not re-run without new authorization.
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/import.ts \
  --execute-production
```

**2026-09-11 Production:** Pass 1 CREATED 18; Pass 2 SKIP_ALREADY_IMPORTED 18; pre-existing orphan soft-deleted under separate authorization. Phase 18 **PASS / COMPLETE / VERIFIED / LOCKED**. See `reports/production-execute-latest.md` and `reports/pre-existing-orphan-disposition.md`.

## Credential architecture (least privilege)

```text
PHASE 18 READ-ONLY PREFLIGHT
        │
        └── PHASE18_PRODUCTION_DATABASE_URL (or PRODUCTION_DATABASE_URL)
            PostgreSQL READ-ONLY role only
                    ↓
             Production reconciliation (18 rows)
                    ↓
        EXPLICIT: PHASE18_PRODUCTION_IMPORT_AUTHORIZED
                  = AUTHORIZE PHASE 18 PRODUCTION IMPORT
                    ↓
       PHASE18_IMPORT_DATABASE_URL
       + PHASE18_IMPORT_SUPABASE_URL
       + PHASE18_IMPORT_SERVICE_ROLE_KEY
       + PHASE18_PRODUCTION_PROJECT_REF=brpppukzqgpzxjelwwrj
                    ↓
             Controlled import (separate Phase 18 execution gate)
```

Never print, commit, or paste secrets into reports.

```bash
node scripts/migrations/phase18/check-access.mjs
node scripts/migrations/phase18/classify-env.mjs
```

## Commands

```bash
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts --with-db
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/import.ts
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/production-preflight.ts
node scripts/migrations/phase18/audit-source.mjs
```

## Rules

- Never modify `raw/`
- Never expose via Next.js routes / browser APIs
- Never run Production import without exact authorization env phrase
- Never substitute local credentials for Production
- Phone default Nigeria (`+234`)
- After 2026-09-11 Production execute: do not re-run without new explicit authorization; do not delete the pre-existing orphan by guesswork
