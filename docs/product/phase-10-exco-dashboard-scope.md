# Phase 10 — EXCO operational dashboard

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date:** 2026-09-08  
**Depends on:** Phase 9 PASS / COMPLETE / VERIFIED / LOCKED  

---

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6–9 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 10 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 11 — ARCHITECTURE & FORENSIC SCOPE PASS COMPLETE (implementation not authorized)
PHASE 12+ — NOT AUTHORIZED
```

---

## Locked architecture

| Topic | Decision |
| --- | --- |
| Internal route | **`/exco` only** (EXCO-01) |
| `/admin` | **Rejected** |
| `/exco/dashboard` | **Rejected as duplicate** |
| Access | MEMBER denied; EXCO_VIEWER / EXCO_ADMIN / SUPER_ADMIN via existing roles |
| Viewer vs Admin metrics | Same read-model metrics for all EXCO roles (no export/publish shortcuts) |
| Dashboard | Read-model, attention indicators, deep links |
| Dashboard mutations | **Out of scope** |
| Verification metrics | Professional and business counts remain **separate** |
| Verified widgets | **Verified professionals** and **Verified businesses** — never one combined “Verified” |
| Export directory | **Out of Phase 10** |
| Existing queues/records | Deep links only to **canonical screens that exist** |

Tree remains:

```text
/exco
├── businesses
├── businesses/[id]
└── [future EXCO surfaces when separately authorized]
```

---

## Locked metric definitions

Timezone for calendar windows: **UTC** (aligned with `timestamptz` storage; documented for tests).

### New registrations (last 30 days)

**Label:** `New registrations (last 30 days)`

**Definition:** Count of distinct authenticated members whose **initial platform registration** (`users.created_at`) falls within the previous **30 calendar days, including today** (UTC), and who are not soft-deleted (`users.deleted_at IS NULL`) and have a non-deleted profile.

**Does not count:** profile edits, completion changes, business creation, verification submissions, logins, or multiple records for the same person.

### Total professionals

Distinct member professional profiles (`profiles`) with `deleted_at IS NULL`. Does not count businesses or EXCO role assignments as extra people.

### Complete profiles

Profiles for which the **existing Phase 8** `calculateProfileCompletion` result has `percent === 100`.  
**Do not** re-implement or approximate the formula in SQL. Load the same inputs the Phase 8 loader uses (or shared helpers).

### Businesses

Count of `businesses` with `deleted_at IS NULL`. Verification and publication are **not** required for inclusion.

### Seeking employment

Count of distinct non-deleted profiles whose persisted **`professional_situation = 'Job seeker'`** (controlled registration/edit enum).

**Rationale:** Phase 8 `opportunity_preferences` JSON has no employment-seeking key. Do not infer from free-text `looking_for_summary` or profession. When a dedicated opportunity SEEKING_EMPLOYMENT product exists later, this metric may be revisited under a new phase — not silently changed in Phase 10.

### Pending professional verification

Profiles with `deleted_at IS NULL` and `verification_status IN ('PENDING', 'UNDER_REVIEW')` (awaiting EXCO action).

### Pending business verification

Businesses with `deleted_at IS NULL` and `business_status IN ('SUBMITTED', 'PENDING_REVIEW')` (Pending / Under review).

### Verified professionals

Profiles with `deleted_at IS NULL` and `verification_status = 'VERIFIED'`.

### Verified businesses

Businesses with `deleted_at IS NULL` and `business_status = 'APPROVED'`.

**Forbidden:** any single widget that sums professional + business verification into one ambiguous “Verified” or “Pending verification” number without separate labelled parts.

---

## Locked quick actions (Phase 10)

| Action | Decision |
| --- | --- |
| View businesses | **Authorized** → `/exco/businesses` |
| Find a professional | **Deferred** until EXCO-02 product surface is authorized |
| Review profiles | **Deferred** until canonical professional review surface exists |
| Verification queue | Prefer separate destinations; Phase 10 may deep-link **business** pending via `/exco/businesses` only. Do not invent `/exco/verification` UI in Phase 10 unless separately authorized. |
| View job seekers | **Deferred** — needs dedicated EXCO read model + privacy boundary |
| Export directory | **Out of scope** |

Dashboard may show counts for deferred areas without inventing fake management products.

---

## Implementation boundary (narrow)

**In scope:**

1. `/exco` page — EXCO shell, attention + metrics + authorized deep links.
2. Server-side metric service using locked definitions + Phase 8 completion for “Complete profiles”.
3. Authz: require EXCO_VIEWER or EXCO_ADMIN or SUPER_ADMIN (or equivalent permission `report.view` / `professional.view` as already granted to viewers).
4. Tests: metric correctness, member denial, domain separation invariants.

**Out of scope:**

- `/admin`, `/exco/dashboard`
- Mutations from the dashboard
- Export directory
- Full professionals / directory / reports / verification-queue products
- Schema redesign / Prisma migrations
- Changing Phase 8 completion algorithm

---

## Carry-forward (Phase 9 P3)

Local Auth email OTP / `admin.createUser` flakiness under load — environment limitation; e2e may use `AUTH_E2E_HELPER` plus `/api/test/auth-session` (local only). Does not reopen Phase 9.

---

## Forensic closeout evidence (2026-09-08)

| Gate | Result |
| --- | --- |
| Unit (`metric-window`, completion) | PASS |
| Typecheck | PASS (prior closeout window) |
| DB closeout (`scripts/phase10-db-closeout.ts`) | PASS (`PHASE10_DB_CLOSEOUT_PASS`) |
| Browser Phase 10 (`e2e/phase-10-closeout-evidence.spec.ts`) | PASS |
| Phase 7 e2e regression | PASS (12/12) |
| Phase 8 e2e regression | PASS (3/3) |
| Phase 9 e2e regression | PASS (1/1) |

**Authz hardening locked in:** `/exco/*` requires EXCO_VIEWER / EXCO_ADMIN / SUPER_ADMIN — MEMBER `business.view` alone is insufficient.

**Local evidence helpers (not production):** `AUTH_E2E_HELPER`, `/api/test/auth-otp`, `/api/test/auth-session`.

Do not reopen Phase 10 for redesign. Do not begin Phase 11.
