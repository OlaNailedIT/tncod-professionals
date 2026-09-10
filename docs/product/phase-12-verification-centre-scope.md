# Phase 12 — EXCO Verification Centre

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Date locked:** 2026-09-08  
**Evidence remediation closeout:** 2026-09-09  
**Depends on:** Phase 11 PASS / COMPLETE / VERIFIED / LOCKED  
**Pass type:** Full gated delivery (implementation + DB + security + Playwright + docs) + evidence remediation  
**UX anchors:** EXCO-06 (queue); decisions on EXCO-03 / EXCO-05 (`docs/ux/`)

---

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6–11 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 12 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 13 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 14 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 15+ — NOT AUTHORIZED

HARD STOP
```

Architecture decisions below remain authoritative. The sections that previously said **IMPLEMENTATION NOT AUTHORIZED** are superseded by this lock. Phase 13 is locked. Phase 14 planning is closed; implementation not authorized.
---

## Decision matrix (authoritative)

| ID | Topic | Disposition | Notes |
| --- | --- | --- | --- |
| P12-PRO-01 | Professional submission / intake | **IMPLEMENTED** | Member `submitProfile`; Phase 8 completion 100% → `SUBMITTED` + `PENDING` |
| P12-PRO-02 | Professional clarification/rejection reason | **IMPLEMENTED** | `profiles.clarification_message` |
| P12-CONSENT-01 | Consent in verification UI | **DEFERRED** | Schema exists; zero app writes — no fabricated consent UI |
| P12-SNAP-01 | Live vs snapshot evidence | **LOCKED** (live) / snapshot **DEFERRED** | Live record + honest limitation; no fake snapshot |
| P12-START / resubmit | Start review + resubmission | **IMPLEMENTED** | Domain-specific tables below |
| Queue projection | Tab ↔ canonical states | **IMPLEMENTED** | §Queue |
| P12-PERM-01 | EXCO_VIEWER docs/consent | **LOCKED** | Preserve Phase 3 denial |
| Blast radius | Cross-domain isolation | **LOCKED** / evidenced | §Blast radius |
| Routes | `/exco/verification` | **IMPLEMENTED** | No `/admin`; no `/exco/verification/[id]` |
| Domains | One queue, two machines | **IMPLEMENTED** | Professional + Business badges |
| Unpublish semantics | Visibility only | **IMPLEMENTED** | `DIRECTORY` → `MEMBERS_ONLY` |
| Unpublish MVP scope | Professional yes / business later | **IMPLEMENTED** / business **DEFERRED** | |
| Publication foundation | `publishProfile` + slug | **IMPLEMENTED** | No Phase 13 directory product |
| Verification timeline UI | Ops timeline ≠ audit dump | **IMPLEMENTED** | |
| Default queue landing | Attention union | **IMPLEMENTED** | Pending ∪ Under review |
| Phase 8 completion | Unchanged | **LOCKED** | Informational; never auto-verify/publish |
| Phase 9 business transitions | Reuse | **LOCKED** | No fork |

---

## Key principles — **LOCKED**

> **The verification centre is a controlled decision interface over existing verification, document, consent, profile, business, visibility, and audit domains. It must not create parallel versions of those domains.**

> **No Phase 12 action may modify a domain outside its authorized responsibility.**

> Queue filters are **UI projections**, not new database states.

---

## What Phase 12 is

```text
PHASE 10  →  What needs attention?     (read metrics)
PHASE 11  →  Find + understand         (read directory/record)
PHASE 12  →  Review + decide + record  (privileged transitions)
```

**Ordered delivery (when implementation is later authorized):**

| Slice | Content | Gate |
| --- | --- | --- |
| **A — Prerequisite** | Member `submitProfile` + `profiles.clarification_message` + professional verification_records/audit writes on EXCO actions once centre follows | Must complete (or be co-authorized and land first) before professional Verify/Clarify/Reject UI |
| **B — Verification centre** | `/exco/verification` queue; professional + business deep links; EXCO actions on records; professional unpublish; timeline UI; document access for Admin+ | Business actions already exist; professional actions require Slice A |

Do **not** ship professional Start review / Verify / Clarify / Reject controls that imply a complete lifecycle while Slice A is absent.

---

## Canonical routes — **LOCKED**

```text
/exco/verification
        ↓
Professional → /exco/professionals/[id]
Business     → /exco/businesses/[id]
```

**Rejected:** `/admin/*`, `/exco/verification/[id]`, per-filter path proliferation.

**Return navigation:** After verify/reject → queue (preserve filters when practical). After clarification → remain on record. After unpublish → remain on record.

---

## Domains — **LOCKED**

One operational queue; separate state machines; every row shows **Professional** or **Business**.

| Domain | Canonical field | “Verified” UI maps to |
| --- | --- | --- |
| Professional | `profiles.verification_status` | `VERIFIED` |
| Business | `businesses.business_status` | `APPROVED` (DB unchanged) |

---

## Cross-domain blast radius — **LOCKED**

| Action | May change | Must NOT automatically change |
| --- | --- | --- |
| Verify / clarify / reject **professional** | That profile’s verification state; `clarification_message`; `verification_records`; audit | Phase 8 completion derivation; business verification; visibility; roles/privileges |
| Verify / clarify / reject / start_review **business** | That business’s `business_status`; `clarification_message`; `verification_records`; audit | Linked professionals’ verification/visibility; publication; roles |
| **Unpublish** (professional) | `visibility_status` `DIRECTORY` → `MEMBERS_ONLY`; `publications`; audit | `verification_status`; completion; business state; roles |
| **submitProfile** (member) | `profile_status` → `SUBMITTED`; `verification_status` → `PENDING`; audit / verification timeline event | Visibility; business; roles; completion algorithm |

---

# Decision closures

## P12-PRO-01 — Professional submission — **PREREQUISITE**

### How a professional enters verification — **LOCKED** (lifecycle)

```text
Phase 8 profile editing (completion % informational only)
        ↓
Member invokes submitProfile (domain command)
        ↓
profile_status = SUBMITTED
verification_status = PENDING
        ↓
EXCO start_review → UNDER_REVIEW
        ↓
   VERIFIED | NEEDS_CLARIFICATION | REJECTED
```

**Authoritative intake:** member-initiated `submitProfile` only.  
**Forbidden as primary path:** EXCO forcing `NOT_REVIEWED → PENDING` or `NOT_REVIEWED → UNDER_REVIEW` to populate the queue.

### Reconciliation with Phase 8 — **LOCKED**

| Fact | Implication |
| --- | --- |
| Phase 8 `calculateProfileCompletion` is derived and informational | Must **not** auto-set verification, visibility, or submit |
| Phase 8 edit paths must not touch `verification_status` / DIRECTORY | Unchanged |
| `profile_status` today is largely stuck at registration defaults in app code | `submitProfile` is the command that advances lifecycle into review |
| Completion gate for submit | Server requires `calculateProfileCompletion(...).percent === 100` using the **same** Phase 8 function (no parallel completeness rule) |
| On successful submit | Set `profile_status = SUBMITTED` and `verification_status = PENDING` in one transaction |
| Prior `profile_status` | May be `REGISTERED` / `INCOMPLETE` / `COMPLETE`; submit does **not** require a separate prior COMPLETE command — eligibility is the Phase 8 percent gate, then atomic `SUBMITTED` |
| Resubmit after clarify/reject | Allowed from `verification_status ∈ {NEEDS_CLARIFICATION, REJECTED}` when completion still 100%; sets `PENDING` again and `profile_status = SUBMITTED` |
| Does not change | `visibility_status`, business rows, roles |

### Ownership — **PREREQUISITE** (not silently deferred forever)

| Choice | Decision |
| --- | --- |
| Is submission “just EXCO UI”? | **No** |
| Separate Phase 13 product? | **No** — intake is part of the professional verification lifecycle required for Phase 12 |
| Deferred indefinitely / business-only centre forever? | **No** as the end state |
| Concrete ownership | **Phase 12 Slice A (prerequisite)** — must be explicitly authorized and delivered **before** professional EXCO decision actions (Slice B professional mutations) |

Until Slice A exists, `/exco/verification` may still list **business** work and deep-link professionals for **read** context, but must not present professional decision controls that cannot be reached through a real intake path.

---

## P12-PRO-02 — Professional reasons — **PREREQUISITE**

### Persistence — **LOCKED** (shape)

| Concern | Store |
| --- | --- |
| **Current** member-facing clarification or rejection reason | `profiles.clarification_message` (nullable text) — **additive column**, parity with `businesses.clarification_message` |
| **Historical** event | `verification_records` (decision, notes, actor, timestamps) + `audit_logs` |

**Semantics:**

- Request clarification → `verification_status = NEEDS_CLARIFICATION` + set `clarification_message` (mandatory non-empty) + append verification_record + audit
- Reject → `verification_status = REJECTED` + set `clarification_message` (mandatory) + append record + audit
- Verify → `verification_status = VERIFIED` + clear `clarification_message` to null + append record + audit
- Member submit/resubmit → does not invent EXCO reasons; may leave prior message visible until EXCO overwrites/clears

**Forbidden:** audit-only or JSON-only current reason; `admin_notes` as member-facing reason.

**Schema/migration:** Documented now; **no migration until implementation authorization**. Slice A includes this additive field.

---

## P12-CONSENT-01 — Consent — **DEFERRED**

### Forensic reconciliation

| Item | Finding |
| --- | --- |
| Schema | `consents` with `consent_type`, `version`, `granted`, `granted_at`, `withdrawn_at` |
| Types | `DATA_PROCESSING`, `DIRECTORY_VISIBILITY`, `COMMUNICATION` |
| Application writes | **None** in `src/` (registration/profile do not create rows) |
| Trustworthy reviewer evidence | **Absent** |

### Decision — **DEFERRED**

- Phase 12 verification UI **omits** a Consent / Consent History section.
- Do **not** show “no records” theater that implies a consent subsystem is operational if that would mislead reviewers.
- Do **not** fabricate grants, versions, or timestamps.
- Consent capture (if required later) is a **separate deliberate authorization**, not sneaked into Phase 12.
- Phase 3: EXCO_VIEWER still has no consent access; irrelevant while deferred.

Withdrawal → unpublish rules in `docs/data/consent.md` remain future enforcement when writes exist; they do not unlock a Phase 12 consent panel.

---

## P12-SNAP-01 — Verification evidence — **LOCKED** (live) / snapshot **DEFERRED**

| Decision | Status |
| --- | --- |
| Phase 12 reviewers operate on the **live** professional/business record | **LOCKED** |
| Full submission snapshot / versioning system | **DEFERRED** (future; not Phase 12) |
| Pretend audit logs or timestamps are a snapshot | **FORBIDDEN** |

**Honest limitation (required product copy when UI ships):** decisions are made against the **current** record at decision time; Phase 12 does not freeze a submission payload. Future snapshot work would be a new architecture authorization.

---

## Start review / resubmission — **LOCKED**

### Clarification vs rejection semantics — **LOCKED**

| Action | Meaning |
| --- | --- |
| Clarification | Process **not finished**; member must supply additional/corrected information |
| Rejection | Verification request **declined** |

Both require mandatory member-facing reasons (professional: `profiles.clarification_message`; business: existing field).

### Professional — legal transitions — **LOCKED**

#### Member (`submitProfile`) — Slice A

| From `verification_status` | Action | To | Also |
| --- | --- | --- | --- |
| `NOT_REVIEWED` | submit (completion 100%) | `PENDING` | `profile_status = SUBMITTED` |
| `NEEDS_CLARIFICATION` | resubmit (completion 100%) | `PENDING` | `profile_status = SUBMITTED` |
| `REJECTED` | resubmit (completion 100%) | `PENDING` | `profile_status = SUBMITTED` |
| `PENDING` / `UNDER_REVIEW` / `VERIFIED` | submit | **denied** | — |

Member never sets verification columns except via this domain command. Member never sets DIRECTORY.

#### EXCO (`professional.verify`) — Slice B after A

| From | Action | To | Reason | Notes |
| --- | --- | --- | --- | --- |
| `PENDING` | `start_review` | `UNDER_REVIEW` | No | **Required** before terminal decisions |
| `UNDER_REVIEW` | `start_review` | `UNDER_REVIEW` | No | Idempotent allowed |
| `UNDER_REVIEW` | `verify` | `VERIFIED` | Confirm dialog | Clears `clarification_message` |
| `UNDER_REVIEW` | `request_clarification` | `NEEDS_CLARIFICATION` | **Mandatory** | |
| `UNDER_REVIEW` | `reject` | `REJECTED` | **Mandatory** | |
| `PENDING` | verify / clarify / reject | **denied** | — | Must start review first |
| `NOT_REVIEWED` | any EXCO verification action | **denied** | — | No EXCO intake bypass |
| `VERIFIED` | verify / clarify / reject / start_review | **denied** | — | Read revisit only |

#### EXCO (`professional.publish`) — unpublish

| From visibility | Action | To | Verification |
| --- | --- | --- | --- |
| `DIRECTORY` | `unpublishProfile` | `MEMBERS_ONLY` | **Unchanged** (may remain `VERIFIED`) |

`hideProfile` → `PRIVATE` is **out of Phase 12 MVP** (deferred).

**Resubmission after clarify/reject:** **Yes** — member `submitProfile` returns professional to `PENDING` (see table). EXCO does not “undo” history; new review cycle appends records.

**Does `UNDER_REVIEW` require explicit EXCO action?** **Yes** for professionals — `start_review` from `PENDING`.

---

### Business — legal transitions — **LOCKED** (Phase 9 reuse)

#### Member

| From `business_status` | Action | To |
| --- | --- | --- |
| `DRAFT` \| `NEEDS_CLARIFICATION` \| `REJECTED` | submit/resubmit | `SUBMITTED` |

#### EXCO (`business.verify`) — existing `allowedExcoTransitions`

| From | Action | To | Reason |
| --- | --- | --- | --- |
| `SUBMITTED` \| `PENDING_REVIEW` | `start_review` | `PENDING_REVIEW` | Optional |
| `SUBMITTED` \| `PENDING_REVIEW` | `approve` | `APPROVED` | Optional |
| `SUBMITTED` \| `PENDING_REVIEW` | `request_clarification` | `NEEDS_CLARIFICATION` | **Mandatory** |
| `SUBMITTED` \| `PENDING_REVIEW` | `reject` | `REJECTED` | **Mandatory** |

**Does `PENDING_REVIEW` require explicit start_review before approve/reject?** **No** for business — Phase 9 allows terminal decisions from `SUBMITTED`. Asymmetry with professional is **intentional and documented**, not a bug to “fix” in Phase 12.

**Resubmission after clarify/reject:** **Yes** — member submit → `SUBMITTED`.

**SUSPENDED:** out of Phase 12 action set (deferred).

---

### Asymmetry summary — **LOCKED**

| Rule | Professional | Business |
| --- | --- | --- |
| Explicit start review before terminal decision | **Required** (`UNDER_REVIEW`) | **Not required** |
| Member resubmit after clarify/reject | → `PENDING` | → `SUBMITTED` |
| EXCO may invent intake from draft/not reviewed | **No** | **No** (member submit only) |

---

## Queue projection — **LOCKED**

UI tabs are projections only:

| Queue view | Professional | Business |
| --- | --- | --- |
| Pending | `PENDING` | `SUBMITTED` |
| Under review | `UNDER_REVIEW` | `PENDING_REVIEW` |
| Needs clarification | `NEEDS_CLARIFICATION` | `NEEDS_CLARIFICATION` |
| Verified | `VERIFIED` | `APPROVED` |
| Rejected | `REJECTED` | `REJECTED` |

**Default landing — LOCKED:** attention union = Pending ∪ Under review (both domains). Explicit tabs remain available.

**Excluded from default tabs:** `NOT_REVIEWED`, `DRAFT`, `SUSPENDED`.

---

## Permissions — **LOCKED** (Phase 3 preserved)

| Capability | EXCO_VIEWER | EXCO_ADMIN | SUPER_ADMIN |
| --- | --- | --- | --- |
| View queue + ops fields + verification state | ✅ | ✅ | ✅ |
| View operational verification timeline | ✅ | ✅ | ✅ |
| View private documents | ❌ | ✅ | ✅ |
| View consent records | ❌ | ✅* | ✅* |
| Start review / Verify / Clarify / Reject | ❌ | ✅ | ✅ |
| Unpublish | ❌ | ✅ | ✅ |
| Edit/delete audit | ❌ | ❌ | ❌ |

\*Consent **UI deferred** in Phase 12 even for Admin — no trustworthy rows. Permission matrix unchanged; do not weaken Viewer.

No Phase 3 security amendment for Phase 12 convenience.

Server enforces every mutation (`professional.verify` / `business.verify` / `professional.publish` / `document.review`). Route gate remains EXCO roles (Phase 10/11 pattern).

---

## Documents — reconciliation — **LOCKED**

Reuse Phase 9: private `member-documents`, server path, short-lived signed URL after `document.review`. Knowing an ID is insufficient. Viewer denied. Professional document gallery only for Admin+ when centre ships — no new storage architecture.

---

## Audit / timeline — **LOCKED**

| Layer | Role |
| --- | --- |
| `verification_records` (+ `publications` for unpublish) | Operational verification timeline in EXCO UI |
| `audit_logs` | Technical append-only trail; not the primary reviewer dump |
| `admin_notes` | Internal only; never member-facing reasons |

Timeline events (when commands exist): submitted, review started, clarification requested (+ reason), resubmitted, verified/approved, rejected (+ reason), unpublished.

---

## Unpublish — **LOCKED** semantics / MVP scope

```text
DIRECTORY → MEMBERS_ONLY
verification unchanged (VERIFIED or APPROVED may remain)
+ publication event + audit
```

| Scope | Disposition |
| --- | --- |
| Professional unpublish in Phase 12 (when impl authorized) | **In scope** (Slice B) |
| `publishProfile` / re-publish to DIRECTORY | **Deferred from verification-centre MVP** — still **Phase 12 foundation ownership** (not Phase 13). Required before Phase 13 implementation authorization (see Phase 13 P13-01/02/10). Includes `public_slug` mint on publish. |
| Business unpublish | **DEFERRED** |
| Hide → PRIVATE | **DEFERRED** |

---

## Explicit non-goals — **LOCKED**

```text
❌ /admin/** 
❌ /exco/verification/[id]
❌ Bulk verify/reject/publish
❌ CRM / messaging / notification product
❌ Exports / public verification / AI auto-verify
❌ New roles or permission hierarchy
❌ New document storage
❌ Fabricated consent UI
❌ Fake submission snapshots via audit
❌ Changing Phase 8 completion algorithm
❌ Forking Phase 9 business transition legality
❌ Silent cross-domain side effects
❌ Phase 13+ public directory / marketplace
```

---

## Prerequisites (resolved in this delivery)

| Prerequisite | Disposition |
| --- | --- |
| **Slice A: `submitProfile`** | **IMPLEMENTED** — `/profile` CTA when completion = 100% and status allows |
| **Slice A: `profiles.clarification_message`** | **IMPLEMENTED** — migration + domain persistence |
| **Publication foundation** | **IMPLEMENTED** — `publishProfile` / `unpublishProfile` + slug mint; **no** Phase 13 directory UI |

Business EXCO path reused Phase 9 (no rewrite). Consent capture and submission snapshots remain **DEFERRED**.

---

## Implementation summary (actual behaviour)

### Routes / UI

| Surface | Behaviour |
| --- | --- |
| `/exco/verification` | Unified queue; tabs are projections; deep-links to existing records |
| `/exco/professionals/[id]` | Live evidence + verification history + EXCO decisions + publish/unpublish |
| `/exco/businesses/[id]` | Existing Phase 9 review (unchanged) |
| `/profile` | Submit for verification when eligible; shows clarification/rejection message |

No `/admin`, no `/exco/verification/[id]`, no `/professionals` public directory.

### Commands / services

- `submitProfile` — own-record; completion 100%; → `SUBMITTED` + `PENDING`; clears clarification
- `applyExcoProfessionalDecision` — `start_review` / `verify` / `request_clarification` / `reject`
- `publishProfile` / `unpublishProfile` — `professional.publish`; VERIFIED required to publish; unpublish → `MEMBERS_ONLY` without clearing VERIFIED or slug
- Queue: `listVerificationQueue` + tab mapping in `queue-model.ts`

### Database

Migration `supabase/migrations/20260908210000_phase12_verification_centre.sql`:

- `profiles.clarification_message TEXT`
- JWT member guard allows own-record → `PENDING` from `NOT_REVIEWED` \| `NEEDS_CLARIFICATION` \| `REJECTED`
- Privileged Prisma still requires app-layer authz

### Evidence (post evidence-remediation closeout — 2026-09-09)

| Gate | Result | Classification |
| --- | --- | --- |
| TypeScript (`tsc --noEmit`) | PASS | DIRECTLY TESTED |
| ESLint | PASS | DIRECTLY TESTED |
| `next build` | PASS (`/exco/verification` present) | DIRECTLY TESTED |
| Vitest | **95** passed (includes Phase 12 command-boundary suite) | DIRECTLY TESTED |
| Phase 12 DB closeout | PASS — real commands via `npx tsx -r ./scripts/register-server-only.cjs scripts/phase12-db-closeout.ts` | DIRECTLY TESTED |
| Phase 9 DB regression | PASS | DIRECTLY TESTED |
| Phase 11 DB regression | PASS | DIRECTLY TESTED |
| Playwright Phase 12 | PASS — see browser list below | DIRECTLY TESTED |
| Production | **NONE** | N/A |

### Critical adversarial / security proof (honest layers)

| Scenario | Layer | Outcome |
| --- | --- | --- |
| Incomplete → `submitProfile` → DENY | Command boundary + DB closeout | PASS |
| 100% complete → `submitProfile` → SUBMITTED + PENDING | Command boundary + DB closeout + Playwright `/profile` | PASS |
| EXCO_VIEWER → verify/reject/clarify/publish/unpublish → DENY | Command boundary (not UI-only) | PASS |
| Clarification without reason → DENY | Command boundary + Playwright | PASS |
| Rejection without reason → DENY | Command boundary | PASS |
| Verify from PENDING (forged lifecycle skip) → DENY | Command boundary | PASS |
| MEMBER / stranger → EXCO mutation → DENY | Command boundary | PASS |
| Guessed UUID → EXCO start_review → NOT_FOUND | Command boundary | PASS |
| Professional verify → business status unchanged | Command boundary + DB closeout | PASS |
| Business approve → professional verification unchanged | Phase 11 DB closeout (`ownerVerificationUnaffectedByBizApprove`) | PREVIOUSLY / DIRECTLY re-run |
| Publish while not VERIFIED → DENY; VERIFIED → ALLOW; unpublish keeps VERIFIED + slug | Command boundary + Playwright | PASS |
| Anon / MEMBER → `/exco/verification` → DENY | Playwright | PASS |
| EXCO_VIEWER UI lacks Verify controls | Playwright | PASS (supplemental to command deny) |
| Consent fabricated | Code review — no consent write UI; honest copy on record | CODE REVIEWED |
| Client role body / localStorage spoof | Architecture: roles loaded from `user_roles` server-side; no trusted client role field | CODE REVIEWED (no accepted spoof field) |

### Browser evidence (Playwright)

- Anon → `/exco/verification` → sign-in
- MEMBER → `/exco/verification` → dashboard
- Incomplete member `/profile` → no Submit CTA
- Seeded 100% member → Submit for verification → `SUBMITTED`:`PENDING`
- VIEWER queue + view-only record
- ADMIN start review → verify → no auto-publish
- Publish / unpublish + slug preserved
- Clarification without / with reason
- Responsive 320–1280; filter keyboard focus

### Deferred / limitations

- Phase 13 public directory (`/professionals`, SEO, search)
- Phase 14 consent/visibility preferences UI
- Business unpublish in verification centre
- Immutable submission snapshots
- Application-level consent event writes (do not fabricate)
- Local Auth flakiness under load remains a known **P3** (`AUTH_E2E_HELPER` for e2e)
- Full original 35-row matrix is **not** duplicated line-by-line in Playwright; required risks are evidenced at the correct layer above (not claimed as “every row in Playwright”)

### P0 / P1 / P2

```text
P0 = 0
P1 = 0
P2 = 0
```

---

## Current state

```text
PHASE 5–11 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 12 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 13 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 14 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 15+ — NOT AUTHORIZED

HARD STOP
```
