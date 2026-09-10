# Phase 1.7 — Domain model (conceptual)

**Status:** LOCKED as a **conceptual domain contract**  
**Not:** PostgreSQL schema, migrations, or RLS (that is **Phase 2** and **Phase 3**)  
**Depends on:** Phase 0 independent-state rule; `interaction-workflows.md`  
**Next in Phase 1:** `component-system-architecture.md` (1.8)

Screens are representations of data. The model describes **real-world concepts**, not `DashboardData` tables.

If this file conflicts with Phase 0, **Phase 0 wins** until an explicit product change is approved.

---

## 1.7.1 Modelling principles

1. **Model concepts, not pages.**  
2. **Current state ≠ history.** e.g. `verificationStatus` now + `VerificationEvent` rows for who/when/decision.  
3. **Ownership is explicit.** Member content vs EXCO-controlled trust/publication vs system timestamps/audit.  
4. **Public directory is a projection**, not a second database.  
5. **Three independent dimensions never collapse** into one `status` field (Phase 0). Sequential diagrams in 1.6 are **one possible path**, not the data model.

---

## 1.7.2 Record-first identity (critical)

Phase 0: registration creates a **professional record** without password/account friction. Passwordless access is established later.

Therefore do **not** assume:

```text
User (auth)  1 ── 1  ProfessionalProfile
```

is created in one step.

**Conceptual split (locked direction):**

| Concept | Meaning |
| --- | --- |
| **Professional record** | The person in the TNCOD database (exists at Stage 1 registration) |
| **Auth identity (User)** | How they sign in (magic link / OTP). Linked when access is established |

**OPEN (Phase 2 / 7):** whether Auth user row is created at registration (email captured) or only at first successful passwordless login; how EXCO staff identities relate if a person is both Member and EXCO.

V1 still treats **one professional record per person**. Member+EXCO is role on identity, not two profiles.

---

## 1.7.3 Actors vs states

| Term | Kind |
| --- | --- |
| Visitor, Member, EXCO, System | Actors |
| Verified, published, incomplete | **States**, not actors |

Do not create a `VerifiedProfessional` entity or account type.

---

## 1.7.4 Canonical entities (conceptual)

| Entity | Purpose | V1 notes |
| --- | --- | --- |
| ProfessionalRecord | Central professional identity / Stage 1+2 data | System of record |
| AuthUser | Authentication identity | Supabase Auth; **no product password field** |
| Role | Member, EXCO Viewer, EXCO Admin, Super Admin | Phase 0 locked four roles — not “MEMBER vs EXCO only” |
| Permission | Action keys (`professional.verify`) | Phase 3 finalises matrix |
| ProfessionalSkill | Skills on a profile | Taxonomy + join |
| Skill (taxonomy) | Shared skill catalogue | May start as constrained tags |
| Experience | Career items | 1–many |
| Business | Related entity, not the person | 1–many; V1 may still be 0–1 in practice |
| OpportunityPreference | Seeking / offering (not a job board) | See 1.7.12 |
| VerificationEvent | Review history on a **named** subject | Recommended as entity because history matters |
| PublicationEvent | Optional history of publish/unpublish | Current visibility still a status on the record |
| Notification | Workflow messages | V1 triggers only; not a centre |
| AuditEvent | Who did what, when | Required for important EXCO actions |
| AdminNote | EXCO-only notes | Private |

**Directory** is **not** an entity. It is a query over records whose **visibility** allows public (or members-only) projection.

---

## 1.7.5 Three independent statuses (locked)

These **must not** become one field. Names in Phase 2 may be refined; **independence** is not open.

### Profile completeness (`profileStatus`)

Phase 0: `registered` | `incomplete` | `complete`

1.6 “SUBMITTED” is **not** completeness. If EXCO review requires an explicit submit, that is a **verification workflow flag** (e.g. `verificationStatus = pending`), not a fourth collapsed mega-status.

### Verification (`verificationStatus`)

Phase 0: `not_reviewed` | `pending` | `under_review` | `verified` | `needs_clarification` | `rejected`

Maps to EXCO actions: approve → verified; reject → rejected; request changes → needs_clarification.

**Granularity OPEN (Phase 2):** profile-reviewed vs credential vs business as **separate verification subjects** (recommended) vs one person-level badge. UI must still name **what** was verified.

### Directory visibility (`directoryVisibility`)

Phase 0: `private` | `members_only` | `directory` | `unpublished`

1.7 draft `PRIVATE | READY | PUBLISHED | UNPUBLISHED` is an alias sketch. **OPEN (Phase 2):** exact enum vs `private`/`unpublished` overlap (already flagged in Phase 0).

**Normal valid combination:** complete + not verified + unpublished. Sequential “complete → verified → published” is optional, not required.

---

## 1.7.6 Professional record (conceptual attributes)

Not a table dump. Illustrative:

- Identity: names, contacts (privacy-classified)
- Situation: professional status (editable), profession, org (optional)
- Narrative: headline, bio, image, location, links
- Seeking / offering (Stage 1 + preferences)
- `profileStatus`, `verificationStatus`, `directoryVisibility` (independent)
- Timestamps

**Member-owned:** biography, skills, experience, business *content*, links, image, opportunities/preferences.  
**EXCO-controlled:** verification decisions, publication/visibility approval (member may *request* or set preference — **OPEN Phase 13** exact consent vs EXCO publish).  
**System:** ids, timestamps, audit.

---

## 1.7.7 AuthUser

- Exists for passwordless session.  
- **No** `password` column in the product model. Auth provider (Supabase Auth) owns credentials.  
- Account lifecycle **OPEN:** `active` / `suspended` / `deactivated` as operational states (not in V1 EXCO screens unless specified).

---

## 1.7.8 Roles and permissions

**Locked roles (Phase 0):** Member · EXCO Viewer · EXCO Admin · Super Admin.

Permissions control **actions**, not “can see URL” as the source of truth:

Examples: `professional.view` · `professional.edit_own` · `professional.verify` · `professional.publish` · `business.manage` · `report.view` · `exco.users.manage`

Route protection is convenience. **Backend/RLS is authoritative** (Phase 3).

User **has many** roles (OPEN: one identity with multiple roles vs staff-only EXCO accounts).

---

## 1.7.9 Skills

`ProfessionalRecord` many-to-many `Skill` via `ProfessionalSkill`.

Skills are taxonomy, not routes. Catalogue governance **OPEN** (seed list vs free text vs both).

---

## 1.7.10 Experience

`ProfessionalRecord` 1 → many `Experience` (organisation, role, description, dates, current).

---

## 1.7.11 Business (related entity)

`ProfessionalRecord` 1 → many `Business` via **`business_professionals` (M:N)**. Association types are not legal ownership.

**Do not fuse** person and business.

**Independent business dimensions (do not copy the collapsed 1.6 ladder into one `status`):**

- Business profile completeness / submission of CAC evidence  
- Business verification status (Phase 0 business states: not_submitted … rejected)  
- Whether business appears in a public/members projection  

EXCO-05 and member business section edit **content**; EXCO verification/publication are separate.

---

## 1.7.12 Opportunity / preferences

UX locked: **not a marketplace**. Seeking + offering as structured participation.

**Recommendation for V1 (not SQL):** prefer **preference fields / tagged intents** on the professional record (and MEM-04) over unbounded “job listing” rows.

If an `Opportunity` entity exists, cardinality is 1 → many **intents**, with types such as SEEKING / OFFERING / COLLABORATION — still not applications, matching, or listings marketplace.

**OPEN (Phase 2):** one JSON/prefs table vs typed rows.

---

## 1.7.13 Verification as history entity (recommended)

V1 should persist **events**, not only a current enum:

Conceptual `VerificationEvent`: id, subject (`professional` | `business` | `credential` …), subjectId, reviewerId, action/decision, notes, createdAt.

Current `verificationStatus` is derived or stored **and** kept consistent with the latest event (Phase 2 chooses stored vs derived).

Queue (EXCO-06) is a **query** over records/events, not a second person.

---

## 1.7.14 Publication

- **Current** visibility on the professional (and optionally business) record.  
- **History:** `PublicationEvent` (who published/unpublished, when) recommended because Phase 0 requires auditable visibility changes.  
- Public directory: `WHERE` visibility allows public projection **and** field-level rules (Phase 3/13).

---

## 1.7.15 Notification

Conceptual: userId, type (`PROFILE_REVIEWED`, `NEEDS_CLARIFICATION`, `DIRECTORY_PUBLISHED`, …), payload, read, createdAt.

V1: important workflow events only. **OPEN:** in-app vs email vs both (Phase 7/13). Not a notification product.

---

## 1.7.16 AuditEvent

actorId, action, entityType, entityId, metadata, createdAt.

Covers verify, reject, publish, unpublish, role changes. Distinct from member-visible notifications.

---

## 1.7.17 Ownership matrix

| Data | Owner |
| --- | --- |
| Auth credentials | System (Supabase Auth) |
| Stage 1/2 profile content | Member |
| Verification result & evidence handling | EXCO |
| Directory visibility decision | EXCO (+ member consent OPEN) |
| Audit history | System |
| Notifications | System |
| Admin notes | EXCO |

---

## 1.7.18 Public vs private (conceptual)

**May be public if approved:** name, image, headline, summary, skills/services, selected experience, selected business, selected links — **field matrix OPEN Phase 13**.

**Never public by default:** personal email/phone unless explicitly approved; EXCO notes; verification evidence; audit; account internals; unpublished people.

Hybrid layers: private / members-only / public remain.

---

## 1.7.19 Indexes and reports (guidance for Phase 2)

Likely index: visibility, verification status, location, skill, industry, opportunity type.

Reports compose counts of independent dimensions (complete vs verified vs published) — never one “verified = public” metric as the only number.

---

## 1.7.20 Extensibility (out of V1)

Organisation membership, events, mentorship graph, member-to-member connections — **do not model into V1 schema without a Phase 0 scope change**.

---

## 1.7.21 Conflicts with the 1.7 sketch (explicit)

| Sketch | Resolution |
| --- | --- |
| User.password | **Rejected.** Passwordless. |
| Roles = MEMBER \| EXCO only | **Rejected.** Four Phase 0 roles. |
| User 1–1 Profile created together | **Tension.** Record-first; link auth later. |
| Single ladder CREATED→…→PUBLISHED | **Rejected as schema.** Independent statuses. |
| Opportunity as job posts | **Rejected as product.** Preferences/intents only. |
| “Phase 1.7 = database schema locked” | **No.** This file is conceptual; **Phase 2** produces schema. |

---

## PHASE 1.7 STATUS: PASS / LOCKED (domain concepts)

Schema, keys, nullability, and RLS remain **Phase 2–3**.
