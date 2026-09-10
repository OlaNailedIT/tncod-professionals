# Phase 18 migration scripts

Offline / privileged historical Google Form tooling.

```text
raw/       — immutable source (GITIGNORED — PII)
derived/   — cleaned derivatives (GITIGNORED)
reports/   — masked audit + dry-run outputs
dry-run.ts — default command (no DB mutation)
import.ts  — hard abort until production gate
```

## Credential architecture (least privilege)

```text
PHASE 18 READ-ONLY PREFLIGHT
        │
        └── PHASE18_PRODUCTION_DATABASE_URL (or PRODUCTION_DATABASE_URL)
            PostgreSQL READ-ONLY role only
            NO service_role / Auth admin
            NO Storage
            NO write privileges
                    ↓
             Production reconciliation (18 rows)
                    ↓
             Import plan finalized
                    ↓
        EXPLICIT: AUTHORIZE PHASE 18 PRODUCTION IMPORT
                    ↓
       Separate write-capable credentials
       (PHASE18_IMPORT_DATABASE_URL + Auth admin TBD)
                    ↓
             Controlled import
```

| Gate | Credential | Allowed |
| --- | --- | --- |
| Preflight | `PHASE18_PRODUCTION_DATABASE_URL` | SELECT only on identity/member/business/status tables needed for match |
| Preflight | Supabase `service_role` | **FORBIDDEN** as preflight substitute |
| Preflight | Storage | **NOT REQUIRED / FORBIDDEN** |
| Import | Separate write DB + Auth admin (minimum TBD after CREATE_NEW count) | Only after explicit import authorization |

Never print, commit, or paste secrets into reports.

Access check (no secret values):

```bash
node scripts/migrations/phase18/check-access.mjs
node scripts/migrations/phase18/classify-env.mjs
```

## Commands

```bash
# Masked dry-run (no writes)
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts

# Dry-run with local member index (still no writes)
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts --with-db

# Production preflight (READ ONLY) — requires PHASE18_PRODUCTION_DATABASE_URL
npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/production-preflight.ts

# Source audit helpers
node scripts/migrations/phase18/audit-source.mjs
node scripts/migrations/phase18/identity-analysis.mjs
```

## Rules

- Never modify `raw/`
- Never expose via Next.js routes
- Never create Auth/passwords from these scripts without the import gate
- Never run production import without `AUTHORIZE PHASE 18 PRODUCTION IMPORT`
- Never substitute local `DATABASE_URL` or local `SUPABASE_SERVICE_ROLE_KEY` for production
- Phone normalization default is Nigeria (`+234`) — see `src/features/registration/phone.ts`
