# Phase 23D — Navigation & Task Clarity Remediation

**Status:** IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / **NOT LOCKED**  
**Dates:** Implementation 2026-09-16 · Verification gate attempt 2026-09-18  
**Authorization:** Phase 23D warroom + Verification & First-Time-User Clarity Gate. Phase 24+ **NOT AUTHORIZED**.

---

## 1. User problem

Pilot/user feedback: some members are not immediately sure what each section is for, what is required vs optional, what to attach, or what to do next. The platform needed to become **self-explanatory**, not help-dependent.

Evidence class for the problem signal: **REAL-PILOT-PARTICIPANT** (qualitative feedback) + **INFERRED** from forensic UI audit.

**POST-REMEDIATION REAL-PILOT EVIDENCE — NOT YET AVAILABLE.**

---

## 2. Forensic audit (pre-remediation)

| Screen | Problem | Why confused | Evidence | Root cause | Remediation | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | “Dashboard” + raw-ish statuses | Home vs product destination unclear; Joined vs complete vs verified collapsed in mind | CODE-REVIEWED | Label + missing next-action narrative | Rename nav to Home; humanized statuses; next-action card | P1 |
| Directory (signed-in) | Public shell | Members lose member nav mid-journey | CODE-REVIEWED | Always `ProductPublicShell` | Auth-aware `DirectoryShell` | P1 |
| Directory empty / self | “Empty” without self context | User thinks directory is broken or they should appear | CODE-REVIEWED | No self-status note | `DirectorySelfStatusNote` (own state only) | P1 |
| Profile / Edit | Purpose overlap | View vs edit not framed | CODE-REVIEWED | Weak intros | `PageIntro` + back link | P2 |
| Profile edit fields | Equal visual weight | Optional fields look mandatory | CODE-REVIEWED | Missing optional markers | Field `optional` / required from real schema | P2 |
| Businesses | Profile vs business | Relationship unclear; empty state thin | CODE-REVIEWED / pilot | Weak distinction copy | PageIntro + clearer empty CTA | P1 |
| Business create | Purpose mid-form | Discover purpose late | CODE-REVIEWED | Thin intro | PageIntro before form | P2 |
| Business verification / CAC | Fail-late on docs | Users learn CAC doc required only after submit | CODE-REVIEWED | Guidance after validation | Up-front required/optional + formats + privacy | P1 |
| Opportunities | Scope ambiguity | Could read as job board | CODE-REVIEWED | Soft boundary copy | Stronger purpose + empty state | P2 |
| Settings / Privacy | Account vs privacy | Routes clear, purpose less so | CODE-REVIEWED | Thin headings | PageIntro; privacy ≠ guarantee | P2 |

---

## 3. Navigation findings

- Member nav label **Dashboard → Home** (route `/dashboard` unchanged).
- Short **descriptions** on member nav items (shown in mobile drawer).
- Account menu: Privacy + Sign out retained.
- Join / Sign In labels **unchanged** (invariant).
- Canonical routes preserved (no duplicates).

---

## 4. Information architecture

- Reusable **`PageIntro`**: title → purpose → what to do → optional actions.
- **`RequirementLabel`** available; primary pattern uses existing `Field` required/optional.
- **`DirectoryShell`**: member shell when authenticated; public shell when anonymous.
- No second navigation system, help centre, tour, or completion algorithm.

---

## 5. Page guidance (shipped)

| Page | Guidance |
| --- | --- |
| `/dashboard` | Welcome + status explanation + next-action card |
| `/profile` | Private view vs verification/publication |
| `/profile/edit` | Save ≠ verify/publish; section purposes; required/optional |
| `/businesses` | Profile ≠ business; optional to add |
| `/businesses/new` | Creates record only; docs later |
| `/businesses/[id]` | Back link; humanized visibility |
| `/businesses/[id]/verification` | CAC attachment rules; private docs |
| `/opportunities` | Interest ≠ application/messaging/job board |
| `/settings` | Appearance vs privacy vs Spotlight |
| `/settings/privacy` | Preference ≠ public guarantee; contact private |
| `/professionals` | What directory is; self-status when signed in |

---

## 6. Required vs optional

Derived from Zod/schema and business submit rules:

- Profile save-required: preferred name, phone, professional status, profession, seeking, offering.
- Opportunity preference Yes/No: **recommended** for completion % (not hard save-required).
- Business create: **name required**; other fields optional.
- CAC path: if CAC-registered = Yes → CAC number **and** BUSINESS_REGISTRATION document **required** before submit; otherwise documents optional.

---

## 7. Attachments

Business verification upload guidance states:

- Required vs optional based on CAC claim
- Accepted: PDF, PNG, JPEG (max 10 MB) — matches existing code
- Private / EXCO review only / not public directory / not member-to-member
- No Storage/RLS changes

---

## 8. Dashboard

`resolveMemberNextAction` uses existing completion %, verification, and visibility — no invented workflow. Incomplete profiles surface remaining **section titles**.

---

## 9. Statuses

- `REGISTERED` → **Joined**
- `SUBMITTED` → **Submitted for review**
- Verification / visibility presentations already humanized; dashboard explains dimensions stay separate.

---

## 10. Empty states

Businesses, Opportunities, Directory empty states answer what / why / next.

---

## 11. Contextual help

No help-icon forest. Inline `PageIntro`, Field descriptions, and one document guidance panel. No Help Centre.

---

## 12. Responsive behaviour

Guidance uses existing layout tokens (`layout-prose`, shells, Container). Automated visual acceptance for 23D remains part of verification gate. Phone/tablet **manual** review still required.

Evidence: **CODE-REVIEWED**; **VISUAL-MANUAL** pending.

---

## 13. Accessibility

- Nav descriptions in drawer text (not hover-only)
- Statuses not colour-only (`StatusBadge` + labels)
- Theme-aware surfaces
- Join/Sign In unchanged

---

## 14. Security regression

**No changes** to Auth, RLS, RBAC, schema, Storage permissions, directory projection rules, or privacy enforcement. Guidance reveals **own** directory eligibility only.

Evidence: **CODE-REVIEWED**.

---

## 15. Pilot impact

| | |
| --- | --- |
| Pre-remediation | Qualitative confusion reported during Controlled Pilot |
| Post-remediation | **NOT YET AVAILABLE** — do not claim users now understand everything |

Phase 23 Controlled Pilot remains **AUTHORIZED / IN PROGRESS**.

---

## 16. Testing

Targeted Vitest (**AUTOMATED** — PASS):

- `src/features/dashboard/next-action.test.ts`
- `src/components/shell/phase-23d-nav-invariants.test.ts`
- Updated `member-exco-density.test.tsx`, `presentations.test.ts`
- E2E expectations updated: Home label; Profile: Joined

Also run:

- `tsc --noEmit` — PASS
- ESLint on touched guidance/pages — PASS
- `next build` — PASS

Full Playwright suite / Production smoke / manual phone–iPad usability: **VERIFICATION INCOMPLETE**.

---

## 17. Production impact

**NONE under this authorization until an explicit Production deploy is approved.** Implementation is local codebase only.

---

## 18. Deferred

- Manual phone / iPad / desktop usability acceptance (Light + Dark)
- Post-remediation real pilot participant observation
- Production smoke after any authorized deploy
- Phase 23C visual acceptance (still open; separate)
- UX-002 EXCO role-admin UI (unchanged deferred)

---

## 19. Rejected / out of scope

Help Centre, AI assistant, tours/coach marks, new routes, second completion system, business public directory, messaging, job matching, schema/RLS/Auth/RBAC changes, Phase 24.

---

## Final status (honest)

```text
PHASE 23D — IMPLEMENTATION COMPLETE
PHASE 23D — VERIFICATION INCOMPLETE
PHASE 23D — NOT LOCKED
```

Killcritic question: *Could a first-time TNCOD professional reasonably understand major sections without training?*  
**CODE-REVIEWED: substantially improved. REAL-PILOT / VISUAL-MANUAL: not yet evidenced. Do not LOCK.**

---

# Verification + first-time-user clarity gate (2026-09-18)

**Authorization:** Phase 23D Verification + First-Time-User Clarity Gate.  
**Chronology preserved:** Original implementation remained IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE; this section records the verification attempt.

## V1. Current implementation inspected

CODE-REVIEWED inspection of: PageIntro, RequirementLabel (unused), next-action, DirectoryShell, SelfStatusNote, Dashboard, Profile, Profile/Edit, Businesses (+ new/detail/verification), Opportunities, Settings, Privacy, Directory, Account menu, member/public nav, mobile drawer, Join/Sign In CTAs, status presentations, CAC submit rules, Phase 13 directory boundaries.

## V2. First-time-user result

```text
participant type: NONE AVAILABLE IN THIS SESSION
tasks attempted: 0 (human)
coaching required: N/A
```

**REAL-PILOT-PARTICIPANT / controlled usability tester evidence — NOT PERFORMED.**  
Do not fabricate. Per §38 / §41 of the verification authorization, **23D cannot LOCK** without this gate.

## V3. Navigation clarity (CODE-REVIEWED after corrections)

| Tab | Result | Reason |
| --- | --- | --- |
| Home / Dashboard | PASS WITH FINDING | Clear intro + next-action; human statuses. Residual: no live human confirmation. |
| Directory | PASS | Purpose + self-status (own only); auth-aware shell |
| Profile | PASS | View vs edit; completion ≠ verification ≠ publication |
| Businesses | PASS | Profile ≠ business; submit CTA gated by `memberMaySubmit` |
| Opportunities | PASS | Interest ≠ job board |
| Settings | PASS WITH FINDING | Clear hub; Account/Privacy dual entry is intentional shortcut (P3) |
| Account | PASS WITH FINDING | Privacy + Sign out; limited by design |

## V4. Requirements clarity

Required / optional / conditional CAC rules aligned to schema. Document formats PDF/PNG/JPEG. Submission ≠ publication. After gate corrections: CAC file “Required” only while registration doc still missing.

## V5. Completion / attention

Dashboard next-action now prioritizes EXCO clarification/rejection; incomplete sections named; verified-not-listed no longer implies Privacy publishes you.

## V6. Contextual help

Contextual, minimal, non-cluttering. No Help Centre / tour / AI.

## V7. Phone + iPad

| Evidence | Result |
| --- | --- |
| Automated overflow Playwright (local) | **NOT COMPLETED** — Playwright webServer hung in this environment |
| Manual phone / iPad usability | **NOT PERFORMED** |
| Production public HTTP | **PRODUCTION-SMOKE** `/` `/professionals` `/join` `/sign-in` → 200 |

## V8. CTA invariants

Local code + Production homepage smoke: **Join → /join**, **Sign In → /sign-in**. No Register/Log In replacements.

## V9. Security / regression

No Auth/RLS/RBAC/schema/directory allowlist changes. Anonymous → member routes still redirect to sign-in (asserted in e2e spec; local run hung). NavLink fix restores real href navigation in link-mode drawers (was broken: drawer `onNavigate` forced button mode without routing).

## V10. Automated evidence

| Check | Result |
| --- | --- |
| TypeScript | PASS (prior + after next-action/nav-link edits) |
| ESLint (targeted) | RUNNING/SLOW — treat as incomplete if not confirmed |
| Vitest (next-action, nav invariants, nav-link, presentations) | PASS |
| Next build | PASS (prior implementation gate); not re-run this turn if time-constrained |
| Playwright local | **HUNG / NOT COMPLETED** |
| Production smoke (public) | PASS (HTTP 200 + CTA copy script) |

## V11. Corrections made during this gate

1. **P1** `resolveMemberNextAction`: verified-not-listed no longer CTA to Privacy as if it publishes; EXCO publication language; clarification/rejection prioritized.
2. **P1** Business detail: “Submit for verification” only when `memberMaySubmit`; otherwise “View verification”.
3. **P2** CAC upload “Required” only when CAC Yes **and** no `BUSINESS_REGISTRATION` on file yet.
4. **P1** `NavLink` link mode always uses `href`; `onNavigate` is side-effect only (fixes mobile drawer dead navigation on product shells). Account menu always closes after choose.

## V12. Remaining findings

**Blocking for LOCK:**

- Real first-time-user acceptance not run
- Manual phone + iPad usability not run
- Local Playwright suite not completed (environment hang)

**Non-blocking (P3):** PreferenceSelect lacks “(optional)” chip; Home “Record:” vs Profile “Profile:” label prefix; business edit lacks PageIntro; Account/Settings Privacy dual entry; `RequirementLabel` unused.

**Deferred:** Phase 23C visual LOCK; Phase 23 pilot closeout; UX-002.

## V13. Documentation

This file updated with verification-gate chronology.

## V14. Production impact

```text
Production changes: NONE
DB schema: NONE
RLS: NONE
RBAC: NONE
Auth: NONE
Production data mutation: NONE
```

Verification corrections are **local codebase only** until an explicit deploy is authorized. Production still serves pre-correction bundle for NavLink/next-action fixes.

## V15. Governance

```text
PHASE 5–23B — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 23C — IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / NOT LOCKED
PHASE 23D — IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / NOT LOCKED

PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS

PHASE 24+ — NOT AUTHORIZED

HARD STOP
```

---

# Final lock gate (2026-09-18)

**Authorization:** Phase 23D Final Verification, Human Acceptance & Lock Gate.  
**Branch:** `main` @ `6f316067baf29eccdb23e6f1ab79c3a58bc605c2`  
**Working tree:** Dirty — 23D changes mixed with Phase 18–23C/23B/20.5 and other uncommitted work.  
**Deployment decision:** **STOP — no Production deploy.** Cannot isolate “already-authorized 23D corrections only” from the mixed tree without risking unrelated release. **No broad cleanup, no commit, no selective rewrite of unrelated work** under this gate.

## L1. Executive verdict

23D implementation quality is CODE-REVIEWED improved and local automated checks for 23D suites PASS, but **23D is not ready to LOCK**.

Blocking gaps remain mandatory human gates and a mixed working tree that forbids a clean 23D-only Production deploy.

## L2. First-time-user acceptance

```text
participant available: NO
REAL-PARTICIPANT ACCEPTANCE — NOT AVAILABLE
tasks completed: 0
observations: none (no human tester in this session)
findings: lock denied by authorization §4 / §32
evidence class: (none — not fabricated)
```

## L3. Navigation clarity

CODE-REVIEWED only (not REAL-PILOT-PARTICIPANT):

| Surface | Result |
| --- | --- |
| Home | PASS WITH FINDING (no human retest) |
| Directory | PASS WITH FINDING |
| Profile | PASS WITH FINDING |
| Edit Profile | PASS WITH FINDING |
| Businesses | PASS WITH FINDING |
| Opportunities | PASS WITH FINDING |
| Settings | PASS WITH FINDING |
| Privacy | PASS WITH FINDING |
| Account | PASS WITH FINDING |

Human-confirmed: **NOT TESTED**.

## L4–L5. Required / optional / attachments

CODE-REVIEWED: required/optional/conditional CAC guidance remains aligned with submit rules; document privacy copy intact. Human validation: **NOT TESTED**.

## L6. Phone (320 / 375 / 390 / 430)

```text
MANUAL phone review: NOT PERFORMED
Playwright viewport matrix: NOT VERIFIED (prior hang; not re-run as PASS)
```

## L7. Tablet / iPad (768 / 834 / 1024)

```text
MANUAL tablet/iPad review: NOT PERFORMED
```

## L8. CTA invariants

Local code: Join → `/join`, Sign In → `/sign-in` (exact labels).  
**PRODUCTION-SMOKE** (azure origin, 2026-09-18): homepage CTA script PASS; `/` `/professionals` `/join` `/sign-in` → 200; `/dashboard` anonymous → 307 `/sign-in?next=%2Fdashboard`.

Note: Production still serves the **pre-correction** bundle for local-only NavLink/next-action fixes (no deploy this gate).

## L9. Accessibility

CODE-REVIEWED residual only. Practical keyboard/focus manual pass: **NOT PERFORMED**.

## L10. Automated checks (this lock gate)

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | **PASS** (`TSC_OK`) |
| ESLint (core 23D files) | **PASS** |
| Vitest (23D suite, 23 tests) | **PASS** |
| Next build | **PASS** |
| Playwright | **NOT VERIFIED** (not falsely reported PASS) |

## L11. Production

```text
deployment: NONE
production smoke: PASS (public CTAs + routes + anonymous dashboard deny)
authenticated smoke: NOT PERFORMED
```

## L12. Phase 13 regression

CODE-REVIEWED + PRODUCTION-SMOKE `/professionals` 200: **PASS** for no intentional 23D change to eligibility/allowlist/noindex/slug. Full authenticated projection audit: not expanded this gate.

## L13. Security regression

CODE-REVIEWED: guidance-only; no Auth/RLS/RBAC/schema changes in 23D corrections. Anonymous dashboard deny PRODUCTION-SMOKE PASS. Full EXCO/IDOR retest: not re-run as a Phase 22 suite this gate.

## L14. Corrections made in this lock gate

```text
No implementation corrections were necessary beyond documenting the lock decision.
```

(Prior verification-gate P1/P2 corrections remain in the local working tree; not deployed.)

## L15. Deferred / remaining (blocking)

1. REAL-PARTICIPANT ACCEPTANCE — NOT AVAILABLE  
2. MANUAL phone acceptance — NOT PERFORMED  
3. MANUAL tablet/iPad acceptance — NOT PERFORMED  
4. Clean 23D-only deploy — blocked by mixed dirty working tree  
5. Playwright local completion — NOT VERIFIED  
6. Phase 23C visual lock — still open (separate)

Non-blocking P3 residual: optional-chip polish, Record:/Profile: label prefix, unused RequirementLabel, business edit PageIntro.

## L16. Future Phase 24 architectural inputs — NOT IMPLEMENTED

```text
PHASE 24 ARCHITECTURAL INPUT — NOT IMPLEMENTED
```

### EXCO RBAC decisions (record only)

Authoritative future inputs (settled for Phase 24 architecture; **not implemented**):

```text
SUPER_ADMIN
  └─ creates EXCO accounts

SUPER_ADMIN
  └─ assigns EXCO_ADMIN

SUPER_ADMIN + EXCO_ADMIN
  └─ assign EXCO_VIEWER

EXCO_ADMIN
  └─ CANNOT create EXCO_ADMIN
  └─ CANNOT assign EXCO_ADMIN
  └─ CANNOT assign SUPER_ADMIN

SUPER_ADMIN
  └─ SUPER_ADMIN assignment remains protected

All EXCO users
  └─ cannot self-elevate

Authorized EXCO user
  ├─ Member View
  └─ EXCO View

Member ↔ EXCO switching
  └─ navigation convenience only
  └─ never an authorization boundary
  └─ no manual URL editing required
```

| Question | Decision |
| --- | --- |
| Who can create EXCO accounts? | `SUPER_ADMIN` only |
| Who can assign `EXCO_VIEWER`? | `EXCO_ADMIN` and `SUPER_ADMIN` |
| Who can assign `EXCO_ADMIN`? | `SUPER_ADMIN` only |
| Can EXCO Admin create another EXCO Admin? | No |
| Can anyone assign `SUPER_ADMIN`? | No; remain protected |
| Can EXCO users self-elevate? | No |
| Can an EXCO user also use Member View? | Yes, where authorized |
| Is Member ↔ EXCO switching a security boundary? | No |
| Should switching require manually changing URL? | No |
### Verification architecture input (record only)

```text
Professional situation
→ claims
→ evidence requirements
→ EXCO review
→ verification decision
```

Known future situation categories (not locked as a final matrix): Employed / Working; Business Owner; Self-employed / Freelancer; Consultant / Professional Services; Student / Intern; Between Jobs; Seeking Employment; Retired; Other.

### Milestone UX input (record only)

```text
truthful, contextual, professional celebrations
```

Examples deferred to Phase 24 architecture only (Registration → You're in; Profile complete; Verification submitted; Verified; Directory published; Needs clarification). No gamification / XP / streaks.

```text
NONE IMPLEMENTED IN PHASE 23D
```

## L17. Documentation

Updated: `docs/product/phase-23d-navigation-task-clarity-remediation.md`  
Governance rule should remain aligned: 23D NOT LOCKED.

## L18. Production impact

```text
Production changes: NONE
DB schema: NONE
RLS: NONE
RBAC: NONE
Auth: NONE
Production data mutation: NONE
```

## L19. Final governance state

```text
PHASE 5–23B — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 23C — IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / NOT LOCKED

PHASE 23D — IMPLEMENTATION COMPLETE
PHASE 23D — VERIFICATION INCOMPLETE
PHASE 23D — NOT LOCKED

PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS

PHASE 24+ — NOT AUTHORIZED

HARD STOP
```
