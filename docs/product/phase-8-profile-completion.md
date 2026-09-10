# Phase 8 — Profile Completion System

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Forensic reconciliation:** 2026-09-08 — premature lock withdrawn, P2 gaps fixed, then re-locked.  
**Governance:** Phase 5 closed · Phase 6 locked · Phase 7 locked · Phase 8 locked · Phase 9+ not authorized.

## Purpose

Authenticated members need a clear, low-pressure way to understand how complete their professional profile is, what is already present, what is missing, and how to edit it — without treating completion as verification, publication, or a second status system.

## Scope

Phase 8 implements:

- `/profile` as the completion overview (view + section progress)
- Derived completion percentage from persisted profile data
- Section completion for About you, Professional, Community, Opportunities
- Conditional Business section (read-only existing links; no business management)
- Expanded `/profile/edit` using Phase 5 form primitives
- Person-level **Industry** via `professional_details.industry_id` (≠ organisation/workplace)
- Opportunity preference flags (Collaboration, Mentorship, Referrals, Training) via JSONB
- Persistence through the existing member profile update path

Phase 8 does **not** implement directory, verification, EXCO, opportunities marketplace, messaging, business create/link UI, headshot upload UI, or gamification.

## Field crosswalk (forensic)

| Requirement | DB | API/service | UI | In completion? | Persisted? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Preferred name | `profiles.display_name` | `displayName` | Preferred name | Yes | Yes | Complete |
| Headshot | `profiles.profile_image_storage_key` | `hasHeadshot` | Informational only | **No** (deferred) | Key only; no upload UX | INTENTIONAL DEFERRED — private storage exists; signed upload/view helpers not implemented (`docs/security/storage-security.md`) |
| Location | `profiles.location` | `location` | Location | Yes | Yes | Complete |
| Bio | `profiles.bio` | `bio` | Bio | Yes | Yes | Complete |
| Profession | `professional_details.profession` | `profession` | Profession | Yes | Yes | Complete |
| Industry | `professional_details.industry_id` → `industries` | `industryId` / `industryName` | Industry select | Yes | Yes | Complete (migration) — **not** organisation |
| Experience | `years_experience` and/or `experiences` | `yearsExperience` / `hasExperienceRows` | Years of experience | Yes | Yes | Complete (simple model, not CV builder) |
| Skills | `profile_skills` → `skills` | `skillNames` | Skills (comma list) | Yes | Yes | Complete |
| Services | `profile_services` → `services` | `serviceNames` | Services (comma list) | Yes | Yes | Complete |
| LinkedIn | `professional_details.linkedin_url` | `linkedinUrl` | LinkedIn | Yes (valid URL) | Yes | Complete |
| Service/department | — | — | Documented absent | No | No | INTENTIONAL DEFERRED — Phase 2 `church_information` is `service_area` only |
| Areas of service | `church_information.service_area` | `serviceArea` | Areas of service | Yes | Yes | Complete |
| Seeking | `looking_for_summary` | `lookingForSummary` | Seeking | Yes | Yes | Complete |
| Offering | `offering_summary` | `offeringSummary` | Offering | Yes | Yes | Complete |
| Collaboration | `opportunity_preferences.collaboration` | prefs | Yes/No/Not set | Yes when set | Yes | Complete (migration) |
| Mentorship | `opportunity_preferences.mentorship` | prefs | Yes/No/Not set | Yes when set | Yes | Complete |
| Referrals | `opportunity_preferences.referrals` | prefs | Yes/No/Not set | Yes when set | Yes | Complete |
| Training | `opportunity_preferences.training` | prefs | Yes/No/Not set | Yes when set | Yes | Complete |
| Business | `business_professionals` → `businesses` | `businessLinks` | Conditional read-only | Conditional | Existing links only | Complete for Phase 8 display/completion rules |

### Classification notes

- **Organisation/workplace** remains editable for continuity with Phase 6/7. It is **not** Industry and is **not** in the completion denominator.
- **Service/department ≠ Areas of service.** Separate department was never in Phase 2 DDL; inventing church structure is out of scope.
- **Headshot** must not penalise members who cannot upload. Shown honestly; excluded from %.

## Completion algorithm

Authoritative: `src/features/profile/completion.ts` → `calculateProfileCompletion`.

```text
About You        20   preferred name, location, bio
Professional     30   profession, industry, experience, skills, services, LinkedIn
Community        15   areas of service
Opportunities    25   seeking, offering, collaboration, mentorship, referrals, training
Business         10   conditional (linked business + industry/description)
```

Section score = `(completed / total) × weight`.  
Overall = `round(sum / applicableWeights × 100)`, clamped `[0, 100]`.

Empty rules: null/blank/placeholders incomplete; empty arrays incomplete; LinkedIn must be valid `linkedin.com` URL; preference **Yes** and **No** both count as set; unset does not.

Business applicable when `business_professionals` links exist **or** situation indicates entrepreneur/business owner. Otherwise Business excluded from UI and denominator.

## Database

Migration: `supabase/migrations/20260908120000_phase8_profile_completion_fields.sql`

- `professional_details.industry_id` (FK → `industries`, ON DELETE SET NULL)
- `professional_details.opportunity_preferences` JSONB default `{}`
- Idempotent industry catalogue seed

No Prisma migrations. RLS unchanged (existing `professional_details` owner write policies). Status fields never written by Phase 8.

## Security

- Authenticated `/profile` and `/profile/edit` only
- Ownership via session; IDOR denied on `/api/member/profile?userId=`
- No browser service-role; no completion→verify/publish side effects

## Closeout evidence (2026-09-08 final gate)

### Database sanity (`scripts/phase8-db-closeout.ts`)

- `professional_details.industry_id` (uuid) present
- `professional_details.opportunity_preferences` (jsonb) present
- FK `professional_details_industry_id_fkey` present
- Industry catalogue: 10 rows, **no duplicate slugs**
- RLS enabled on `profiles`, `professional_details`, `industries`, `business_professionals`
- Owner write policies on `professional_details` unchanged (select/insert/update/delete — no FOR ALL widen)
- Migration version `20260908120000` recorded in `supabase_migrations.schema_migrations`
- Result: **PHASE8_DB_CLOSEOUT_PASS**

### Playwright closeout suite (`e2e/phase-8-closeout-evidence.spec.ts`) — 3/3 PASS

1. **Industry + opportunity prefs**
   - UI set Industry=Technology + Collaboration/Mentorship/Referrals/Training
   - Save → `/profile` shows values; reload preserves %
   - `GET /api/member/profile` returns persisted `industryName` + preference booleans + matching `completion.percent`
   - `headshotDeferred: true` on completion payload
   - Clear via authenticated `PATCH /api/member/profile` (`industryId: none`, prefs unset) → % decreases; Industry shows “Not added yet”; API nulls confirmed
2. **Business conditionality** — employee: no Business heading; entrepreneur: Business heading present
3. **IDOR** — `GET /api/member/profile?userId=<other>` → 403

### Community decision (auditable)

Phase 8 uses the existing `church_information.service_area` representation for community service information. A separate service/department taxonomy is deferred and is **not** part of the completion calculation.

### Headshot decision (auditable)

Private `profile_image_storage_key` may exist, but upload UX is deferred. Headshot is **excluded from the completion denominator**.

## Testing

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS |
| Unit (completion) | PASS |
| Build | PASS (prior gate) |
| Playwright Phase 8 suite | PASS |
| Playwright Phase 8 **closeout** (new fields) | **PASS 3/3** |
| Database closeout script | **PASS** |
| Security (auth + IDOR) | PASS |

## Limitations (honest)

- Not WCAG certification / pen-test
- Headshot upload/change UX deferred (private key path only)
- Service/department column not added
- Business create/link management deferred
- Experience is years / row presence — not a CV builder

## P3 follow-ups

- Headshot upload through private storage + signed URLs
- Optional service/department if product later adds a schema column
- Richer experience rows UI

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 7 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 8 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 9 — NOT AUTHORIZED
HARD STOP
```
