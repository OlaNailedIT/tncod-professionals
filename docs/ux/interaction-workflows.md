# Phase 1.6 — Interaction and workflow architecture

**Status:** LOCKED (structurally) — including the final behaviour contract below  
**Depends on:** `navigation-architecture.md` (1.5 LOCKED)  
**Domain concepts:** `docs/architecture/domain-model.md` (1.7 conceptual; schema is Phase 2)  
**Construction:** `docs/architecture/component-system-architecture.md` (1.8; implementation is Phase 4+)

A route is **where**. A workflow is **why they go, what they do, and what happens next.**

---

## 1.6 final behaviour contract (locked)

Reusable primitives: **save** (stay + inline confirm) · **review/queue** (queue → record → decision → queue on completed verify/reject) · **detail manage** (workspace → record → stay) · **confirm** (publish/reject/unpublish/later delete).

**Register:** `/register` → record → `/dashboard` (status + next action; completion % is guidance).

**Profile:** progressive sections; save anytime; incomplete is valid; editor stays after save.

**Public:** directory → search/filter → PUB-03 → optional register. Empty directory ≠ empty database. No-results ≠ empty directory.

**EXCO:** dashboard → workspace → record → action → continue (queue after completed verification).

**Auth:** sign in → role → `returnTo` or `/dashboard` / `/exco`. Session expiry → sign in → return.

**Notifications:** workflow-important only (verified / needs update / now in directory; EXCO queue). No notification centre in V1.

**First-time dashboard:** what this is, why profile matters, complete when ready.

**Sequential diagram** (complete → review → verified → published) is a **possible operational path**, not a single status field. Completeness ≠ verification ≠ publication.

**“Verified professional”** is a state, not an actor.

---

## 1.6.1 Behaviour principles

1. Every workflow has a clear beginning and end (where / doing / after).  
2. Preserve **momentum** (continue incomplete work; EXCO process the next queue item).  
3. **Actions change states**; UI shows current state, not only buttons.  
4. **Incomplete work is first-class** (leave and resume).  
5. **Never collapse** profile status, verification status, and directory visibility into one workflow “status” (Phase 0). Workflows **move one dimension** (or a clearly named pair of actions) at a time.

---

## 1.6.2 Actors

| Actor | Meaning |
| --- | --- |
| **Visitor** | Unauthenticated public |
| **Member** | Authenticated professional record owner |
| **EXCO** | Viewer / Admin / Super Admin (roles change permissions, not a separate product) |
| **System** | Auth, visibility rules, state changes, later notifications |

**Not an actor:** “Verified Professional.” Verification is a **state** on claims/profile review, not an account type.

---

## 1.6.3 Workflow inventory

| ID | Workflow | Actor |
| --- | --- | --- |
| WF-01 | Discover professionals | Visitor |
| WF-02 | Register | Visitor → Member |
| WF-03 | Complete profile (progressive) | Member |
| WF-04 | Edit profile | Member |
| WF-05 | Manage opportunities | Member |
| WF-06 | Public visibility / preview | Member / Public / EXCO |
| WF-07 | Manage professionals | EXCO |
| WF-08 | Verify claims (professional or business) | EXCO |
| WF-09 | Manage businesses | EXCO |
| WF-10 | Publish / unpublish directory projection | EXCO |
| WF-11 | View reports | EXCO |
| WF-12 | Authenticate / recover session | All |

---

## 1.6.4 Shared interaction patterns

| Pattern | Shape | Use |
| --- | --- | --- |
| Confirm | Action → **E** confirm → result | Publish, unpublish, reject, verify, later delete/suspend |
| Save | Edit → save → **inline** success; stay | Profile, opportunities, settings |
| Queue | List → item (record) → decision → **list** | Verification (completed decisions) |
| Detail manage | Workspace → record → actions → **remain** | EXCO records, publication on record |
| Incomplete resume | Started → leave → return → same object, same independent states | Profile, registration already done |

---

## WF-01 — Discover professionals

**Goal:** Find published professionals and understand directory value.

**Entry:** `/`, `/professionals`, shared `/professionals/[slug]`

**Flow:** Home optional → browse → search/filter → select → PUB-03

**States:** Loading; empty directory (no **published** profiles); no search matches (different copy); error; PUB-03 unavailable (privacy-safe).

**End:** Viewing a public projection. **Next:** another profile or Register.

---

## WF-02 — Register

**Goal:** Create a professional **record** without a full profile.

**Entry:** `/register`

**Flow:** Form → submit → **record created** → `/dashboard`

**Independent states after success (typical):** profile incomplete; not verified; not published; **internally available**.

**Dashboard must answer:** Welcome; profile not complete; next step complete profile (and later is valid).

**Failure:** Validation; submit error; data not created or clearly said so. Duplicate identity OPEN (Phase 2/7).

**Must not:** Multi-page onboarding product; password; Stage 2 dump.

---

## WF-03 — Progressive profile completion

**Goal:** Turn a record into a useful professional identity. **Not** a gate to membership.

**Entry:** MEM-01 CTA, MEM-02, deep link `/profile/edit?section=`

**Progression (guidance, not required order):** identity → professional → skills/services → experience → business if relevant → links → visibility. Seeking/offering also via MEM-04.

**Save anytime.** Completion % is guidance, not a lock.

**Do not map “READY FOR REVIEW / PUBLISHED” as the same ladder as verification.** Completeness ≠ review ≠ publication.

**Resume:** Return later; editor and dashboard show remaining sections without failure language.

---

## WF-04 — Edit profile

**Goal:** Maintain accuracy as circumstances change (status is editable).

**Flow:** MEM-02 → MEM-03 → change section → save → stay + confirmation.

**Error:** “Unable to save. Information has not been updated. Try again.” Unsaved leave → **E**.

---

## WF-05 — Opportunities

**Goal:** Communicate seeking and offering. Not a marketplace.

**Flow:** MEM-04 → update → save → stay.

**States:** None yet; active preferences. Empty is first-use, not error.

---

## WF-06 — Visibility and public projection

**Bridge:** Member data → **controlled** public directory.

**Rule:** Editing does **not** auto-publish. EXCO publication (WF-10) and member visibility preferences are distinct controls (detail Phase 13).

**Member preview:** If published, open **PUB-03** (same projection). If not published, no public URL leak.

**EXCO preview:** Same PUB-03, labelled preview.

---

## WF-07 — EXCO professional management

**Entry:** `/exco/professionals`

**Flow:** List (URL filters) → EXCO-03 → permitted action → remain on record (unless WF-08 completed decision).

**Actions (permission-gated):** review, verify (named), publish/unpublish, request clarification, notes, limited edit. Suspend/archive/delete OPEN Phase 3.

**Viewer:** can open records; cannot verify/publish.

---

## WF-08 — Verification

**Goal:** Move a **named claim** (credential, business registration, or “profile reviewed” if that is a distinct EXCO action) through review. **Not** “verify the person as a whole” with one anonymous tick.

**Queue states (workspace filters):** pending → under review → needs clarification | verified | rejected (align names with Phase 0 verification status in Phase 2).

**Flow:** EXCO-06 → EXCO-03 or EXCO-05 + verification panel → confirm (**E**) → state update → **return to queue** if decision is terminal (verified/rejected). **Stay on record** if needs clarification.

**Member-facing outcome (later copy):** e.g. profile reviewed vs credential verified by TNCOD — never auto-tick typed titles.

**History:** Auditable (Phase 0 principle); UI surface is panel + activity, not a second record.

---

## WF-09 — EXCO business management

Same pattern as WF-07 on EXCO-04 / EXCO-05. Business is a **related entity**, not a second identity. Publication of business projection still WF-10.

Do not invent a parallel “business account type.”

---

## WF-10 — Directory publication

**Goal:** Make an **existing** record’s **approved projection** discoverable — not create a second profile.

**Flow:** EXCO-07 and/or visibility panel on record → confirm publish/unpublish → remain in EXCO context → optional PUB-03 preview.

**Independent of** completeness and of verification. A complete verified person may still be unpublished. An unpublished person may still be complete.

**Public after unpublish:** slug → unavailable (WF-01), no reason disclosed.

---

## WF-11 — Reports

Observe the system. Choose report, filter, view. No operational state machine. No nested report routes in V1.

---

## WF-12 — Authentication

**Sign in:** credentials/passwordless verified → determine role → `returnTo` if safe else Member `/dashboard` / EXCO `/exco`.

**Session expired:** protected page → sign in → return when safe.

**Permission denied:** explain; fallback `/dashboard` or `/exco` (1.5). Not a second login loop.

---

## 1.6.5 Notifications (V1)

**Not** a notification centre product (Phase 0 non-goal: complex notification engine).

**Triggers only (implement later):** member — verified / needs clarification; EXCO — queue volume. Channel OPEN (in-app banner vs email). Do not design WF for a full inbox.

---

## 1.6.6 First-time member

Dashboard answers: what this is; why complete; what next. Tone: invitation, not compliance.

---

## 1.6.7 Global UI states (contract)

Loading, empty (first-use vs filtered), error (impact + next step), success (stay unless queue return), permission denied — as in 1.4.9.

---

## 1.6.8 Mapping to later phases

| This file | Later |
| --- | --- |
| Workflow IDs, transitions, stay-vs-return | Frontend state, APIs |
| Independent dimensions | **Phase 2** columns/enums — do not invent tables here |
| Permission on actions | **Phase 3** RLS |
| Passwordless steps | **Phase 7** |
| EXCO auth | **Phase 10** |

---

## 1.6.9 Open

Exact verification evidence rules; whether “profile reviewed” is a first-class verification type vs a note; notification channel; suspend/archive; duplicate registration; query param names.

---

## PHASE 1.6 STATUS: PASS / LOCKED (interaction contract)

**Not locked:** visual UI, data model, RLS.

**Do not start Phase 1.7 as “data model.”** That is Phase 2. Remaining Phase 1 work is **UX acceptance criteria** (and any 1.4/1.5 copy refinements).
