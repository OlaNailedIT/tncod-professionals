# Phase 20 — Analytics & Operational Intelligence

**Document type:** Planning / implementation contract + delivery evidence  
**Closeout date:** 2026-09-11  
**Status:**

```text
PHASE 20 — PASS / COMPLETE / VERIFIED / LOCKED
```

**Depends on:**

```text
PHASE 18 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 19 — PASS / COMPLETE / VERIFIED / LOCKED
```

**Phase 21+:** NOT AUTHORIZED  

**Naming clarification:** Earlier infrastructure notes referred to “Phase 20” for **Auth Site URL / production Auth cutover**. That work is **OUT OF SCOPE** for this Analytics Phase 20 and remains a **separately authorized future gate** (do not conflate).

---

## 1. Purpose

Allow authorized EXCO users to understand the professional community through **trustworthy aggregate intelligence** over existing source-of-truth domains.

Questions Phase 20 answers:

```text
WHO DO WE HAVE?
WHAT DO THEY DO?
WHERE ARE THEY?
WHAT BUSINESSES EXIST?
WHAT DO THEY NEED?   (only where structured data exists)
WHAT CAN THEY OFFER? (only where structured data exists)
HOW HEALTHY IS THE PLATFORM?
```

Phase 20 is **not** a second admin system, CRM, matching engine, marketplace, messaging system, recommendation engine, or AI system.

---

## 2. Governance — Phase 18 verification (this gate)

| Check | Result |
| --- | --- |
| Docs lock | **PASS** — `docs/product/phase-18-historical-google-form-migration-scope.md`, `.cursor/rules` |
| Production import | Pass 1 CREATED 18; Pass 2 SKIP_ALREADY_IMPORTED 18 |
| Historical integrity (post-orphan cleanup) | Auth 18; active historical users 18; profiles 18; provenance 18; COMPLETE_SAFE 18 |
| Orphan | Soft-deleted (`deleted_at`); not Phase 18; Auth/profile/roles/refs were none |
| Public-state safety | consent 0; spotlight 0; businesses 0; unsafe public 0 |
| Creator of orphan | **UNKNOWN** — not reconstructed |

```text
PHASE 18 — PRODUCTION IMPORT COMPLETE
PHASE 18 — HISTORICAL DATA VERIFIED
PRE-EXISTING ORPHAN — DISPOSITIONED
PHASE 18 — PASS / COMPLETE / VERIFIED / LOCKED
```

Do not reopen Phase 18.

---

## 3. Governance — Phase 19 verification (this gate)

### Production application path (CODE REVIEWED + LIVE SMOKE)

```text
Vercel Production
  → Next.js
  → getPrisma() / PrismaClient
  → env DATABASE_URL
  → Hosted Supabase PostgreSQL (brpppukzqgpzxjelwwrj)
```

Docker / local Supabase = local only — **not** Production path.

### Production target

| Item | Result |
| --- | --- |
| Intended project ref | `brpppukzqgpzxjelwwrj` |
| Canonical origin | `https://tncod-professionals-azure.vercel.app` |
| Production DATABASE_URL | Owner-configured (presence validated by live app behaviour; secret not printed) |
| Credential failure class | **Not observed** on smoke |

### Route verification (2026-09-11)

| Route | Result |
| --- | --- |
| `/` | HTTP **200** |
| `/professionals` | HTTP **200** |

### Schema / RLS / regression

| Item | Result |
| --- | --- |
| Schema authority | `supabase/migrations/` only |
| Prisma migrations | Prohibited (unchanged) |
| RLS | Unchanged by this gate |
| Phase 13 directory | Unchanged; empty public directory still expected until VERIFIED+DIRECTORY |
| This gate mutations | **0** |

```text
PHASE 19 — PASS / COMPLETE / VERIFIED / LOCKED
```

---

## 4. Supabase Advisor — `directory_professionals` / SECURITY DEFINER

### Evidence

| Question | Finding |
| --- | --- |
| Object exists? | **YES** — `app.directory_professionals()` + view `public.directory_professionals` (`20260909080000_phase13_directory_projection.sql`) |
| Still SECURITY DEFINER? | **YES** — intentional (`SET search_path = public, pg_temp`) |
| Used by architecture? | **YES** — Phase 3/13 security contract allowlist; GRANTed to `anon`/`authenticated` so public never needs SELECT on `profiles`. App listing path is Prisma with the **same** eligibility/allowlist (`listDirectoryProfessionals`) |
| Genuine exploitable defect? | **No new evidence** in this gate. Function returns allowlisted columns only; WHERE enforces VERIFIED+DIRECTORY+not deleted+slug |
| Changing it reopen Phase 13? | **YES** |
| Already deferred? | **YES** — Phase 19 report: “Unrelated Supabase Advisor warnings: deferred / out of Phase 19 scope” |

### Classification

```text
SAFE TO REMAIN DEFERRED
```

**Why:** Advisor flags intentional SECURITY DEFINER public projection. Remediation for green Advisor would be a **separate security remediation** gate if product later requires INVOKER redesign — not a Phase 19 unlock blocker and not Phase 20 Analytics work. Do not rewrite the function to silence Advisor.

---

## 5. Analytics principles (LOCKED)

```text
Phase 20 is an analytics/read-model capability over existing source-of-truth domains.
```

```text
Metric definitions are deterministic.
Metric source is authoritative.
Metric calculation is server-side.
Client input cannot alter historical metric results.
Unauthorized users cannot obtain EXCO analytics.
Analytics cannot mutate source records.
Analytics cannot expand directory exposure.
Analytics cannot bypass visibility rules.
Analytics cannot infer unsupported facts.
```

**Default aggregation approach:**

> Existing source-of-truth data + **server-side Prisma / service aggregation** (same pattern as Phase 10 `computeExcoDashboardMetrics`). No duplicated mutable analytics tables unless a demonstrated need appears later.

**Rejected without separate authorization:** Redis/warehouse/ClickHouse/external BI; client-side aggregation of member datasets; raw PII export.

---

## 6. Data-source audit

| Domain | Source | Authority | Current state | Phase 20 usable? | Notes |
| --- | --- | --- | --- | --- | --- |
| Users / registration | `public.users` | AUTHORITATIVE | Live | YES | `created_at`, `deleted_at`, `account_status`; id = Auth id |
| Profiles | `public.profiles` | AUTHORITATIVE | Live | YES | status triad remains separate |
| Professional details | `professional_details` | AUTHORITATIVE | Live | YES | profession, industry_id, looking/offering, prefs JSON |
| Industries | `industries` | AUTHORITATIVE | Live | YES | via `industry_id` |
| Skills | `skills` + `profile_skills` | AUTHORITATIVE | Live | YES | active skills only |
| Services | `services` + `profile_services` | AUTHORITATIVE | Live | YES | active services only |
| Location | `profiles.location` | AUTHORITATIVE (free text) | Live | YES w/ care | Not normalized geo |
| Professional situation | `profiles.professional_situation` | AUTHORITATIVE (controlled enum labels) | Live | YES | Registration/edit controlled set |
| Businesses | `businesses` | AUTHORITATIVE | Live | YES | Separate from professional verification |
| Business↔professional | `business_professionals` | AUTHORITATIVE | Live | YES | `OWNER` ≠ any link |
| Verification (pro) | `profiles.verification_status` | AUTHORITATIVE | Live | YES | Keep separate from business |
| Verification (biz) | `businesses.business_status` | AUTHORITATIVE | Live | YES | APPROVED = verified business |
| Publication / directory | `profiles.visibility_status` + eligibility | AUTHORITATIVE | Live | YES | Effective DIRECTORY ≠ preference |
| Visibility preference | `profile_visibility_preferences` | AUTHORITATIVE | Live | YES as separate metric | Phase 14; never grants access |
| Profile completion | Phase 8 `calculateProfileCompletion` | DERIVED (validated) | Live | YES | Do not reimplement in SQL |
| EXCO dashboard metrics | Phase 10 `computeExcoDashboardMetrics` | DERIVED (locked defs) | Live | YES — reuse | Baseline for health metrics |
| Opportunities | `opportunities` / interests | AUTHORITATIVE | Live | LIMITED | Not primary Phase 20 community composition |
| Consent | `consents` | AUTHORITATIVE | Live | NO for charts | Do not expose; not a composition metric |
| Spotlight | `spotlights` | AUTHORITATIVE | Live | OUT OF SCOPE V1 | EXCO curated; not capacity proxy |
| Audit | `audit_logs` | AUTHORITATIVE | Live | LIMITED | Not a metric source for community |
| Registration events | `logger.info` analytics | UNSAFE / MISSING store | Logs only | NO for conversion | Not persisted queryable events |
| Legacy import flags | `profiles.legacy_import` | LEGACY marker | Live | OPTIONAL filter | Not a composition dimension |
| Volunteer | — | MISSING | — | NO | No field |
| Mentor capacity | — | MISSING | — | NO | Pref “want mentorship” ≠ mentor |
| Client need | — | MISSING structured | free text only | NO | Do not invent |
| Auth Site URL cutover | Supabase Auth config | DEFERRED | Separate gate | NO | Not Analytics Phase 20 |

---

## 7. Metric contract

### Population defaults (LOCKED unless metric overrides)

- **Member population:** `users.deleted_at IS NULL` AND linked `profiles.deleted_at IS NULL`
- **Timezone:** UTC (Phase 10)
- **Do not collapse:** registered ≠ complete ≠ verified ≠ directory published

### System health

| Metric | Definition | Source | Population | Calculation | Time window | Authz | Privacy | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| New registrations | Distinct **non-legacy** members with `users.created_at` in window, not soft-deleted, with non-deleted profile where `profiles.legacy_import = false` | `users` + `profiles.legacy_import` | Genuine platform onboardings | COUNT | Rolling 7/30/90d UTC | EXCO | Aggregate count OK | **LOCKED** (Phase 20 closure: exclude historical imports) |
| Profile completion rate | Members with Phase 8 `percent === 100` / member population | Phase 8 function inputs | Members | COUNT complete / COUNT members | Current-state | EXCO | Aggregate | **LOCKED** |
| Professional verification rate | `verification_status = VERIFIED` / members with profile | `profiles` | Members | COUNT/COUNT | Current-state | EXCO | Aggregate | **LOCKED** |
| Business verification rate | `business_status = APPROVED` / non-deleted businesses | `businesses` | Businesses | COUNT/COUNT | Current-state | EXCO | Aggregate | **LOCKED** |
| Combined verification rate | — | — | — | — | — | — | — | **REJECTED** |
| Directory effective publication | Profiles VERIFIED + DIRECTORY + not deleted + `public_slug` not null | `profiles` | Profiles | COUNT | Current-state | EXCO | Aggregate | **LOCKED** |
| Directory preference (PUBLIC group) | Preference rows / defaults per Phase 14 groups | `profile_visibility_preferences` | Members | COUNT by level | Current-state | EXCO | Aggregate; **separate** from effective publication | **LOCKED** as separate metric |
| Registration conversion | Starts→completes | Persisted events | — | — | — | EXCO | — | **PREREQUISITE** — events only logged, not stored |
| Abandonment | Started not completed | Persisted events | — | — | — | EXCO | — | **PREREQUISITE** — `ABANDONMENT CANNOT BE RETROSPECTIVELY CALCULATED` |

### Community composition

| Metric | Definition | Source | Population | Grouping | Null/unknown | Privacy | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Professions | Count by `professional_details.profession` | `professional_details` | Members | Exact string group | Bucket `(unknown)` | Suppress groups with n &lt; threshold | **LOCKED** |
| Industries | Count by active `industries.name` | `industry_id` | Members | Industry name | `(unknown)` | Same threshold | **LOCKED** |
| Locations | Count by trimmed `profiles.location` | `profiles.location` | Members | Exact trimmed text | `(unknown)` | Same threshold (high re-id risk) | **LOCKED** |
| Businesses (count) | Non-deleted businesses | `businesses` | Businesses | Total (+ optional status breakdown) | — | Aggregate | **LOCKED** |
| Employment / situation | Count by `professional_situation` | Controlled enum labels | Members | Enum value | `(unknown)` | Threshold | **LOCKED** |

### Needs (structured only)

| Metric | Definition | Source | Notes | Status |
| --- | --- | --- | --- | --- |
| Employment need (Job seeker) | `professional_situation = 'Job seeker'` | `profiles` | Reuse Phase 10; do not infer from free text | **LOCKED** |
| Mentorship interest | `opportunity_preferences.mentorship = true` | JSON prefs | Preference signal ≠ matched need | **LOCKED** |
| Training interest | `opportunity_preferences.training = true` | JSON prefs | Same | **LOCKED** |
| Collaboration / partnership interest | `opportunity_preferences.collaboration = true` | JSON prefs | Proxy only | **LOCKED** |
| Referrals interest | `opportunity_preferences.referrals = true` | JSON prefs | Not “clients” | **LOCKED** |
| Client needs | Structured client-seeking field | — | Free text only | **DEFERRED — DATA MODEL INSUFFICIENT** |
| Partnership needs (structured) | Dedicated field | — | Only pref boolean exists | **DEFERRED** beyond pref metric |
| Employment needs beyond Job seeker | — | free text `looking_for_summary` | Do not NLP | **REJECTED** for V1 |

### Capacity

| Metric | Definition | Source | Status |
| --- | --- | --- | --- |
| Skills | Distinct members with each active skill | `profile_skills`→`skills` | **LOCKED** |
| Services | Distinct members with each active service | `profile_services`→`services` | **LOCKED** |
| Business owners | Distinct profiles with `business_professionals.relationship_type = OWNER` on non-deleted business | `business_professionals` | **LOCKED** |
| Mentors | Structured mentor capacity | — | **DEFERRED — DATA MODEL INSUFFICIENT** (pref ≠ mentor) |
| Volunteers | Structured volunteer flag | — | **DEFERRED — DATA MODEL INSUFFICIENT** |

### Current vs historical

| Class | Decision |
| --- | --- |
| Current-state analytics | **IN SCOPE** |
| Time-series / “as of last month” state reconstruction | **DEFERRED** unless event/snapshot store is separately authorized |
| New registrations over windows | **IN SCOPE** using `users.created_at` (creation is durable) |

---

## 8. Authorization (LOCKED)

Reuse Phase 10 EXCO gate:

```text
EXCO_VIEWER | EXCO_ADMIN | SUPER_ADMIN
```

via server-side `assertExcoDashboardAccess` (or equivalent role check). Permission catalogue already includes `report.view` for viewers/admins.

```text
MEMBER → denied
anonymous → denied
client-claimed role metadata → ignored; DB roles only
```

No new analytics role. No `/admin`.

---

## 9. Privacy / aggregation model (LOCKED)

| Topic | Decision |
| --- | --- |
| Aggregation location | **Server-side** (Prisma/service); never ship full member datasets to browser for charting |
| PII | Never return phone, email, documents, consent rows, Auth secrets, internal storage keys in analytics payloads |
| Private fields | Do not expand beyond EXCO operational need; composition uses profession/industry/location/situation aggregates only |
| Visibility | Analytics for EXCO may count private members’ **aggregate** attributes; must not create public exposure; must not dump private profiles |
| Small-count suppression | For **composition breakdowns** (profession/industry/location/situation/skill/service), suppress or bucket groups with **n &lt; 3** as `(suppressed)` — justified by small Production population (≈18) where n=1 re-identifies |
| Totals | Unsuppressed totals (e.g. total members, total businesses) remain visible |
| Raw export | **OUT OF SCOPE** |

---

## 10. Analytics architecture decision (LOCKED)

| Option | Verdict |
| --- | --- |
| A Existing SQL views/functions | Reuse Phase 13 directory function only as security contract — **not** primary EXCO analytics API |
| B New SQL analytics views | **Not required for V1** |
| C Server-side Prisma aggregation | **SELECTED** — matches Phase 10 |
| D Persisted analytics tables | **REJECTED for V1** — no snapshot/event warehouse need proven |

**Optional later (separate decision):** SQL read-only views if query cost becomes evidenced — not convenience.

---

## 11. UI information architecture (LOCKED)

| Item | Decision |
| --- | --- |
| Route | **`/exco/analytics`** (implemented under `/exco` tree; not `/admin`; does not replace `/exco` ops dashboard) |
| Audience | EXCO roles above |
| Sections | Community · Needs · Capacity · System health |
| Filters (V1) | Optional: situation, industry, verification state, directory effective state, date range for **new registrations only** |
| Forbidden filters | Filters that return individual private identities |
| Export | OUT OF SCOPE |
| Empty/loading/error | Implemented: empty breakdowns, unavailable cards, auth redirects; RSC error boundary patterns follow app defaults |

Each section purpose:

| Section | Purpose |
| --- | --- |
| Community | Composition of the member/business population |
| Needs | Structured interest/need signals only |
| Capacity | Skills, services, owners |
| System health | Funnel health using locked definitions |

---

## 12. Decision register

| Decision | Class |
| --- | --- |
| Analytics purpose = EXCO operational intelligence | LOCKED |
| Audience = EXCO_VIEWER / EXCO_ADMIN / SUPER_ADMIN | LOCKED |
| Metric source = domain tables + Phase 8/10 derived | LOCKED |
| Current-state vs historical | LOCKED (current + registration windows; no fabricated history) |
| Abandonment / conversion | PREREQUISITE (persisted event store) |
| Aggregation = server Prisma/service | LOCKED |
| Persisted analytics tables | REJECTED (V1) |
| Privacy threshold n&lt;3 on breakdowns | LOCKED |
| PII / raw export | REJECTED / OUT OF SCOPE |
| UI route `/exco/analytics` | LOCKED (planning) |
| Export CSV/XLSX/PDF | OUT OF SCOPE |
| Matching / AI / marketplace / messaging | OUT OF SCOPE |
| Auth Site URL cutover | OUT OF SCOPE (separate gate; not this Phase 20) |
| Advisor SECURITY DEFINER remediation | DEFERRED (safe) |
| Schema expansion for needs/volunteers/mentors | DEFERRED — requires separate product authorization |
| Phase 21+ | NOT AUTHORIZED |

---

## 13. Metric / source matrix (summary)

| Area | Metric | Source field(s) | Population | Calc | Current/historical | Privacy | Authz | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Community | Professions | `professional_details.profession` | Members | group count | Current | n&lt;3 suppress | EXCO | LOCKED |
| Community | Industries | `industries.name` via `industry_id` | Members | group count | Current | n&lt;3 | EXCO | LOCKED |
| Community | Locations | `profiles.location` | Members | group count | Current | n&lt;3 | EXCO | LOCKED |
| Community | Businesses | `businesses` | Businesses | count (+status) | Current | OK | EXCO | LOCKED |
| Community | Employment status | `professional_situation` | Members | group count | Current | n&lt;3 | EXCO | LOCKED |
| Needs | Employment (Job seeker) | `professional_situation` | Members | count | Current | OK | EXCO | LOCKED |
| Needs | Clients | — | — | — | — | — | — | DEFERRED |
| Needs | Partnerships | `opportunity_preferences.collaboration` | Members | count true | Current | OK | EXCO | LOCKED (pref) |
| Needs | Mentorship | `opportunity_preferences.mentorship` | Members | count true | Current | OK | EXCO | LOCKED (pref) |
| Needs | Training | `opportunity_preferences.training` | Members | count true | Current | OK | EXCO | LOCKED (pref) |
| Capacity | Skills | `profile_skills`/`skills` | Members | group count | Current | n&lt;3 | EXCO | LOCKED |
| Capacity | Services | `profile_services`/`services` | Members | group count | Current | n&lt;3 | EXCO | LOCKED |
| Capacity | Mentors | — | — | — | — | — | — | DEFERRED |
| Capacity | Business owners | `relationship_type=OWNER` | Profiles | distinct count | Current | OK | EXCO | LOCKED |
| Capacity | Volunteers | — | — | — | — | — | — | DEFERRED |
| System | Registration conversion | events store | — | — | — | — | — | PREREQUISITE |
| System | Profile completion | Phase 8 % | Members | rate | Current | OK | EXCO | LOCKED |
| System | Verification rate (pro/biz) | status fields | Separate | rates | Current | OK | EXCO | LOCKED |
| System | Directory visibility | effective + preference separate | Profiles | counts | Current | OK | EXCO | LOCKED |
| System | New registrations | `users.created_at` + `profiles.legacy_import = false` | Non-legacy members | count | Window | OK | EXCO | LOCKED |
| System | Abandonment | events store | — | — | — | — | — | PREREQUISITE |

---

## 14. Implementation contract (future authorization only)

When separately authorized, implementation MUST:

1. Add **`/exco/analytics`** under EXCO shell; reuse `assertExcoDashboardAccess`.
2. Implement **read-only** server services computing LOCKED metrics; reuse Phase 8 completion and Phase 10 definitions where listed.
3. Return **aggregates only**; apply n&lt;3 suppression on breakdowns.
4. **No** Prisma migrations; **no** analytics tables unless a later decision reopens D.
5. **No** RLS changes for Phase 20 V1 if using privileged Prisma + domain authz (same as Phase 10) — document honestly if a future least-privilege SQL path is proposed.
6. UI: four sections; loading/empty/error; responsive; accessible EXCO patterns.
7. Tests: authz matrix; fixture metric correctness; privacy suppression; no Phase 13/18/19 regression; no mutations.
8. Docs update only after delivery evidence.

**Must not** during implementation authorization without new scope: invent fields; persist fake events; export PII; combine verification rates; call Auth Site URL cutover “Phase 20”.

---

## 15. Testing contract (future)

| Class | Requirement |
| --- | --- |
| Authorization | anon/member denied; EXCO allowed; forged metadata denied |
| Metric correctness | Fixture-based deterministic tests per LOCKED metric |
| Privacy | n&lt;3 suppression; no email/phone/docs/consent in payloads |
| Security | IDOR, filter bypass, injection, raw extraction, client aggregation |
| Regression | Phase 13 directory, Phase 18 rows, Phase 19 path, verification/publication/visibility unchanged |
| Performance | Acceptable on current Production scale (tens–hundreds of members); no warehouse |
| Browser/a11y/responsive | EXCO page standards |

---

## 16. Migration contract

```text
NO MIGRATION REQUIRED for Phase 20 V1 analytics
```

If event-based conversion/abandonment is later authorized:

```text
PREREQUISITE gate: define event store schema + RLS + non-PII properties + migration under supabase/migrations/
```

Do not execute here.

---

## 17. Deferred / Rejected / Out of scope

### Deferred

- Registration conversion & abandonment (event store prerequisite)
- Client needs / volunteer / mentor capacity (data model insufficient)
- Historical state reconstruction / warehouse
- Advisor SECURITY DEFINER cosmetic remediation
- Auth Site URL / production Auth cutover (misnamed “Phase 20” historically)

### Rejected / out of scope

- Matching, AI matching, recommendations, marketplace, messaging, reviews/ratings
- Public analytics
- Raw member/PII/document exports
- `/admin` / second admin system
- Combined professional+business “verified” rate
- Duplicate analytics source-of-truth tables
- Phase 21+

---

## 18. Dependencies & risks

| Item | Risk |
| --- | --- |
| Free-text location | Sparse groups; suppression essential |
| Preference vs publication confusion | Mitigated by separate metrics |
| Log-only registration analytics | Conversion/abandonment unavailable until store exists |
| Small N | High re-identification risk without suppression |
| Naming collision Auth “Phase 20” | Clarified above |

---

## 19. Open blockers for implementation

```text
NONE — implementation authorized and delivered 2026-09-11.
```

Conversion/abandonment remain deferred features inside Phase 20 scope — not blockers for delivering LOCKED metrics.

---

## 20. Production impact (this planning gate)

```text
Production changes: NONE
DML/DDL/Auth/RLS/deploy/analytics objects created: 0
```

---

## 21. HARD STOP (planning gate — superseded)

Planning gate closed 2026-09-11. Implementation was separately authorized the same day.

---

## 22. Implementation delivery (2026-09-11)

### What was implemented

| Item | Detail |
| --- | --- |
| Route | `/exco/analytics` under existing EXCO shell (`ProductExcoShell`) |
| Nav | EXCO Overview → Analytics; quick link from `/exco` |
| Authz | `assertExcoDashboardAccess` / `hasExcoDashboardAccess` (EXCO_VIEWER \| EXCO_ADMIN \| SUPER_ADMIN); page redirects anon → `/sign-in`, member → `/dashboard` |
| Aggregation | `computeExcoAnalytics` — read-only Prisma over profiles/businesses/users; no analytics tables; no migrations |
| Privacy | Composition breakdowns suppress groups with n &lt; 3 as `(suppressed)`; aggregates only (no names/emails/phones/IDs/storage keys in snapshot) |
| Filters | Allowlisted: situation, industry, verification, directory effective, registration days 7/30/90 |
| Completion | Phase 8 `calculateProfileCompletion` / `toCompletionInput` — not reimplemented |
| UI sections | Community · Needs · Capacity · System health + deferred/prerequisite unavailable cards |

### Metrics delivered (LOCKED)

Community: professions, industries, locations, situations, businesses total (+ status), unique-business semantics.  
Needs: Job seeker count; mentorship / training / collaboration / referrals interest prefs.  
Capacity: skills, services, OWNER business owners.  
System health: new registrations (window), Phase 8 completion rate, professional verification rate, business verification rate (separate), directory effective publication, identity preference counts (separate from publication).

### Metrics not delivered (contract)

| Metric | Treatment |
| --- | --- |
| Client needs | Deferred — shown as unavailable |
| Mentors / volunteers | Deferred — shown as unavailable (interest ≠ capacity) |
| Registration conversion / abandonment | Prerequisite — shown as unavailable |
| Combined verification rate | Rejected — not implemented |
| Historical state reconstruction | Deferred — not fabricated |
| CSV/export / public analytics / AI | Out of scope |

### Source modules

```text
src/features/exco/analytics/privacy.ts
src/features/exco/analytics/query.ts
src/features/exco/analytics/compute-analytics.ts
src/features/exco/analytics/load-analytics.ts
src/features/exco/analytics/filters-form.tsx
src/app/exco/analytics/page.tsx
```

### Tests

```text
src/features/exco/analytics/privacy.test.ts
src/features/exco/analytics/compute-analytics.test.ts
src/features/exco/analytics/load-analytics.test.ts
src/features/exco/analytics/payload-privacy.test.ts
src/features/exco/analytics/forensic-privacy.test.ts
e2e/phase-20-analytics-access.spec.ts
e2e/phase-20-exco-authenticated.spec.ts
playwright.phase20.config.ts  (port 3001 + AUTH_E2E_HELPER=1)
```

### Historical-registration decision (2026-09-13 closure — AUTHORIZED)

```text
Metric label: New platform registrations
Definition: COUNT users where
  users.deleted_at IS NULL
  AND users.created_at >= window_start (UTC inclusive days 7/30/90)
  AND linked profiles.deleted_at IS NULL
  AND profiles.legacy_import = false
```

| Item | Decision |
| --- | --- |
| Source | `users.created_at` + `profiles.legacy_import` |
| Inclusion | Genuine platform onboardings (non-legacy profiles) |
| Exclusion | `profiles.legacy_import = true` (Phase 18 historical import provenance) |
| Phase 18 members | Remain members; still counted in community/needs/capacity/health populations; **not** counted as “new platform registrations” |
| Invented dates | **None** — original Google Form timestamps are not reconstructed |
| Phase 10 dashboard | Unchanged (locked Phase 10); Phase 20 metric is the authoritative analytics definition |

### Known residual risks (accepted under locked privacy contract)

- Location free-text sparsity → relies on n&lt;3 composition suppression.
- Filtered **totals** and **needs counts** remain visible (contract: suppression applies to composition breakdowns only).
- Difference: population − visible group counts = suppressed mass (also shown as `(suppressed)`); keys stay hidden.
- Production authenticated EXCO UI not exercised in Production (Auth Site URL cutover remains a separate gate); local Playwright EXCO_VIEWER evidence PASS; Production anonymous boundary VERIFIED (307).

### Production impact (final — precise)

```text
Production application deployment: YES
  deployment: dpl_E9xX3ocs1eHYnMSpdv8WPwqtVjRZ
  host: tncod-professionals-e7w55qsaq-olanailedits-projects.vercel.app
  alias: https://tncod-professionals-azure.vercel.app
  commit: a1a6f2e01396bf115ce447907c5998ff5bad4685
Production database schema changes: NONE
Production data mutations: NONE
Production Auth changes: NONE
Production RLS changes: NONE
Production configuration changes: NONE (no Auth Site URL / Advisor changes)
```

### Validation evidence (forensic 2026-09-11 — historical)

See prior audit: premature LOCK withdrawn; Production `/exco/analytics` was then **404**; authenticated EXCO then **NOT VERIFIED**.

### Final closure evidence (2026-09-13)

| Gate | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint (Phase 20 paths) | PASS |
| Vitest analytics + directory | PASS — 27 tests |
| `next build` | PASS — `/exco/analytics` in route table |
| Playwright anonymous | PASS |
| Playwright authenticated EXCO (MEMBER deny + EXCO_VIEWER + filter URL) | PASS — `playwright.phase20.config.ts` |
| Production `/` | **200** |
| Production `/professionals` | **200** |
| Production `/exco/analytics` anonymous | **307** → `/sign-in?next=%2Fexco%2Fanalytics` (`X-Matched-Path: /exco/analytics`) |
| Production deploy ↔ Phase 20 commit | VERIFIED — GitHub Production deployment sha `a1a6f2e…` |
| Migrations / `directory_professionals()` | Unchanged |

---

## 23. Forensic verification verdict (2026-09-11) — historical

```text
PHASE 20 — NOT LOCKED (at that time)
Premature LOCK withdrawn.
```

---

## 24. Final closure verdict (2026-09-13)

```text
PHASE 20 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 21+ — NOT AUTHORIZED
HARD STOP
```
