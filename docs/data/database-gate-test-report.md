# Database gate test report

**Date:** 2026-09-06  
**Decision:** **PASS — DATABASE GATE**

Local disposable Supabase. Phase 4 Auth trigger **not** applied. Phase 5 **not** started.

## Environment

| Item | Result |
| --- | --- |
| Target | `127.0.0.1:54322` / database `postgres` |
| Classification | **LOCAL / DISPOSABLE** |
| PostgreSQL | **17.6** HEALTHY |
| Auth / Storage / Kong | HEALTHY (HTTP 200 health/status) |
| Safety | No production target. Secrets not recorded here. |

## Checkpoint summary

| CP | Work | Result |
| --- | --- | --- |
| 0 | Pre-flight | **PASSED** — schema unapplied before start |
| 1 | Apply `120000`–`20300` only | **APPLIED** / **PASSED** |
| 2 | Live catalog vs contract | **PASSED** |
| 3 | Integrity probes | **EXECUTED** / **PASSED** |
| 4 | Seed `storage_key` alignment | **IMPLEMENTED** (narrow) |
| 5 | Seed ×2 | **EXECUTED** / repeatable |
| 6–9 | RLS inventory + 32 runtime tests + Storage + directory | **EXECUTED** / **PASSED** |
| 10 | `prisma validate` / `generate` | **PASSED** |

`20260827140000_auth_user_sync.sql`: **NOT APPLIED at this gate**. Later applied during Phase 4 runtime completion (2026-09-06). See `docs/architecture/phase-4-runtime-completion-report.md`.

## Migrations

| File | Status |
| --- | --- |
| `20260827120000_initial_schema.sql` | **APPLIED** |
| `20260827120100_checks_and_constraints.sql` | **APPLIED** |
| `20260827120200_security_rls.sql` | **APPLIED** |
| `20260827120300_storage_security.sql` | **APPLIED** |
| `20260827140000_auth_user_sync.sql` | **NOT APPLIED** (Phase 4) |

Mechanism: `docker cp` + `psql -v ON_ERROR_STOP=1`. `[db.migrations] enabled` left **false**.

## Schema (live)

- 25 public tables matching the Prisma model list
- `businesses.profile_id`: **absent**
- `profile_status`, `verification_status`, `visibility_status`: **independent**
- CHECK `profiles_directory_requires_verified`: **present**
- XOR CHECKs on verification_records / publications / admin_notes: **present**
- `audit_logs.actor_id`: **SET NULL**
- All 25 public tables: RLS **enabled**

## Seed

- Identities `@seed.test`; roles MEMBER (9), EXCO_VIEWER (1), EXCO_ADMIN (1), SUPER_ADMIN (1)
- States include INCOMPLETE+PRIVATE through VERIFIED+DIRECTORY and REJECTED+MEMBERS_ONLY
- PENDING+DIRECTORY **not** stored as valid seed
- `storage_key` LIKE `documents/%/%` = true

Second seed run: **EXECUTED**, exit 0, still **12** users. Not proven row-identical across all child tables. Treat as **repeatable without fatal error / unique identities preserved**, not as a formally proven idempotent reset.

Narrow seed changes (documented): insert-allowed statuses first; EXCO_ADMIN JWT `set_config` then privileged updates; document IDs generated so path = `documents/{user_id}/{document_id}`.

## Integrity probes

All DO blocks **PASSED**. DIRECTORY-without-VERIFIED is rejected by the insert guard (`privileged_field`) and/or CHECK; the probe now treats that guard as a valid rejection (still a rejection, not a pass-through).

## RLS / Storage tests

File: `supabase/tests/gate-runtime-security.sql`  
**32 EXECUTED, 32 PASSED, 0 FAILED, 0 SKIPPED**

These are **live PostgreSQL RLS tests** (`SET ROLE anon` / `SET ROLE authenticated` + `request.jwt.claim.sub`). They are **not** Storage HTTP API tests and **not** GoTrue-issued JWT HTTP requests.

Includes: anon deny on private tables; directory projection 1 row (Seed Verified Directory); member isolation; self-verify/self-DIRECTORY denied; Viewer cannot mutate/dump emails (other rows)/notes/church; EXCO_ADMIN cannot assign SUPER_ADMIN; Super can SELECT audit, cannot client-INSERT audit; Storage **table** anon/cross-user deny; owner read; EXCO `document.review` read.

Caveats for auditors:

- `directory_function_exists` is a catalog check as `postgres`, not a denial test.
- Some deny cases use `EXCEPTION WHEN OTHERS`, so any error is counted as deny.
- Member A mutating Member B opportunities / `business_professionals` was **not** a dedicated test.
- Viewer INSERT/UPDATE on member-owned tables was **not** separately tested (DELETE on `professional_details` was).
- Storage object rows used for isolation were **inserted as postgres**, then read/deleted under restricted roles.

## Drift

| Item | Class |
| --- | --- |
| Phase 4 Auth trigger unapplied | INTENTIONAL, NON-BLOCKING |
| Prisma bypasses RLS | INTENTIONAL (SEC-016) |
| Default GRANT ALL to `anon` on public tables | INTENTIONAL Supabase default; RLS still denied (tests) |
| Audit INSERT no authenticated policy | INTENTIONAL (system writer) |
| Studio/Realtime not running | INTENTIONAL, NON-BLOCKING for this gate |
| Seed JWT impersonation for privileged columns | INTENTIONAL, NON-BLOCKING (triggers ≠ RLS) |

**NO UNEXPLAINED CRITICAL DRIFT**

## Changes made during this gate

- Applied four Phase 2 SQL files to local Postgres
- `prisma/seed.ts` narrow path + privileged-insert sequencing
- `package.json` `prisma.seed` / `prisma:seed`
- `prisma/sql/integrity-probes.sql` accepts privileged-field rejection for DIRECTORY-without-VERIFIED
- `supabase/tests/gate-runtime-security.sql` executable runtime tests

## Phase 5

**DO NOT START.**
