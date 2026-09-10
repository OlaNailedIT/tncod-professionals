# Phase 14 — Consent & Visibility Centre

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date (decision closure):** 2026-09-08  
**Date (implementation lock):** 2026-09-09  
**Canonical route:** `/settings/privacy`  
**Product surface:** Member Visibility Centre (privacy preferences) — not legal consent theater, not publication, not verification, not directory product

---

## Governance

```text
PHASE 5–14 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 15+ — NOT AUTHORIZED

HARD STOP

Production changes: NONE
```

---

## Purpose

Members express what they are comfortable sharing. The platform remains responsible for what is actually eligible and authorized to expose.

```text
MEMBER PREFERENCE NEVER GRANTS ACCESS.

EFFECTIVE EXPOSURE
=
MEMBER PREFERENCE
∩
PLATFORM PROJECTION ALLOWLIST
∩
RECORD ELIGIBILITY
∩
REQUEST AUTHORIZATION
```

```text
DEFAULT PUBLIC PREFERENCE ≠ DEFAULT PUBLIC EXPOSURE
Visibility preference ≠ legal consent
```

---

## Delivered implementation

| Area | Delivery |
| --- | --- |
| Migration | `supabase/migrations/20260909120000_phase14_visibility_preferences.sql` |
| Table | `profile_visibility_preferences` `(profile_id, group_key, preference)` unique |
| Defaults | Backfill + `AFTER INSERT` seed trigger (P14-15) |
| RLS | Owner SELECT/INSERT/UPDATE/DELETE via `app.owns_profile`; anon denied |
| Prisma | `ProfileVisibilityPreference` + `VisibilityPreferenceLevel` |
| Domain | `src/features/visibility/*` — groups, schema, own-preferences, apply-projection, actions |
| UI | `/settings/privacy` + settings hub link |
| Phase 13 wire | `listDirectoryProfessionals` / `getDirectoryProfessionalBySlug` include prefs and withhold only |
| P14-21 | Identity must stay PUBLIC while `DIRECTORY`; enforced on upsert; publish forces identity PUBLIC |
| Consent | **No** writes to `consents` |

### UX vocabulary

Private / TNCOD members / Public directory (not raw enums as primary labels).

### Commands

- `getMyVisibilityPreferences(authUserId)`
- `upsertMyVisibilityPreference(authUserId, raw)` — rejects client `profileId` / `userId` / unsupported levels

---

## Field/group matrix (locked + shipped)

| Group | Control | Allowed levels | Default | Public directory fields affected |
| --- | --- | --- | --- | --- |
| identity | Member (locked while DIRECTORY) | PRIVATE, MEMBERS, PUBLIC | PUBLIC | displayName, headline, professionalTitle |
| professional | Member | PRIVATE, MEMBERS, PUBLIC | PUBLIC | profession, industryName |
| skills_services | Member | PRIVATE, MEMBERS, PUBLIC | PUBLIC | skillNames, serviceNames |
| location | Member | PRIVATE, MEMBERS, PUBLIC | PUBLIC | location |
| about | Member | PRIVATE, MEMBERS | PRIVATE | (none — not in Phase 13 allowlist) |
| links | Member | PRIVATE, MEMBERS | PRIVATE | (none) |
| opportunities | Member | PRIVATE, MEMBERS | PRIVATE | (none) |
| business | Member | PRIVATE, MEMBERS | PRIVATE | (none) |
| contact | Fixed private | PRIVATE | PRIVATE | (never) |
| community | Fixed private | PRIVATE | PRIVATE | (never) |
| documents / platform state | SYSTEM | — | — | (never) |
| headshot | DEFERRED | — | — | — |

---

## Security model

- Session → own profile only; client IDs rejected
- Server allowlist of group→levels (Zod + DB CHECK)
- Preferences cannot expand Phase 13 `PublicProfessional`
- EXCO ops access unchanged by preferences
- Withheld values are null/empty in server projection — not CSS-hidden

---

## Evidence (2026-09-09)

| Gate | Result | Evidence class |
| --- | --- | --- |
| TypeScript | PASS | DIRECTLY TESTED (`tsc --noEmit`) |
| ESLint (Phase 14 paths) | PASS | DIRECTLY TESTED |
| Vitest | PASS — 113 tests | DIRECTLY TESTED |
| Phase 14 unit | PASS | DIRECTLY TESTED |
| Phase 14 boundary + RLS sim | PASS | DIRECTLY TESTED |
| Phase 12/13 boundary regression | PASS | DIRECTLY TESTED |
| Phase 14 DB closeout | PASS | DIRECTLY TESTED (`scripts/phase14-db-closeout.ts`) |
| Playwright | PASS | DIRECTLY TESTED (`e2e/phase-14-closeout-evidence.spec.ts`) |
| Production build | PASS | DIRECTLY TESTED (`next build`; includes `/settings/privacy`) |
| Hosted production DB | NOT TOUCHED | — |

### Adversarial (DIRECTLY TESTED unless noted)

| Case | Result |
| --- | --- |
| Unsupported Public (contact/business/opportunities) | DENIED |
| Forged profileId in payload | DENIED |
| IDOR via RLS JWT simulation | DENIED (0 rows / error) |
| Allowlist bypass (About Public) | NOT EXPOSED |
| Ineligible / unpublished / known slug | NOT PUBLIC |
| Contact/community in public payload | NOT PRESENT |
| No fabricated consent rows | PASS |
| EXCO authz revoked by Private pref | NO (CODE REVIEWED + prior Phase 11/12; prefs not consulted by EXCO loaders) |

### Defects at lock

```text
P0: 0
P1: 0
P2: 0
P3: 0 documented blockers
```

P3 note (non-blocking): Playwright proves Location UI save + directory withhold; a second consecutive radio save in the same session is not required for lock after store+projection evidence. Prefer waiting for save feedback / checked state if extending browser coverage.

---

## Phase 13 regression constraints (preserved)

`/professionals`, `/professionals/[slug]`, VERIFIED∧DIRECTORY, slug, `noindex`, allowlist shape, anon=member V1.

---

## Deferred / rejected

**Deferred:** legal consent UI; headshot; public business directory; anon≠member field split; contact/opportunity marketplaces; member preference audit UI.

**Rejected:** global public switch; `/admin`; messaging; AI matching; Phase 15; expanding Phase 13 allowlist via preference; fabricating consent history.

---

## Production impact

```text
Production changes: NONE
```

Local disposable Supabase only.

---

## Current state

```text
PHASE 5–14 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 15+ — NOT AUTHORIZED

HARD STOP
```
