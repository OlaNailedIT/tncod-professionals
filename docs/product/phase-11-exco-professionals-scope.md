# Phase 11 — EXCO professionals directory & record

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date:** 2026-09-08  
**Depends on:** Phase 10 PASS / COMPLETE / VERIFIED / LOCKED  
**UX anchors:** EXCO-02 / EXCO-03 (`docs/ux/screen-inventory.md`); routes already in Phase 1.x under `/exco` (never `/admin`)

---

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6–9 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 10 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 11 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 12 — ARCHITECTURE DECISION CLOSURE COMPLETE — CONDITIONAL PASS — PREREQUISITE IDENTIFIED (implementation not authorized)
PHASE 13 — ARCHITECTURE DECISION CLOSURE COMPLETE — CONDITIONAL PASS — PREREQUISITES IDENTIFIED (implementation not authorized)
PHASE 14+ — NOT AUTHORIZED
HARD STOP
```


---

## Objective

> Build a secure, searchable, filterable EXCO professional **lookup** surface and a coherent **single-page** professional record using existing domain data and permissions — without creating duplicate workflows, collapsing independent statuses, or exposing unnecessary private information.

Conceptually:

```text
PHASE 10  →  What needs attention?
PHASE 11  →  Find the relevant professional → Understand operational context
```

Phase 11 is **find + filter + understand**. It is **not** a second administration or CRM system.

---

## Locked routes (architecture)

**Canonical tree (extends Phase 10; does not reopen `/admin`):**

```text
/exco
├── businesses
├── businesses/[id]
├── professionals
└── professionals/[id]
```

| Route | Decision |
| --- | --- |
| `/exco/professionals` | **Locked** — EXCO-02 list / search / filter |
| `/exco/professionals/[id]` | **Locked** — EXCO-03 single-page professional record |
| `/admin` | **Rejected** (unchanged from Phase 10) |
| `/admin/professionals` | **Rejected** |
| `/exco/dashboard` | **Rejected** (unchanged) |
| Public `/professionals` | **Out of Phase 11** — public directory product remains a later phase |

Access: same as Phase 10 EXCO surfaces — `EXCO_VIEWER` / `EXCO_ADMIN` / `SUPER_ADMIN` via server role check. MEMBER denied (redirect per existing policy). Deep-link destinations must enforce their own authz.

---

## Phase nature (locked)

| In scope | Out of scope |
| --- | --- |
| Read-oriented list + detail | Profile editing by EXCO |
| Search, sort, filter, pagination | Bulk edit / bulk verify / bulk publish |
| Single-page structured record | Tab-heavy “management console” |
| Deep links to **existing** canonical surfaces | Inventing verification / publish / messaging / notes CRM in this phase |
| Role-aware field projections | Directory export |
| Reuse Phase 8 completion | SQL approximation of completion |
| Separate pro / biz / visibility states | Collapsed “Status” or combined “Verified” |

**Mutations** (verify, publish, edit, notes create, role changes) remain on separately authorized workflows — Phase 11 may **deep-link** to them when those surfaces already exist and the actor has permission. Phase 11 must not absorb those workflows.

---

## `/exco/professionals` — list surface

### Capabilities (locked)

- Search
- Sort
- Filter
- Pagination
- Row → `/exco/professionals/[id]`
- Preserve list query in URL (Phase 1 UX: filter preservation on back)

### Search (locked authoritative fields)

| Field | Source | Notes |
| --- | --- | --- |
| Display name | `profiles.display_name` | Primary |
| Profession | `professional_details.profession` | |
| Location | `profiles.location` | |
| Email | `users.email` | **EXCO_ADMIN / SUPER_ADMIN only** in results and search matching |

Do not search free-text bio as a primary key unless later authorized. Do not search document contents.

### Sort (locked)

| Sort key | Definition |
| --- | --- |
| `display_name` asc/desc | Default: asc |
| `created_at` asc/desc | `users.created_at` (registration time) |
| `updated_at` asc/desc | `profiles.updated_at` |
| `verification_status` | Canonical professional `verification_status` order — presentation labels only; sort uses enum |

### Filters — exact persisted definitions (locked)

**No generic filter labelled only “Status.”** Use domain-named filters.

| UI filter label | Exact definition | Not |
| --- | --- | --- |
| **Professional verification** | `profiles.verification_status` ∈ selected enum value(s) | Business verification; visibility |
| **Directory visibility** | `profiles.visibility_status` ∈ selected value(s) | Verification; completion |
| **Profile completion** | Result of Phase 8 `calculateProfileCompletion()` against loaded profile inputs | SQL % approximation |
| **Profession** | Exact / contains match on `professional_details.profession` | Industry |
| **Industry** | `professional_details.industry_id` (person industry catalogue) | Business industry alone |
| **Location** | Contains match on `profiles.location` | |
| **Business owner** | Exists `business_professionals` row for profile where `relationship_type = 'OWNER'` and business `deleted_at IS NULL` | DIRECTOR / PARTNER / EMPLOYEE / REPRESENTATIVE; “has any business link” |
| **Job seeker** | `profiles.professional_situation = 'Job seeker'` | Inference from looking_for, prefs, or free text |
| **Verified (professional)** | `profiles.verification_status = 'VERIFIED'` | Business APPROVED; directory DIRECTORY |

Optional convenience: **Business-affiliated** (any non-deleted `business_professionals` link) may be added later — **not** Phase 11 unless explicitly authorized. Phase 11 ships **Business owner = OWNER only**.

### Profile completion filter mechanics (locked)

- Authoritative function: `calculateProfileCompletion` / `toCompletionInput` (Phase 8).
- **Forbidden:** inventing a SQL formula that “mostly” matches %.
- Filter modes for V1 Phase 11 (locked):
  - `complete` → percent === 100
  - `incomplete` → percent < 100
  - (optional) numeric threshold only if implemented via the same function, not SQL
- Implementation must compute completion in the **domain/read-model layer**. Pagination strategy is an implementation detail of the authorized build phase; it must not silently change the definition.

### List row indicators (locked)

Show as **independent** badges/labels (never one merged status):

- Profile completion % (derived)
- Professional verification label
- Directory visibility label
- Job seeker flag when situation = Job seeker
- Business owner flag when OWNER link exists

---

## `/exco/professionals/[id]` — single-page record

### Presentation (locked)

- **One page**, sectioned hierarchy — not a tab farm.
- Progressive visual density per Phase 5 EXCO principles.
- Counts and states remain readable without colour-only meaning.

### Sections (locked content map)

#### 1. Identity and profile

| Field | Viewer | Admin / Super |
| --- | --- | --- |
| Display name | ✓ | ✓ |
| Headline / profession title (if persisted) | ✓ | ✓ |
| Location | ✓ | ✓ |
| Bio / professional summary | ✓ | ✓ |
| Profile image | Only if a **signed/authorized** view path exists; do not expose storage keys | Same |
| Email | ✗ | ✓ (`ExcoAdminProfessionalFields`) |
| Phone | ✗ | ✓ |

Align with `src/security/projections.ts` (`ExcoViewerProfessionalFields` / `ExcoAdminProfessionalFields`). Do not invent a looser Viewer projection.

#### 2. Professional information

Persisted Phase 6–8 data only:

- Profession, industry (person), years experience / experience presence
- Skills, services
- Organisation/workplace (continuity field — **not** industry)
- Professional situation
- LinkedIn / website URLs when present

#### 3. Opportunities

**Actual Phase 8 persisted data only** — no inferred labels:

- `looking_for_summary` / `offering_summary`
- `opportunity_preferences`: collaboration, mentorship, referrals, training (Yes / No / Not set)
- Job-seeking is shown via `professional_situation`, not as a fabricated “seeking employment” product object

#### 4. Profile health (compact)

Independent dimensions only:

- Completion % + incomplete section hints (from Phase 8 result)
- `profile_status`
- `verification_status` (professional)
- `visibility_status` (directory)
- Outstanding professional-verification attention when status ∈ `PENDING` | `UNDER_REVIEW`

Do not auto-open verification actions on this page in Phase 11.

#### 5. Business relationships

For each non-deleted association:

- Business name → deep link to `/exco/businesses/[id]` when actor may access EXCO business surfaces
- Relationship role (`OWNER` / …)
- **Business** verification label (`business_status`) — visually separate from professional verification
- Business visibility — separate

**Invariant:** Business APPROVED must never present the professional as professionally VERIFIED.

#### 6. Community information

- Authoritative `church_information.service_area` only
- **No** new department/service taxonomy in Phase 11
- **Locked (P11-OD-01):** EXCO_VIEWER **and** EXCO_ADMIN/SUPER_ADMIN may see `service_area` on the operational record (internal EXCO context). Update Viewer projection accordingly — do not invent a separate taxonomy.

#### 7. Verification context (professional only)

- Professional verification state
- Member-facing clarification message if present for professional domain
- Deep link to future/canonical professional verification workflow **when it exists** — do not invent `/exco/verification` product UI in Phase 11 unless separately authorized

Do not merge business verification documents (CAC) into this section.

#### 8. Audit / operational information

| Content | Phase 11 |
| --- | --- |
| Full audit log dump | **Out of scope** |
| Admin notes create/edit UI | **Out of scope** |
| Admin notes read | **Deferred** — requires `EXCO_ADMIN`+ and a later notes surface authorization |
| `audit.view` browse | **Out of scope** for this page |

Phase 11 must not become a notes/CRM inbox.

### Deep links from the record (locked)

Only to surfaces that already exist and enforce authz:

- `/exco/businesses/[id]` for associated businesses
- `/exco` (dashboard) optional breadcrumb
- `/exco/professionals` (back with query preserved)

Do **not** manufacture: messaging, publish controls, bulk tools, role editors, document galleries for professional CAC-equivalents that do not exist yet.

---

## Authorization & privacy (locked)

1. Route access = EXCO roles (same gate pattern as Phase 10).
2. Field access = projections + permission matrix (`professional.view` internal; contact fields Admin+).
3. MEMBER must not load list or detail by URL.
4. No client-trusted role / metadata.
5. Documents: Phase 11 record does **not** expose private member documents unless `document.review` and an existing signed-url path are explicitly in scope — **default OUT** for Phase 11 professional record (business docs stay on business EXCO pages).
6. Never return storage keys, credentials, service-role material, or consent raw history on this surface.

### EXCO_VIEWER vs EXCO_ADMIN data (locked baseline)

| Concern | Viewer | Admin / Super |
| --- | --- | --- |
| List + search (non-contact) | ✓ | ✓ |
| Email / phone | ✗ | ✓ |
| Verify / publish actions | ✗ (no Phase 11 mutations anyway) | ✗ in Phase 11 UI; deep-link later |
| Same section structure | ✓ | ✓ (with additional fields) |

---

## Architecture constraints (implementation phase, when authorized)

```text
Route → EXCO shell → Page → features/exco-professionals read model
      → domain services → Prisma/query
      → field projection by role
```

Forbidden:

- DB calls from presentational components
- Duplicate Phase 8 completion algorithm
- Client-side authorization as the only control
- Mutations from list/detail in Phase 11
- `/admin` routes

---

## Negative prompt (locked)

Do NOT:

- Create `/admin` or `/admin/professionals`
- Build public `/professionals` directory in this phase
- Add dashboard mutations or verification decision UI on the 360° page
- Combine professional + business verification
- Infer job-seeking
- Approximate completion in SQL
- Widen Viewer **contact** (email/phone) access beyond Admin+
- Add messaging, CRM notes, export, bulk ops, role management
- Introduce department taxonomy
- Start Phase 12+ implementation without architecture authorization

---

## Closed decisions (2026-09-08)

| ID | Decision |
| --- | --- |
| P11-OD-01 | EXCO_VIEWER **sees** `service_area` on detail |
| P11-OD-02 | Page size **25** (fixed; not user-configurable in Phase 11) |
| P11-OD-03 | Profession filter = **contains**, case-insensitive |
| P11-OD-04 | **No** raw storage / new public-media headshots — avatar fallback only |
| P11-OD-05 | **No** “business-affiliated” filter — **OWNER only** |

---

## Relation to Phase 10

Phase 10 deferred “Find a professional.” Phase 11 implements that surface under `/exco/professionals`. The Phase 10 dashboard may add a deep link **Find professionals** → `/exco/professionals` as part of Phase 11 (not a Phase 10 reopen).

---

## Forensic closeout evidence (2026-09-08)

| Gate | Result |
| --- | --- |
| Unit (`src/features/exco`) | PASS (9) |
| DB closeout (`scripts/phase11-db-closeout.ts`) | PASS (`PHASE11_DB_CLOSEOUT_PASS`) |
| Browser Phase 11 (`e2e/phase-11-closeout-evidence.spec.ts`) | PASS |
| Phase 8 regression | PASS |
| Phase 9 regression | PASS |
| Phase 10 regression | PASS |

Do not reopen Phase 11 for redesign. Phase 12/13 Decision Closures are under `docs/product/phase-12-verification-centre-scope.md` and `docs/product/phase-13-public-member-directory-scope.md` (both conditional — prerequisites). Implementation of Phase 12/13 remains unauthorized until explicitly authorized.
