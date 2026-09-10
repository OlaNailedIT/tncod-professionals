# Phase 17 — Deterministic Matching

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date (implementation lock):** 2026-09-09  
**Canonical surface:** EXCO potential matches on `/opportunities/[id]`  
**Rejected:** `/admin`, AI, messaging, applications, member match enumeration, persisted match rows, % scores

---

## Governance

```text
PHASE 5–17 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 18+ — NOT AUTHORIZED

HARD STOP

Production changes: NONE
```

---

## Objective

Establish a structured, deterministic, explainable matching foundation:

```text
Opportunity structured requirements
        ↓
Database-level candidate filter (VERIFIED + ACTIVE)
        ↓
Deterministic dimension rules
        ↓
Safe EXCO potential-match projection
```

A **potential match** means only: based on structured data currently available, this professional potentially matches this opportunity. It does **not** mean interest, application, qualification approval, contact, or selection.

`Potential Match ≠ Expressed Interest` — `opportunity_interests` remains a separate Phase 16 domain.

**AI is not authorized** in Phase 17 (no LLMs, embeddings, vectors, semantic search, AI scores).

---

## Architecture choice — dynamic evaluation

**Option A (chosen):** Dynamic evaluation on each authorized view.

- No `matches` / `opportunity_matches` tables
- Results always reflect current opportunity + professional data
- Stale-match risk eliminated by design

**Option B (rejected for V1):** Persisted match rows (requires generation, invalidation, cleanup).

---

## Supported dimensions

| Dimension | Opportunity source | Professional source | Rule |
| --- | --- | --- | --- |
| Profession | `required_profession` | `professional_details.profession` | Case-insensitive exact match |
| Location | `location_preference` | `profiles.location` | Equality or either contains the other (normalized) |
| Experience | `min_years_experience` | `professional_details.years_experience` | Years ≥ minimum |
| Work type | `employment_type` | `experiences.employment_type` (any row) | Required type present in experience set |
| Skills | `opportunity_skills` | `profile_skills` | **ALL** required skill IDs must be present |
| Availability | `availability` (free text) | *(none structured)* | Unset → NOT_REQUIRED; set → INSUFFICIENT_DATA (honest gap) |

Unset requirements → `NOT_REQUIRED` (dimension does not participate).

### Classification

```text
Any NO_MATCH           → NO_MATCH
Any INSUFFICIENT_DATA  → INSUFFICIENT_DATA (if no NO_MATCH)
All NOT_REQUIRED       → INSUFFICIENT_DATA (no useful criteria)
≥1 MATCH, rest OK      → POTENTIAL_MATCH
```

No percentage scores. No opaque weighting.

### Deferred / insufficient structured data

- Professional remote preference (no field) → remotePreference not matched
- Structured availability on professionals → not available; free-text availability on opportunity forces INSUFFICIENT_DATA when set
- Phase 8 completion rules unchanged

---

## Eligibility

| Gate | Rule |
| --- | --- |
| Opportunity | `status = ACTIVE` only |
| Professional | `verification_status = VERIFIED` ∧ user `account_status = ACTIVE` ∧ not deleted |
| Directory | **Not** required (matching ≠ publication) |
| Interest | Not used as eligibility |

---

## Authorization

| Actor | Match access |
| --- | --- |
| SUPER_ADMIN / EXCO_ADMIN | ALLOW (`assertExcoDashboardAccess` + `opportunity.view` or `opportunity.manage`) |
| EXCO_VIEWER | ALLOW (read) |
| MEMBER | DENY (even with `opportunity.view`) |
| Anonymous | DENY |

No new permission invented. EXCO role gate prevents member enumeration via `opportunity.view`.

Client-supplied `userId` / `role` / `professionalId` are rejected or ignored; population is server-authoritative.

---

## Privacy & projection

Safe projection fields only:

- `profileId`, `displayName`, `profession`, `location`, `yearsExperience`, `skillNames`, `verificationStatus`, `outcome`, `dimensions`

Forbidden: phone, email, WhatsApp, auth IDs, consent, interest history, storage keys, clarification messages.

Matching does not fabricate consent. Matching does not bypass Phase 13/14 visibility for public exposure — results are EXCO operational only.

---

## Schema refinement

Migration: `supabase/migrations/20260909180000_phase17_matching.sql`

- `opportunities.required_profession` TEXT
- `opportunities.min_years_experience` INT CHECK 0–80
- `opportunity_skills` (opportunity_id, skill_id) + RLS aligned with opportunities

No duplicate profile/opportunity domains. Prisma is not migration authority.

---

## Key files

```text
supabase/migrations/20260909180000_phase17_matching.sql
src/features/matching/
  rules.ts
  rules.test.ts
  projection.ts
  commands.ts
  actions.ts
  matches-panel.tsx
  phase17-boundary.integration.test.ts
src/features/opportunities/  (create schema/form extended for optional criteria)
src/app/opportunities/[id]/page.tsx
scripts/phase17-db-closeout.ts
e2e/phase-17-closeout-evidence.spec.ts
```

---

## Evidence matrix

| Claim | Evidence | Classification |
| --- | --- | --- |
| Deterministic matching service | `commands.ts` + boundary tests | Directly tested |
| Profession / location / experience / work type / skills | `rules.test.ts` | Directly tested |
| Availability honest gap | `rules.test.ts` | Directly tested |
| Safe projection | projection assert + boundary | Directly tested |
| Unauthorized denial | boundary + Playwright member | Directly tested |
| Private field absence | boundary + Playwright | Directly tested |
| Stale-data handling | boundary (profession change) | Directly tested |
| Closed opportunity | boundary + DB closeout | Directly tested |
| Authorized UI | Playwright Phase 17 | Directly tested |
| No persisted matches | DB closeout | Directly tested |
| Production unchanged | Operational | Code reviewed / operationally verified |

---

## Verification (recorded at lock)

| Gate | Result |
| --- | --- |
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint`) | PASS |
| Vitest (`npm run test`) | PASS — 31 files / 154 tests |
| DB closeout (`scripts/phase17-db-closeout.ts`) | PASS |
| Playwright (`e2e/phase-17-closeout-evidence.spec.ts`) | PASS — 1/1 |
| Next build (`npm run build`) | PASS |

---

## Adversarial results

| Attack | Result |
| --- | --- |
| Member match enumeration | DENY |
| Anonymous match access | DENY (auth gate) |
| Guessed opportunity ID (member) | DENY |
| Forged professional target | IGNORED |
| Forged actor `userId` | DENY |
| Private data leakage | NO |
| Visibility / consent fabrication | NO |
| Verification bypass (unverified) | NO |
| Stale data | Dynamic recompute |
| Closed opportunity active match | Handled (`OPPORTUNITY_CLOSED`) |
| AI / messaging / applications | ABSENT |

---

## Defects at lock

```text
P0: 0
P1: 0
P2: 0
P3: none blocking
```

---

## Deferred

```text
AI-assisted matching
Embeddings / vectors / semantic search
Member-facing recommendations
Messaging / contact exchange / notifications
Applications / recruitment workflows
Public matching / marketplace / CRM / SEO
Structured professional availability & remote preference fields
Persisted match lifecycle
```

---

## Production

```text
Production changes: NONE
```
