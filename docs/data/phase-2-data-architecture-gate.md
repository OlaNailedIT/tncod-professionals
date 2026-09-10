# Phase 2 — Data architecture gate

## Status

**PASS — LOCKED**

## Date

2026-08-27

## Scope

Phase 2 freezes the **relational domain contract**: entities, keys, statuses, ownership, visibility, permissions, consent, documents, Auth identity mapping, and **Supabase SQL as the only migration authority**. It does not implement RLS, Storage policies, Auth UI, or a live database.

## Final architecture

- **Supabase PostgreSQL** — only database  
- **Supabase Auth** — `auth.users` → trigger → `public.users` (`id` match) → `profiles`  
- **Supabase Storage** — private document binaries; Postgres holds metadata  
- **Prisma** — ORM / types / schema representation  
- **Migrations** — `supabase/migrations` only (empty until Phase 4). No `prisma/migrations`  
- **Core entities** — users, RBAC tables, profiles, professional_details, experiences, taxonomies, businesses, **business_professionals**, opportunities, church_information (service_area), documents, consents, verification_records, publications, admin_notes, spotlights, notifications, audit_logs  
- **Relationships** — user 1:1 profile; skills/services N:M; **business M:N profiles**; opportunities N:1 profile; XOR profile/business on verification, publications, notes  

## Locked decisions

- DIRECTORY requires VERIFIED (CHECK + service)  
- Unpublish from directory → MEMBERS_ONLY; hide → PRIVATE  
- No current-state UNPUBLISHED  
- Church: service_area only, never public  
- Auth trigger must not self-elevate  
- One Postgres; Prisma not a second DB or migration history  
- Experience = professional history only  
- Business M:N via business_professionals  
- Opportunities: SEEKING_EMPLOYMENT, OFFERING_SERVICES, COLLABORATION  
- Documents never public; EXCO view-only in the application  
- Four roles, N:M, additive permissions; SUPER_ADMIN manages privileged roles  
- Consent as history; catalogue DATA_PROCESSING, DIRECTORY_VISIBILITY, COMMUNICATION  
- Rejection preserves history; resubmission allowed  
- Spotlight/notifications: schema only  

## Schema changes made (finalization)

- Removed `businesses.profile_id`; added `business_professionals` + `relationship_type`  
- Opportunity enums/fields: SEEKING_EMPLOYMENT, OFFERING_SERVICES, COLLABORATION + employment-intent columns  
- Church: dropped membership_status, department  
- Experience: employment_type, location  
- DocumentType: CV, PROFESSIONAL_CERTIFICATE, BUSINESS_REGISTRATION, OTHER  
- `publications.resulting_visibility`  
- CHECK `profiles_directory_requires_verified`  
- Permission catalogue expanded to match the instruction  
- Seed: M:N business, dual roles, opportunity types, document metadata  

## State model

See `state-transitions.md`. Three independent dimensions; DIRECTORY ⇔ VERIFIED invariant.

## Data ownership matrix

See `ownership-matrix.md`.

## Data visibility matrix

See `data-classification.md`.

## Permission model

N:M `user_roles` / `role_permissions`. Additive union. Viewer: no mutation. Admin: verify/publish. Super Admin: `user.manage_roles`, configuration. Not mutually exclusive roles.

## Authentication architecture

```text
auth.users → controlled trigger → public.users → profiles
users.id = auth.users.id
```

Trigger must not assign EXCO_ADMIN / SUPER_ADMIN from user metadata. Documented in `auth-and-migrations.md`. **Trigger SQL not implemented** (Phase 4).

## Document architecture

Private Storage + `documents` metadata. Never public directory. Members upload own files. EXCO: **view-only application access** — no public URLs, no normal download action. Browser copy is not claimed impossible. Storage policies: Phase 3.

## Migration architecture

**Supabase SQL migrations are authoritative.** Prisma is not a competing migration authority. `prisma/sql/checks.sql` is folded into the first Supabase migration in Phase 4.

## Validation

| Check | Result |
| --- | --- |
| Repository / schema / docs reconciliation | Done |
| `npx prisma format` | Succeeded |
| `npx prisma validate` | Succeeded (schema valid 🚀) |
| Live migration | **Not executed** |
| Seed | **Not executed** |
| Integrity probes against DB | **DEFINED, not executed** |
| RLS / Storage policies | **Not implemented** (Phase 3) |

## Known limitations

- No live Postgres / no applied SQL  
- Auth trigger not written  
- CHECK SQL not yet in a numbered Supabase migration file  
- Legal consent copy OPEN  
- Business DIRECTORY vs business_status APPROVED not given a CHECK (instruction locked the rule for **profiles** only)  

## Deferred to Phase 3

- RLS  
- Storage policies  
- Authorization enforcement / JWT  
- security-definer functions if required  
- API authorization  
- Route protection  
- Security testing  
- Document viewer  

## Gate decision (architecture contract)

**PASS — LOCKED**

Human product review may still reject this freeze; the Phase 2 **architecture contract** is internally consistent with the finalization instruction.

---

## Database environment

- **Target:** local disposable Supabase (`127.0.0.1:54322`, database `postgres`)
- **Classification:** LOCAL / DISPOSABLE
- **PostgreSQL version:** 17.6
- **Auth / Storage / Kong:** HEALTHY at execution
- **Migration execution date:** 2026-09-06
- Playbook: `docs/data/database-environment.md`

Credentials are not recorded here.

## Migration status

- **Applied:** `20260827120000`, `20260827120100`, `20260827120200`, `20260827120300` (manual `psql` so `[db.migrations] enabled = false` would not apply Phase 4)
- **Not applied:** `20260827140000_auth_user_sync.sql` (Phase 4)
- **prisma/migrations:** absent
- Live catalog: 25 public tables; no `businesses.profile_id`; independent status columns; CHECK `profiles_directory_requires_verified`; XOR CHECKs; `audit_logs.actor_id` **SET NULL**

## Prisma status

- `npx prisma validate`: **PASSED**
- `npx prisma generate`: **EXECUTED**
- Live compatibility: seed ran against this database (**PASSED**)

## Seed status

- **EXECUTED** twice (`npm run prisma:seed`)
- Repeatability: second run **EXECUTED** (exit 0); unique identities preserved. Not a formal idempotent-reset proof.
- Narrow corrections: (1) `storage_key` = `documents/{user_id}/{document_id}`; (2) privileged profile fields applied after JWT impersonation of `EXCO_ADMIN` because column triggers fire even for Prisma

## Integrity status

- **EXECUTED** `prisma/sql/integrity-probes.sql` — all DO blocks **PASSED**
- PENDING+DIRECTORY rejected (privileged insert guard and/or CHECK)

## RLS status

- **APPLIED**; 25/25 public tables `relrowsecurity = t`; 89 policies (`public` + `storage`)
- Negative tests: `supabase/tests/gate-runtime-security.sql` — **32 EXECUTED, 32 PASSED**

## Storage status

- Bucket `member-documents` **APPLIED**, `public = false`
- Five object policies **APPLIED**; anon/cross-user denied; owner and `document.review` allowed in tests

## Security status

Member isolation, self-verify/self-DIRECTORY, Viewer mutation/email dump, Admin→SUPER_ADMIN, anon directory projection, Storage isolation: **EXECUTED / PASSED**.

## Remaining issues

- Phase 4 Auth `auth.users` trigger remains **NOT APPLIED** (correct for this gate)
- Studio / Realtime not running (not required for these tests)
- Prisma privileged connections still bypass RLS (SEC-016); domain authorization remains required in the app
- LEGAL REVIEW REQUIRED unchanged

## Database gate decision

**PASS — DATABASE GATE**

