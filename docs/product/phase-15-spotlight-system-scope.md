# Phase 15 — Spotlight System

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date (decision closure):** 2026-09-09  
**Date (implementation lock):** 2026-09-09  
**Canonical EXCO route:** `/exco/spotlight`  
**Rejected route:** `/admin/spotlight` — **REJECTED** (does not exist as a Spotlight product)

---

## Governance

```text
PHASE 5–15 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 16+ — NOT AUTHORIZED

HARD STOP

Production changes: NONE
```

---

## 1. Purpose (unchanged)

> Spotlight is an **EXCO curation / presentation layer** over trusted Professional profile data for “Spotlight Monday” and similar feature workflows.

**First principle (LOCKED):**

> Spotlight owns **curation and presentation state**, not duplicate professional identity data.  
> Create Spotlight pulls existing profile information — **no re-entry of name/profession/skills/etc.**

---

## 2. Implemented architecture

| Area | Reality |
| --- | --- |
| Route | `/exco/spotlight` under EXCO shell; nav item under Workflows |
| Member interest | `profiles.spotlight_interest` boolean DEFAULT false; Settings hub control |
| Eligibility | `evaluateSpotlightEligibility` — interest ∧ Phase 8 completion===100 ∧ headshot key ∧ VERIFIED ∧ active account. **DIRECTORY not required** |
| Create | `createSpotlight` → DRAFT; `spotlight.manage` only; ignores forged client eligibility flags |
| Lifecycle | DRAFT → PUBLISHED → ARCHIVED; restore archived → DRAFT if eligible; SCHEDULED unused |
| Cardinality | Partial unique index `spotlights_one_active_per_profile_uq` WHERE status <> ARCHIVED |
| Projection | Allowlisted live Professional fields; no contact/business/docs/storage keys |
| Eligibility loss | Interest withdraw / ineligible reconcile → ARCHIVE active Spotlights |
| RLS | SELECT `app.is_exco_viewer()` only (EXCO-only V1); writes still `spotlight.manage`; JWT cannot override interest |
| Audit | `spotlight.create` / `publish` / `archive` / `restore` via existing `writeAuditLog` |
| Headshot | Availability = non-empty `profile_image_storage_key`. **Upload UX not invented** (deferred prerequisite) |

### Key files

```text
supabase/migrations/20260909140000_phase15_spotlight_system.sql
src/features/spotlight/
  eligibility.ts
  projection.ts
  profile-mapper.ts
  own-interest.ts
  commands.ts
  actions.ts
  spotlight-interest-form.tsx
  spotlight-panels.tsx
src/app/exco/spotlight/page.tsx
src/app/settings/page.tsx (interest control)
scripts/phase15-db-closeout.ts
e2e/phase-15-closeout-evidence.spec.ts
src/features/spotlight/eligibility.test.ts
src/features/spotlight/phase15-boundary.integration.test.ts
```

---

## 3. Locked decisions (preserved)

P15-01…P15-32 remain as decided in planning. Implementation did not reopen them.

Notable implementation choices within locked latitude:

* Editorial `title` on create defaults to current `displayName` (required column; no EXCO re-entry form).
* Unpublish / eligibility loss prefers **ARCHIVE** (audit clarity).
* Viewer read via EXCO route + `assertExcoDashboardAccess`; mutations require `spotlight.manage`.

---

## 4. Verification summary (local disposable)

| Gate | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint | PASS |
| Vitest (full suite, 132 tests) | PASS |
| Phase 15 boundary integration | PASS (forged eligibility, Viewer/Member deny, cardinality, concurrency, IDOR, interest withdraw, live projection, no DIRECTORY, cross-member interest) |
| Phase 15 DB closeout | PASS |
| Playwright `e2e/phase-15-closeout-evidence.spec.ts` | PASS |
| `next build` | PASS (`/exco/spotlight` present; no `/admin`) |

### Evidence matrix (honest)

| Requirement | Evidence | Classification |
| --- | --- | --- |
| `/exco/spotlight` | Playwright | DIRECTLY TESTED |
| `/admin/spotlight` absent | Playwright + build routes | DIRECTLY TESTED / CODE REVIEWED |
| Eligibility calculator | Unit + boundary | DIRECTLY TESTED |
| Completion = Phase 8 100% | Shared `calculateProfileCompletion` | DIRECTLY TESTED / PREVIOUSLY EVIDENCED |
| Verification = VERIFIED | Boundary | DIRECTLY TESTED |
| Interest ownership | Boundary + RLS guard + Playwright | DIRECTLY TESTED |
| Viewer mutation denial | Boundary + Playwright | DIRECTLY TESTED |
| Forged eligibility | Boundary | DIRECTLY TESTED |
| IDOR random UUID | Boundary | DIRECTLY TESTED |
| Privacy (no contact/business) | Projection unit + boundary | DIRECTLY TESTED |
| Live profile data | Boundary | DIRECTLY TESTED |
| Concurrency one-active | Boundary | DIRECTLY TESTED |
| Consent fabrication absent | Boundary + DB closeout | DIRECTLY TESTED |
| Production unchanged | No prod deploy/migration | CODE REVIEWED / OPERATIONAL |

---

## 5. Adversarial summary

| Attack | Result |
| --- | --- |
| Viewer create | DENY |
| Member create | DENY |
| Anonymous `/exco/spotlight` | Redirect sign-in |
| Forged eligibility flags | IGNORED / DENY |
| Guessed profile UUID | PROFILE_NOT_FOUND |
| Duplicate active create | ALREADY_SPOTLIGHTED |
| Concurrent create | Exactly one active |
| Interest withdraw | Archives active; no consent rows |
| Contact/business in projection | Absent |
| `/admin/spotlight` | Not a Spotlight product (4xx / no heading) |
| Public `/spotlight` routes | No product surface |

**Defects at lock:** P0=0, P1=0, P2=0. No open P3 blockers.

---

## 6. Known limitations / deferred

* **Headshot upload UX** — prerequisite; candidate pool empty without storage keys (test seeds keys only).
* Public/member Spotlight, SEO, social sharing, scheduling, CMS, business Spotlight — **DEFERRED / REJECTED** as planned.
* Storage object existence beyond metadata key is not verified (honest metadata gate).

---

## 7. Production

```text
Production changes: NONE
```

Local Supabase only for migration apply and evidence.

---

## 8. HARD STOP

```text
PHASE 12–15 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 16+ — NOT AUTHORIZED
Do not begin Phase 16.
Do not add public Spotlight.
Do not invent headshot upload in this phase.
```
