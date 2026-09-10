# Phase 3 — Privacy, permissions & security architecture gate

## Status

**PASS — LOCKED**

This is a **technical security contract**. It is not runtime security implementation and not legal-compliance certification.

LEGAL REVIEW REQUIRED for PIPEDA, GDPR, POPIA, NDPA, retention, and consent wording.

**Date:** 2026-08-27

---

## Scope

Phase 3 freezes how authentication identity, RBAC, ownership, visibility, RLS **design**, Storage **design**, API authorization, projections, audit, and negative tests **must** work.

It does **not** deploy RLS, Storage, Auth, or APIs. It does **not** approve the Phase 2 database.

---

## Repository security audit

**Exists:** Phase 2 schema contract (Prisma, CHECK SQL, seed, docs). Phase 3 security docs, `supabase/policies/` design SQL, `src/security/` catalogue.

**Does not exist:** Auth runtime, live Supabase/Postgres, applied migrations, applied RLS/Storage, executed security tests.  
**Exists separately:** Phase 4 Next.js **application foundation** (not a substitute for this runtime security gate).

**Git:** no `.git` directory — historical secret scanning **could not** be performed.

---

## Security architecture

- **Authentication:** Supabase Auth; `auth.uid()` = `public.users.id`; trigger (Phase 4) must not self-elevate.
- **RBAC:** N:M `user_roles` / `role_permissions`; additive MEMBER, EXCO_VIEWER, EXCO_ADMIN, SUPER_ADMIN.
- **Permissions:** canonical keys in seed + `src/security/permissions.ts`. Aliases are not extra rows.
- **Ownership:** `auth.uid()` → `users` → `profiles` → children; businesses via `business_professionals`.
- **RLS:** default deny; designed, **not deployed**. Prisma privileged connection **bypasses** RLS (SEC-016).
- **Storage:** private `member-documents`; path `documents/{uid}/{document_id}`; designed, **not deployed**.
- **API:** domain commands; projections; search = GET rules; not implemented.
- **Audit:** append-only; actor SET NULL; SUPER_ADMIN remains auditable; not implemented.

---

## Security invariants

SEC-001 … SEC-020 as listed in `docs/security/security-architecture.md` §5a.

---

## Permission matrix

Canonical: `docs/security/permission-matrix.md`.

EXCO_ADMIN does **not** receive `professional.edit` (content stay member-owned). EXCO_ADMIN does **not** receive `user.manage_roles` or `configuration.manage`. Viewer has no mutation permissions.

---

## Data visibility matrix

Canonical: `docs/security/data-visibility-matrix.md`.

Anonymous directory = `PublicProfessional` columns matching `app.directory_professionals()`. Email/phone/church/docs/notes/keys are not public. EXCO_VIEWER ≠ EXCO_ADMIN.

---

## RLS architecture

Designed in `supabase/policies/` (**not applied**). Viewer policies are operation-specific SELECT (no Viewer `FOR ALL`). `users` SELECT is own-row or EXCO_ADMIN+, not Viewer. Directory access is a SECURITY DEFINER function with explicit columns and `search_path = public, pg_temp`.

---

## Storage security

Designed in `docs/security/storage-security.md` and `30-storage.sql` (**not applied**). Private bucket; no anon policies. View-only ≠ copy-proof.

---

## Threat model

P0: IDOR, user_id/role spoofing, privilege escalation, Prisma/RLS bypass, document leakage, directory/search leakage, service-role in browser, Viewer mutations. See `docs/security/threat-model.md`.

---

## Security test plan

**DEFINED** in `docs/security/security-test-plan.md` and `src/security/security-test-cases.ts`.

**EXECUTED later (not in Phase 3 itself):** Database Gate RLS SQL and Phase 4 Storage HTTP / Auth lifecycle. See `docs/data/database-gate-test-report.md` and `docs/architecture/phase-4-runtime-completion-report.md`.

---

## Secret handling

Local `.env` is a **placeholder** `postgresql://postgres:postgres@localhost:5432/...` for Prisma validate. `.gitignore` excludes `.env`. `.env.example` documents no `NEXT_PUBLIC_*` secrets. No service-role keys found in source.

No Git history scan (no repository).

---

## Validation performed

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `npx prisma validate` | **PASS** |

No SQL executed (no database).

---

## Not executed

- RLS tests
- Storage tests
- API tests
- Auth tests
- seed execution
- integrity probes
- live database tests
- Git history secret scan

---

## Known limitations

- Orphan `businesses` INSERT possible at RLS layer until Phase 4 domain transaction.
- Directory SQL projection omits skills/experience/headshot (minimize v1 public surface; headshot not a public object).
- Seed `business.create` is not fully idempotent.
- Rate-limit numbers TBD.
- Legal copy / retention OPEN.

None of these reopen Phase 2 schema.

---

## Security architecture

**PASS — LOCKED** (unchanged). This section is the contract, not runtime proof.

## Runtime security

**NOT TESTED** / **BLOCKED** — no live database.

| Control | Designed | Applied | Tested |
| --- | --- | --- | --- |
| Schema SQL migrations | Yes | No | No |
| CHECK constraints | Yes | No | No |
| RLS helpers + policies | Yes | No | No |
| Privileged-column triggers | Yes | No | No |
| Storage bucket + policies | Yes | No | No |
| Seed | Yes | No | No |
| Integrity probes | Yes | No | No |
| RLS negative tests | Yes | No | No |
| Auth trigger | Phase 4 | No | No |

Do not treat migration **files** as **applied** security.

## Deferred to Phase 4

Unchanged: Auth implementation, Auth trigger SQL, session/CSRF, APIs, Prisma authorization boundary, rate limiting.

**Also remaining:** Phase 4 Auth trigger SQL is **CREATED**, **NOT APPLIED**. Session/CSRF, product APIs, and UI remain out of scope.

Runtime RLS/Storage tests on 2026-09-06: **EXECUTED** — see `docs/data/database-gate-test-report.md`. This does not certify legal compliance.

---

## Gate decision

**PASS — LOCKED**
