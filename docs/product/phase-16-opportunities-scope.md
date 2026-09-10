# Phase 16 — Opportunities V1.1 (Connection-engine seed)

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date (implementation lock):** 2026-09-09  
**Canonical member route:** `/opportunities`  
**Detail route:** `/opportunities/[id]`  
**Rejected:** `/admin/opportunities`, public Opportunities, messaging, applications
*(Matching deferred to Phase 17 — now locked separately.)*

---

## Governance

```text
PHASE 5–16 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 17 — PASS / COMPLETE / VERIFIED / LOCKED (see phase-17-matching-scope.md)

PHASE 18+ — NOT AUTHORIZED

HARD STOP (Phase 16)

Production changes: NONE
```

---

## Domain evolution note

Phase 2 modelled `opportunities` as **member-owned intents** (`SEEKING_EMPLOYMENT` / `OFFERING_SERVICES` / `COLLABORATION`).

Phase 16 **reuses the same table** and refines it into **EXCO-curated platform opportunities** + **member interest**, without creating `opportunities_v2`.

This is intentional Phase 16 product evolution authorized by implementation instruction — not a silent reopen of Phase 2 for marketplace features. Jobs remains a **type**, not a recruitment platform.

---

## What shipped

| Capability | Reality |
| --- | --- |
| Types | `JOBS`, `BUSINESS`, `COLLABORATION`, `TRAINING`, `MENTORSHIP`, `OTHER` |
| Lifecycle | `DRAFT` / `ACTIVE` / `CLOSED` / `EXPIRED` — V1.1 create → ACTIVE; close → CLOSED |
| Create | `opportunity.manage` (EXCO_ADMIN / SUPER_ADMIN); Viewer/Member denied |
| Discover | Authenticated members; ACTIVE only (EXCO manage can also see drafts) |
| Interest | `opportunity_interests` unique `(opportunity_id, profile_id)`; reversible withdraw |
| Privacy | No contact exposure; no interest lists/counts in UI; no consent writes |
| Attribution | “Posted by TNCOD Professionals” — no creator profile disclosure |

### Key files

```text
supabase/migrations/20260909160000_phase16_opportunities.sql
src/features/opportunities/
  schema.ts
  projection.ts
  commands.ts
  actions.ts
  create-form.tsx
  interest-controls.tsx
  close-button.tsx
src/app/opportunities/page.tsx
src/app/opportunities/[id]/page.tsx
scripts/phase16-db-closeout.ts
e2e/phase-16-closeout-evidence.spec.ts
```

### Authorization

* MEMBER: `opportunity.view` only (seed + DB removed `opportunity.manage`)
* EXCO_VIEWER: view only
* EXCO_ADMIN / SUPER_ADMIN: `opportunity.manage`

### RLS

* Opportunities SELECT: EXCO viewer **or** `status = ACTIVE`
* Opportunities INSERT/UPDATE: `opportunity.manage`
* Interests: own profile insert/delete; own or EXCO select; no UPDATE

---

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS |
| Vitest (141) | PASS |
| Phase 16 DB closeout | PASS |
| Playwright Phase 16 | PASS |
| `next build` | PASS |

### Evidence matrix

| Requirement | Evidence | Classification |
| --- | --- | --- |
| `/opportunities` auth-gated | Playwright | DIRECTLY TESTED |
| EXCO create | Playwright + boundary | DIRECTLY TESTED |
| Member interest + persist | Playwright + DB | DIRECTLY TESTED |
| Viewer/Member cannot create | Boundary + Playwright | DIRECTLY TESTED |
| Forged creator/userId | Boundary | DIRECTLY TESTED |
| Duplicate/concurrent interest | Boundary | DIRECTLY TESTED |
| Closed denies new interest | Boundary | DIRECTLY TESTED |
| No consent fabrication | Boundary + DB closeout | DIRECTLY TESTED |
| Projection no contact/creator IDs | Unit | DIRECTLY TESTED |
| Production unchanged | No prod deploy | CODE REVIEWED / OPERATIONAL |

---

## Adversarial summary

| Attack | Result |
| --- | --- |
| Anonymous `/opportunities` | Redirect sign-in |
| Member/Viewer create | DENY |
| Forged `createdBy` | IGNORED (session actor) |
| Forged `userId` on interest | DENY |
| Forged `profileId` only | IGNORED (session profile) |
| Duplicate interest | Idempotent one row |
| Concurrent interest | One row |
| Closed interest | DENY |
| Random UUID | NOT_FOUND |
| XSS in description | Angle brackets stripped for display |
| Consent from interest | Absent |

**Defects:** P0=0, P1=0, P2=0

---

## Deferred (not shipped)

Messaging · contact exchange · matching/AI · notifications · job applications · recruitment · business/training marketplaces · mentorship assignment · scheduling · payments · CRM · exports · bulk ops · public opportunities · SEO/social

---

## Production

```text
Production changes: NONE
```

---

## HARD STOP

```text
PHASE 5–16 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 17+ — NOT AUTHORIZED
Do not begin Phase 17.
Do not add messaging, matching, applications, or marketplace.
```
