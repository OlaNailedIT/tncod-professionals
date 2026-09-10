# Phase 4 — Auth & runtime completion report

**Date:** 2026-09-06  
**Target:** local disposable Supabase (`127.0.0.1:54322` Postgres, `127.0.0.1:54321` Kong)  
**Classification:** LOCAL / DISPOSABLE  

This is a runtime-completion report. It is not a product-feature report. Phase 5 was **not** started.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| DESIGNED | Contract exists in locked docs |
| CREATED | File exists on disk |
| APPLIED | SQL applied to live PostgreSQL |
| EXECUTED | Command or test actually ran |
| PASSED | Executed and met the assertion |
| FAILED | Executed and did not meet the assertion |
| SKIPPED | Intentionally not in scope |
| NOT EXECUTED | Not run |

Do not read CREATED as PASSED.

## Decision

**Status:** `PASS — PHASE 4 COMPLETE`

**Phase decision:** `PHASE 4 COMPLETE — PHASE 5 MAY BE REVIEWED FOR GO`

Phase 5 is **not** authorized by this report. Human GO is still required.

---

## 1. Pre-flight (EXECUTED / PASSED)

| Check | Result |
| --- | --- |
| Docker | Reachable (Desktop 29.7.2) |
| PostgreSQL | HEALTHY — 17.6, database `postgres` |
| Auth | HEALTHY — `/auth/v1/health` HTTP 200 |
| Storage | HEALTHY — `/storage/v1/status` HTTP 200 |
| Target | LOCAL / DISPOSABLE |
| Phase 2 schema | Present (25 public tables, `member-documents` bucket) |
| `app.handle_new_auth_user` before apply | **absent** |
| Trigger on `auth.users` before apply | **absent** |

No RUNTIME STATE CONTRADICTION.

---

## 2. Auth migration audit (CREATED → APPLIED)

File: `supabase/migrations/20260827140000_auth_user_sync.sql`

| Property | Live catalog after apply |
| --- | --- |
| Function | `app.handle_new_auth_user` |
| SECURITY DEFINER | **yes** |
| Owner | `postgres` |
| search_path | `public, pg_temp` |
| EXECUTE | `postgres`, `supabase_auth_admin` only (`PUBLIC` revoked) |
| Trigger | `on_auth_user_created` |
| Timing / event | AFTER INSERT |
| Table | `auth.users` |
| Inserted fields | `public.users (id, email, phone=NULL, timestamps)` |
| Role assignment | `MEMBER` only, from `public.roles`, not from metadata |
| Missing email | `COALESCE(NEW.email, '')` |
| Duplicate id | `ON CONFLICT (id) DO NOTHING` then still ensure MEMBER |
| Metadata | **not read** |

Narrow pre-apply correction (unapplied file only): `GRANT USAGE ON SCHEMA app` and `GRANT EXECUTE` to `supabase_auth_admin` so GoTrue can fire the trigger. This does not assign privilege from metadata.

Safety gate: a new `auth.users` row cannot populate `role` beyond MEMBER, permissions, verification, visibility, EXCO/SUPER_ADMIN, or publication history.

---

## 3. Auth lifecycle (EXECUTED / PASSED)

Mechanism: Supabase Auth Admin API on the local GoTrue runtime (not a direct `INSERT INTO public.users` as the primary proof).

| Test | Result |
| --- | --- |
| Admin create user | PASSED |
| `auth.users` row | PASSED |
| `public.users` row | PASSED |
| `auth.users.id = public.users.id` | PASSED |
| email copy | PASSED |
| `account_status = ACTIVE` | PASSED |
| roles = `MEMBER` only | PASSED |
| no automatic `profiles` row | PASSED |
| password grant sign-in (Storage identities) | PASSED |

---

## 4. Malicious metadata (EXECUTED / PASSED)

Admin create with `user_metadata` / `app_metadata` claiming SUPER_ADMIN, EXCO_ADMIN, VERIFIED, DIRECTORY, SUSPENDED, and `user.manage_roles`.

| Test | Result |
| --- | --- |
| Auth user created | PASSED |
| roles remain MEMBER only | PASSED |
| account_status remains ACTIVE | PASSED |
| no profile / DIRECTORY publication | PASSED |

No CRITICAL SECURITY BLOCKER.

---

## 5. Identity consistency (EXECUTED / PASSED)

| Scenario | Observed |
| --- | --- |
| Existing `public.users` id, then Auth create with same id | Single public row; MEMBER role filled (`ON CONFLICT DO NOTHING`) |
| Auth user DELETE via Admin API | `auth.users` removed; `public.users` **preserved** (no FK cascade) |

Approved model: identity history is not auto-deleted. No cascading-delete invention.

Limitation: empty-string email via `COALESCE(NEW.email, '')` could collide uniqueness for multiple email-less Auth users. Not observed in these tests (all users had emails).

---

## 6. Next.js runtime foundation

| Item | Status |
| --- | --- |
| Browser client (`src/lib/supabase/browser.ts`) | CREATED — anon only |
| Server cookie client (`src/lib/supabase/server.ts`) | CREATED |
| Service-role client (`src/lib/supabase/admin.ts`) | CREATED — `server-only` |
| `getAuthenticatedUser` | CREATED |
| Middleware session refresh (`src/middleware.ts`) | CREATED — no product route guards |
| `/api/runtime/session` | CREATED — JSON probe, no Auth UI |
| `/api/health` | CREATED — no secrets |
| Vitest env / authorization | EXECUTED / PASSED |
| Playwright smoke | EXECUTED / PASSED (2 request tests; Chromium binary not required) |
| Browser cookie login round-trip | NOT EXECUTED (no login page by design) |

Public URL and anon key are intentionally public. Service role is not `NEXT_PUBLIC_*`. Zod rejects `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. Nested quotes from `supabase status -o env` are unwrapped in env parsing so the URL remains a valid HTTP URL.

---

## 7. Storage HTTP (EXECUTED / PASSED)

Database-table RLS was previously validated at the Database Gate. This phase tested the Storage HTTP API.

Synthetic Auth users (owner, other MEMBER, EXCO_ADMIN granted **after** Auth sync by privileged SQL — not by the trigger).

| Test | HTTP | Result |
| --- | --- | --- |
| Owner upload | 200 | PASSED |
| Anon read | 400 denied | PASSED |
| Owner read | 200 | PASSED |
| Cross-user read | 400 denied | PASSED |
| Cross-user upload to owner path | 400 denied | PASSED |
| Cross-user delete | 400 denied | PASSED |
| Path not `documents/...` | 400 denied | PASSED |
| EXCO review read (`document.review`) | 200 | PASSED |
| EXCO delete | 400 denied | PASSED |
| Owner delete | 200 | PASSED |
| Signed URLs | SKIPPED | not implemented in Phase 4 |

Path contract `documents/{user_id}/{document_id}` is enforced at Storage RLS (`storage.foldername`). Application still must validate MIME/size independently (DESIGNED, not built).

Denied HTTP statuses observed were **400**, not always 403. Denial is still effective.

---

## 8. Security regression SQL (EXECUTED / PASSED)

`supabase/tests/gate-runtime-security.sql` — **38/38 PASSED**.

Added:

- Member A cannot UPDATE/DELETE/INSERT Member B `opportunities`
- Member A cannot UPDATE/DELETE/INSERT Member B `business_professionals`

Denial methodology: `pg_temp.expect_denied` records **PASSED** only for `42501`, `P0001` (privileged-field raise), or **zero-row** RLS filter. Other SQLSTATEs are **FAILED** (`UNEXPECTED`).

Integrity probes (`prisma/sql/integrity-probes.sql`): EXECUTED / PASSED (DO blocks completed).

---

## 9. Tooling (EXECUTED)

| Check | Result |
| --- | --- |
| `npx prisma validate` | PASSED |
| `npx prisma generate` | PASSED |
| `npx tsc --noEmit` | PASSED |
| `npx eslint .` | PASSED (ignore `next-env.d.ts`) |
| `npx vitest run` | PASSED |
| `prisma migrate dev/deploy` | NOT RUN (forbidden) |
| `prisma/migrations/` | not created |

---

## 10. Architecture preservation

Unchanged:

- `profile_status` ≠ `verification_status` ≠ `visibility_status`
- DIRECTORY requires VERIFIED
- businesses ↔ business_professionals ↔ profiles
- Anon → directory projection only
- Private documents never public
- Member cannot self-elevate
- EXCO_VIEWER cannot mutate because it can view
- EXCO_ADMIN cannot assign SUPER_ADMIN
- SUPER_ADMIN remains auditable
- `supabase/migrations/` sole migration authority
- Auth trigger is not a privilege-assignment mechanism

No Phase 5 design system. No product registration/profile/directory UI.

---

## 11. Limitations (honest)

- Seed identities still have **no** Auth passwords; HTTP tests used **new** synthetic Auth users.
- Next.js **cookie session** after browser login was not executed (no Auth UI).
- Anon/cross-user Storage HTTP denials returned **400**.
- Signed URL helpers were not built (`SKIPPED`).
- `[db.migrations] enabled = false` remains; Auth SQL was applied manually (`docker cp` + `psql`).
- Local `.env` is gitignored. Nested quoting from CLI env export must be unwrapped (handled in app env parsing).
