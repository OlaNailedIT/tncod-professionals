# Phase 13 — Professionals Directory

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date locked:** 2026-09-09  
**Depends on:** Phase 12 PASS / COMPLETE / VERIFIED / LOCKED  
**Pass type:** Full gated delivery (implementation + projection + search/filter + routes + docs)  
**Product concept:** Professionals Directory  
**UX anchors:** PUB-02 `/professionals`, PUB-03 `/professionals/[slug]`

---

## Governance

```text
PHASE 5  — FORMALLY CLOSED
PHASE 6–12 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 13 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 14 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 15+ — NOT AUTHORIZED

HARD STOP
```

Architecture decisions below remain authoritative. Sections that previously said **IMPLEMENTATION NOT AUTHORIZED** are superseded by this lock. Phase 14 planning is closed; do not implement Phase 14 without explicit **IMPLEMENTATION AUTHORIZED**.
---

## 1. Purpose

> Build a controlled public/member-facing projection of verified, intentionally published professional information.

```text
Database
   ↓
Authorized projection (eligibility + allowlist)
   ↓
Directory query (search/filter/sort/page)
   ↓
Directory UI
```

**Not:**

```text
Database → raw profile object → hide fields in React
```

---

## 2. Non-goals — **LOCKED**

```text
❌ Raw database browser
❌ EXCO management / verification centre / publication controls
❌ Profile editor
❌ CRM / messaging / contact marketplace
❌ Job or opportunity marketplace
❌ People-search engine / SEO indexing by default
❌ Public business directory
❌ Automatic publication
❌ /directory as a second directory implementation
❌ /admin/**
❌ Bulk actions / exports
❌ Public documents / consent / phone / email
❌ Ratings, reviews, endorsements, follow/favourite, AI matching
❌ Client-side field hiding as the privacy boundary
❌ Inventing publishProfile / slug mint inside Phase 13
❌ Opportunistic Phase 12 implementation under Phase 13 cover
```

---

## 3. Route architecture — **LOCKED**

| Route | Role |
| --- | --- |
| `/professionals` | PUB-02 list / search / filter / sort / pagination |
| `/professionals/[slug]` | PUB-03 restrained public profile |

**Rejected as directory implementations:** `/directory`, `/admin`, `/admin/professionals`.

**Distinct trust boundaries (do not merge):**

```text
/professionals/[slug]     ≠  /profile  ≠  /profile/edit
                          ≠  /exco/professionals/[id]
```

`/directory` may only ever be a separately authorized redirect/alias to `/professionals`.

---

## 4. Eligibility rule — **LOCKED**

```text
profiles.verification_status = VERIFIED
AND
profiles.visibility_status = DIRECTORY
AND
profiles.deleted_at IS NULL
```

| Rule | Locked |
| --- | --- |
| Both conditions mandatory | Yes |
| May infer DIRECTORY from VERIFIED | **No** |
| May infer VERIFIED from DIRECTORY | **No** (also CHECK / `directoryListingAllowed`) |
| `VERIFIED` + `MEMBERS_ONLY` is valid | Yes — **not** directory-listed |
| Query params authorize eligibility | **No** |

### CODEBASE FACT vs ARCHITECTURAL INTENT

| Topic | CODEBASE FACT | INTENT |
| --- | --- | --- |
| Eligibility helper | `directoryListingAllowed` requires VERIFIED+DIRECTORY | Same — **LOCKED** |
| SQL gate | `app.directory_professionals()` same WHERE | Same — **LOCKED** |
| CHECK constraint | DIRECTORY requires VERIFIED (Phase 2) | Same — **LOCKED** |

---

## 5. Trust boundaries — **LOCKED**

```text
Professional verification  ≠  Business verification  ≠  Directory visibility  ≠  Profile completion
Professional publication   ≠  Business publication
Business relationship      ≠  Professional directory eligibility
```

- Phase 8 completion 100% must **not** auto-verify, auto-publish, mint slug, or list.
- Business `APPROVED` must **not** list the professional.
- Professional `VERIFIED` must **not** list associated businesses (business display deferred).

---

## 6. Forensic baseline (re-verified)

| Finding | Evidence |
| --- | --- |
| `app.directory_professionals()` exists | `supabase/policies/10-rls-policies.sql` — 6 columns; VERIFIED+DIRECTORY+not deleted |
| Narrow `PublicProfessional` | `src/security/projections.ts`: `publicSlug`, `displayName`, `headline`, `location`, `profession`, `professionalTitle` |
| No `/professionals` app routes | `src/app/professionals/**` — **0 files** |
| No `publishProfile` / `unpublishProfile` in `src/` | Grep — **no matches** |
| No app slug generator | Only seed sets `publicSlug` for DIRECTORY fixtures |
| `public_slug` column UNIQUE nullable | `prisma/schema.prisma` Profile |
| `professional.publish` on EXCO_ADMIN + SUPER_ADMIN | `ROLE_PERMISSION_KEYS` |
| No anon business directory | Business RLS: assoc / EXCO; no `directory_businesses` |
| Phase 12 intake/verify/publish incomplete | Phase 12 Decision Closure — conditional |
| Phase 8 must not touch verification/visibility | `own-profile.ts` / Phase 8 lock |
| Phase 11 EXCO ≠ public projection | Separate routes/projections |

---

## Decision matrix

| ID | Topic | Classification |
| --- | --- | --- |
| P13-01 | Publication ownership | 🟢 **LOCKED** |
| P13-02 | `publishProfile` capability | 🔴 **PREREQUISITE** |
| P13-03 | Anonymous public projection | 🟢 **LOCKED** |
| P13-04 | Member projection | 🟢 **LOCKED** |
| P13-05 | Business projection | 🔵 **DEFERRED** |
| P13-06 | Search mappings | 🟢 **LOCKED** |
| P13-07 | Slug lifecycle (contract) | 🟢 **LOCKED** |
| P13-07b | Slug mint implementation | 🔴 **PREREQUISITE** |
| P13-08 | Direct slug access | 🟢 **LOCKED** |
| P13-09 | Verified filter vs badge | 🟢 **LOCKED** |
| P13-10 | Phase 12 dependency | 🔴 **PREREQUISITE** |
| SEO | `noindex` | 🟢 **LOCKED** |
| Pagination | 25 / URL | 🟢 **LOCKED** |

---

# Decisions (full contract)

## P13-01 — Publication ownership

| | |
| --- | --- |
| **ID** | P13-01 |
| **Decision** | Transition into `visibility_status = DIRECTORY` is owned exclusively by the **Phase 12 publication foundation** (`publishProfile` domain command). Phase 13 must not invent a second publication authority or UI that sets DIRECTORY. |
| **Classification** | **LOCKED** |
| **Current evidence** | Permission `professional.publish` granted to EXCO_ADMIN + SUPER_ADMIN (`src/security/permissions.ts`). Contract in `docs/security/api-security-contract.md`. **No** `publishProfile` implementation in `src/`. Member cannot set DIRECTORY (privileged column + security architecture). |
| **Rationale** | One publication authority prevents Phase 13 from becoming a bypass around verification/visibility governance. |
| **Implementation implication** | Phase 13 may **read** DIRECTORY rows via projection only. Phase 13 must **not** call or create publish mutations. |
| **Dependency** | P13-02 / P13-10 |

### Publication blast radius — **LOCKED**

| May change | Must NOT change |
| --- | --- |
| `visibility_status` → `DIRECTORY` | `verification_status` |
| `publications` event + audit metadata | Profile completion / Phase 8 derivation |
| `public_slug` if null (mint) | Roles / privileges |
| | Business status / business visibility |
| | Clarification messages / verification notes |

Publication **requires** `VERIFIED`. Publication **must never** bypass verification. Publication **does not** change verification state.

---

## P13-02 — `publishProfile`

| | |
| --- | --- |
| **ID** | P13-02 |
| **Decision** | Exact authorized transitions and actors are locked below; **implementation is a Phase 12 prerequisite**, not Phase 13 work. |
| **Classification** | **PREREQUISITE** |
| **Current evidence** | Documented command only; no `src/` implementation; seed can force DIRECTORY under privileged paths. |
| **Rationale** | State enum exists without controlled transition → directory would rely on seeds/manual DB. |
| **Implementation implication** | Do not implement `publishProfile` under Phase 13 tickets. |
| **Dependency** | Phase 12 foundation authorization |

### Locked transition contract

**Publish** (permission `professional.publish`; EXCO_ADMIN / SUPER_ADMIN):

```text
verification_status = VERIFIED
AND visibility_status ∈ { PRIVATE, MEMBERS_ONLY }
AND deleted_at IS NULL
        ↓
publishProfile
        ↓
visibility_status = DIRECTORY
(+ mint public_slug if null; publications + audit)
```

Publication **from PRIVATE is permitted** when VERIFIED (member may be PRIVATE until EXCO publishes). Idempotent if already DIRECTORY.

**Unpublish** (same permission):

```text
VERIFIED + DIRECTORY
        ↓
unpublishProfile
        ↓
VERIFIED + MEMBERS_ONLY
```

Unpublish **MUST NOT:** revoke verification; delete profile; change completion; **delete slug**; alter roles; alter business verification; expose the record via other public surfaces.

`hideProfile` → PRIVATE remains **out of Phase 13** and is not required for directory V1.

Consent UI remains **DEFERRED** (Phase 12); do not invent a consent gate for publish in this closure.

---

## P13-03 — Public (anonymous) projection

| | |
| --- | --- |
| **ID** | P13-03 |
| **Decision** | Extend the existing authoritative `app.directory_professionals()` / `PublicProfessional` allowlist. Do **not** create parallel models (`public_professionals_v2`, etc.). V1 fields below. |
| **Classification** | **LOCKED** |
| **Current evidence** | Function returns 6 fields only; skills/services/industry not included; `NEVER_IN_PUBLIC_OR_DIRECTORY` lists email/phone/keys/notes/consent/audit/church. |
| **Rationale** | One projection authority; card/search need industry/skills/services without dumping private rows. |
| **Implementation implication** | When Phase 13 is later authorized, evolve the **same** function/projection (still SECURITY DEFINER + same eligibility WHERE). Never `SELECT *` to the browser. |
| **Dependency** | Projection SQL extension is Phase 13 technical work **only after** P13-10 prerequisites; until then document-only. |

### Anonymous allowlist (V1)

| Facet | Source | Transform | Privacy | Anon | Member | Searchable |
| --- | --- | --- | --- | --- | --- | --- |
| Public slug | `profiles.public_slug` | as stored (normalized) | Public if eligible | YES | YES | resolve key |
| Name | `profiles.display_name` | as stored | Public if eligible | YES | YES | YES |
| Headline | `profiles.headline` | as stored / omit if null | Public if eligible | YES | YES | NO (not a dedicated search dim) |
| Profession | `professional_details.profession` | as stored | Public if eligible | YES | YES | YES |
| Professional title | `professional_details.professional_title` | as stored / omit if null | Public if eligible | YES | YES | NO (display with profession) |
| Location | `profiles.location` | as stored / omit if null | Public if eligible | YES | YES | YES |
| Industry | `industries.name` via `professional_details.industry_id` | name only | Public if eligible | YES | YES | filter YES |
| Skills | `profile_skills` → `skills.name` (active catalogue) | name list | Public if eligible | YES | YES | YES |
| Services | `profile_services` → `services.name` (active catalogue) | name list | Public if eligible | YES | YES | YES |
| Verified badge | Derived from eligibility | presentation “Verified” | Trust mark only | YES | YES | NO as filter |

**Headline + professional title** retained because they are **already** in the shipped public SQL projection (CODEBASE FACT). Do not add long `bio` or `professional_summary` in V1.

### Explicitly excluded (V1)

email, phone, documents, consent, audit, internal user/profile UUIDs in public payloads (slug is the public id), roles, verification notes, clarification/rejection messages, EXCO notes, private bio, experiences dump, avatar storage keys, business affiliations.

Cards: restrained subset (name, profession/title, industry, location, skills/services subset, verified badge). PUB-03: same allowlist — still not a profile dump.

---

## P13-04 — Member projection

| | |
| --- | --- |
| **ID** | P13-04 |
| **Decision** | V1: **Anonymous projection = Member projection**. No additional fields because the user is logged in. |
| **Classification** | **LOCKED** |
| **Current evidence** | No authorized “directory member-extra” projection in product code. `MemberProfessionalFields` includes email/phone/status — that is for **own** profile, not public directory. RLS `MEMBERS_ONLY` peer SELECT is a **different** boundary, not Phase 13 directory membership. |
| **Rationale** | “Members can see more because logged in” is not a privacy rule. |
| **Implementation implication** | Same server projection for anon and authenticated directory requests. |
| **Dependency** | None beyond P13-03 |

| Field | Anonymous | Member |
| --- | ---: | ---: |
| Name, Profession, Industry, Skills, Services, Location, Headline, Title, Verified badge, Public slug | YES | YES |
| Phone, Email, Documents, Consent, Audit, Internal IDs, Private business relationship | NO | NO |

---

## P13-05 — Business projection

| | |
| --- | --- |
| **ID** | P13-05 |
| **Decision** | Business search and business display on the Professionals Directory are **out of Phase 13 V1**. No `JOIN businesses` for anon/member directory. |
| **Classification** | **DEFERRED** |
| **Current evidence** | No anon business projection; business RLS has no DIRECTORY public path; Phase 11 OWNER semantics are EXCO-only. |
| **Rationale** | Relationship ≠ public affiliation; APPROVED ≠ public business. |
| **Implementation implication** | Omit business from cards, detail, and search. |
| **Dependency** | Future phase must define business public eligibility + projection + relationship visibility + search — not invented here. |

---

## P13-06 — Search field mappings

| | |
| --- | --- |
| **ID** | P13-06 |
| **Decision** | Search/filter only allowlisted projection sources below. Case-insensitive matching. Business deferred. |
| **Classification** | **LOCKED** |
| **Current evidence** | Skills/services/industry not in current SQL projection — extension required at impl time (after prerequisites). |
| **Rationale** | Search must not bypass projection / leak private text. |
| **Implementation implication** | Directory query layer searches projection outputs (or equivalent server joins that only return eligible rows + allowlisted columns). |
| **Dependency** | P13-03 extension |

| Dimension | Source | Match (V1) |
| --- | --- | --- |
| Name | `display_name` | case-insensitive contains |
| Profession | `profession` | case-insensitive contains |
| Skill | skill **names** on eligible profile | case-insensitive contains / filter |
| Service | service **names** on eligible profile | case-insensitive contains / filter |
| Location | `location` | case-insensitive contains / filter |
| Industry | `industries.name` | filter (exact or CI) |
| Business | — | **DEFERRED** |

**Must not search:** private bio, notes, email, phone, audit, consent, clarification/rejection, internal metadata, arbitrary JSON.

**Pagination — LOCKED:** 25 results/page; URL-controlled page + filter/sort state.  
**Default sort — LOCKED:** `display_name` ascending.

---

## P13-07 — Public slug lifecycle

| | |
| --- | --- |
| **ID** | P13-07 |
| **Decision** | Lifecycle contract locked below. Mint/generator **does not exist** in app code → implementation mechanism is **PREREQUISITE** (with `publishProfile`). |
| **Classification** | Contract **LOCKED**; mint mechanism **PREREQUISITE** |
| **Current evidence** | `public_slug` UNIQUE nullable; no generator in `src/`; seed-only for fixtures. |
| **Rationale** | Route is `[slug]`; UUID public URLs rejected by Phase 1; must not mint at registration. |
| **Implementation implication** | Phase 13 must not invent ad-hoc slug writers; mint happens inside Phase 12 `publishProfile`. |
| **Dependency** | P13-02 |

### Lifecycle rules — **LOCKED**

| Topic | Rule |
| --- | --- |
| Creation | On successful **publish** into DIRECTORY if slug null — **not** at registration / complete / verify alone |
| Normalization | lowercase; trim; whitespace → `-`; strip unsupported chars; collapse repeated `-`; reject empty; avoid reserved words (`new`, `search`, `api`, `exco`, `admin`, `professionals`, …) |
| Collision | Deterministic: `john-doe`, `john-doe-2`, `john-doe-3`, … — not random opaques as normal form |
| Stability | Once minted, **stable**; preferred-name change does **not** regenerate |
| Unpublish | Profile unavailable via slug; **do not delete** slug; do not redirect to private/member/EXCO record; no existence leak |
| Republish | **Reuse** existing slug |
| Enumeration | Guessed slug → same unavailable as unknown |

---

## P13-08 — Direct slug access

| | |
| --- | --- |
| **ID** | P13-08 |
| **Decision** | Every `GET /professionals/[slug]` enforces VERIFIED+DIRECTORY server-side; ineligible → privacy-safe unavailable; consume public projection only. |
| **Classification** | **LOCKED** |
| **Current evidence** | Contract in api-security-contract; no route yet. |
| **Rationale** | Known slug ≠ authorization. |
| **Implementation implication** | No CSS-hide, no client filter of private props, no status leak, no EXCO/member redirect. |
| **Dependency** | P13-03, P13-07 |

---

## P13-09 — Verified filter

| | |
| --- | --- |
| **ID** | P13-09 |
| **Decision** | Verified **badge** = YES. Verified **filter** = NO in V1. |
| **Classification** | **LOCKED** |
| **Current evidence** | Eligibility already requires VERIFIED. |
| **Rationale** | Filter would be a no-op / confusing UX. |
| **Implementation implication** | Do not add `?verified=` as an eligibility toggle. |
| **Dependency** | None |

---

## P13-10 — Phase 12 dependency

| | |
| --- | --- |
| **ID** | P13-10 |
| **Decision** | Phase 13 implementation remains **blocked** until the dependency chain below exists as product workflow (not seed-only). Phase 13 must not implement these opportunistically. |
| **Classification** | **PREREQUISITE** |
| **Current evidence** | Phase 12 Decision Closure conditional; no submit/verify/publish app commands for professionals. |
| **Rationale** | Without operational population, `/professionals` has no trustworthy content. |
| **Implementation implication** | HARD STOP on Phase 13 coding until human implementation authorization **after** Phase 12 foundations. |
| **Dependency** | Phase 12 |

```text
PHASE 12 SLICE A
  Professional intake/submission + clarification_message
        ↓
Professional verification workflow → VERIFIED
        ↓
Authorized publishProfile (+ unpublishProfile)
        ↓
DIRECTORY visibility + stable public_slug
        ↓
PHASE 13 Professionals Directory
  (extend projection → /professionals → /professionals/[slug])
```

**Minimum Phase 12 must provide before Phase 13 impl auth:**

1. Real professional submission lifecycle  
2. Persisted professional clarification/rejection reason  
3. Professional verification actions  
4. Authorized publication capability  
5. Controlled transition into `DIRECTORY`  
6. Server-side enforcement of publication rules  
7. Slug mint on publish  

**Not required for Phase 13 gate:** consent UI (DEFERRED); submission snapshots (DEFERRED — live record remains Phase 12 evidence model).

---

## SEO policy — **LOCKED**

```text
/professionals
/professionals/[slug]
→ noindex (V1)
```

No sitemaps, structured indexing strategy, or search-engine discovery expansion without separate authorization.

---

## UX scope (when later authorized) — **LOCKED**

**In:**

- `/professionals`: search; profession / industry / location / service filters; sort; pagination 25; restrained cards; verified badge  
- `/professionals/[slug]`: restrained public profile  

**Out:** business filter/display; messaging; ratings; EXCO/verify/publish controls; profile edit; bulk; exports; public documents; etc. (see Non-goals).

---

## Privacy principle — **LOCKED**

> The directory is a controlled projection, not a permissioned view of the underlying profile record.

Client-side field hiding is **not** an acceptable privacy boundary.

---

## Deferred items

| Item | Notes |
| --- | --- |
| Business search/display | P13-05 |
| Consent UI / publish consent gate | Phase 12 deferred |
| Submission snapshots | Phase 12 deferred |
| Member-extra directory fields | Not in V1 |
| Avatar/headshot short-lived URLs | Deferred until upload UX; initials fallback only |
| Search-engine indexing | Default noindex until explicit yes |
| `/directory` redirect alias | Separate authorization |
| `hideProfile` | Not required for directory V1 |
| Publish UI placement (EXCO-07 vs record) | Phase 12 implementation design — not Phase 13 |

---

## Prerequisites (satisfied — Phase 12 foundation)

1. Phase 12 Slice A — `submitProfile` + `profiles.clarification_message` — **done**  
2. Phase 12 professional verification actions to `VERIFIED` — **done**  
3. `publishProfile` / `unpublishProfile` with `professional.publish` — **done**  
4. Controlled `DIRECTORY` transition + publication audit/`publications` — **done**  
5. `public_slug` mint on publish (stable lifecycle) — **done**  
6. Human **Phase 13 IMPLEMENTATION AUTHORIZED** — **done**  

---

## Adversarial audit (conceptual) — **PASS against locked rules**

| Case | Scenario | Expected | Result |
| --- | --- | --- | --- |
| A | VERIFIED + MEMBERS_ONLY | Not exposed | PASS |
| B | Not VERIFIED + DIRECTORY | Not exposed (invalid / blocked) | PASS |
| C | VERIFIED + DIRECTORY | Exposed via projection | PASS |
| D | Known private slug | Unavailable; no existence leak | PASS |
| E | Business APPROVED; professional not VERIFIED | Professional not listed | PASS |
| F | Professional VERIFIED; business private | No business info (deferred/omit) | PASS |
| G | Name change after publish | Slug stable | PASS |
| H | Duplicate names | `name`, `name-2`, … | PASS |
| I | Member seeks private fields | No delta vs anon | PASS |
| J | URL param bypass | Server eligibility still enforced | PASS |
| K | Search private bio/notes | Not search sources | PASS |
| L | Phase 13 tries to publish | Forbidden — Phase 12 ownership | PASS |

---

## Implementation closeout

### Delivered surface

| Item | Disposition |
| --- | --- |
| Routes | `/professionals`, `/professionals/[slug]` only; **`noindex`** |
| Eligibility | Server-side **`VERIFIED` + `DIRECTORY`** only |
| Projection fields | `publicSlug`, `displayName`, `headline`, `location`, `profession`, `professionalTitle`, `industryName`, `skillNames`, `serviceNames`, `verifiedBadge` |
| Excluded | email, phone, documents, consent, bio, business, opportunities, and other non-allowlisted fields |
| Search / filters | `q` across name / profession / skill / service / location; filters profession / industry / location / service; page size **25**; URL state |
| Slug | Phase 12 publish foundation; unpublished / ineligible slug → not found |
| Migration | `20260909080000_phase13_directory_projection.sql` extends `app.directory_professionals()` |
| Services | `src/features/directory/*` |
| Anon vs member (V1) | Same projection — anon = member for directory fields |
| Verified badge | Display only — **not** a filter |

### Deferred (not Phase 13)

| Item | Notes |
| --- | --- |
| Business directory / business cards | Deferred |
| Phase 14 consent / visibility centre | Not authorized |
| Search-engine indexing | Default **`noindex`** until explicit yes |
| Contact / messaging | Out of scope |
| Avatar/headshot short-lived URLs | Deferred until upload UX; initials fallback only |

### Evidence (closeout — 2026-09-09)

| Gate | Result | Classification |
| --- | --- | --- |
| TypeScript (`tsc --noEmit`) | PASS | DIRECTLY TESTED |
| ESLint | PASS | DIRECTLY TESTED |
| `next build` | PASS (`/professionals`, `/professionals/[slug]` in route table) | DIRECTLY TESTED |
| Vitest | **103** passed | DIRECTLY TESTED |
| Phase 13 DB closeout | PASS (`scripts/phase13-db-closeout.ts`) | DIRECTLY TESTED |
| Phase 9 / 11 DB regression | PASS | DIRECTLY TESTED |
| Phase 12 DB closeout | PASS (with `register-server-only`) | DIRECTLY TESTED |
| Playwright Phase 13 | PASS (`e2e/phase-13-closeout-evidence.spec.ts`) | DIRECTLY TESTED |
| Production | **NONE** | N/A |

### Critical adversarial / security proof (honest layers)

| Scenario | Layer | Outcome |
| --- | --- | --- |
| Not `VERIFIED` + `DIRECTORY` → not listed / not found | Server list + SQL projection | PASS |
| `VERIFIED` + `MEMBERS_ONLY` → not listed / not found | Boundary + Playwright | PASS |
| `VERIFIED` + `DIRECTORY` → listed + detail by slug | Boundary + Playwright | PASS |
| Random / unpublished slug → privacy-safe unavailable | Playwright + boundary | PASS |
| Private fields (email/phone/id) absent from projection | `assertPublicProfessionalShape` + boundary | PASS |
| Anon vs MEMBER same V1 field set | Same list/getBySlug services | PASS (architecture) |
| Search case-insensitive; unpublished not revealed | Boundary | PASS |
| Search does not hit private bio/notes | Allowlisted query sources only | PASS (code review) |
| Phase 13 does not publish | No publish mutations in directory feature | PASS (code review) |

### Browser evidence (Playwright)

- Anon → `/professionals` list (eligible only; hidden MEMBERS_ONLY absent)
- Detail `/professionals/[slug]` for published eligible profile (no email)
- Ineligible / unpublished / random slug → Professional unavailable
- Search Apply + URL `q`
- Responsive 320–1280; search keyboard focus
- `/directory` is not a second directory product

### P0 / P1 / P2

```text
P0 = 0
P1 = 0
P2 = 0
```

---

## Current state

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6–12 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 13 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 14 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 15+ — NOT AUTHORIZED

HARD STOP
```
