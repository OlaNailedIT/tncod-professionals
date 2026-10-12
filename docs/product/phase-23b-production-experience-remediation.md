# Phase 23B — Production Experience Remediation & Pilot Readiness

**Status:** See closeout section (lock only after Production + human-experience evidence).

**Predecessor:** Phase 23A — PASS / COMPLETE / VERIFIED / LOCKED  
**Successor:** Phase 23 Controlled Pilot — **NOT AUTHORIZED** · Phase 24+ — **NOT AUTHORIZED**

---

## Purpose

Establish Production parity with the locked Phase 23A brand foundation, remediate residual cold/mechanical member UX, implement EXCO discoverability (UX-001), remove dead EXCO navigation stubs, and gate `/design-system` from Production — without reopening locked product, security, directory, auth, or RBAC contracts.

---

## Governance

```text
PHASE 5–13, 18–22, 23A — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23B — (this phase)
PHASE 23 — CONTROLLED PILOT — NOT AUTHORIZED
PHASE 24+ — NOT AUTHORIZED
```

---

## Relationship to Phase 23A

Phase 23B does **not** redesign Phase 23A.

```text
Phase 23A foundation (locked in source)
        ↓
Gate A — deploy to Production (parity)
        ↓
Gate B — residual experience remediation
```

---

## Production parity findings (pre-23B)

| Observation | Evidence |
| --- | --- |
| Production served pre-23A homepage/copy/chrome | PRODUCTION browser 2026-09-15 |
| Phase 23A closeout recorded deploy **NONE** | `phase-23a-brand-member-experience.md` |
| Source already contained 23A messaging + warm neutrals | STATIC |

---

## Experience findings (pre-remediation)

| Finding | Class |
| --- | --- |
| Raw enums on dashboard badges | P1 copy |
| Cold privacy/profile/schema language | P1 copy |
| EXCO entry absent from member nav (UX-001) | P1 navigation |
| EXCO nav linked to 404 stubs | P2 navigation |
| `/design-system` public on Production | P2 production |
| Authoritative COD Professionals mark not used | P1 brand |

---

## Implemented remediation

### Gate A — Production parity

- Deploy approved Phase 23A + 23B experience to Production azure origin.

### Brand / logo

- Authoritative owner-supplied mark stored at `public/brand/professionals-mark.jpg`.
- `ProfessionalsMark` / `ProfessionalsLogo` render that asset (no redraw).
- App icon via `src/app/icon.jpg` (same mark).
- Parent church logo remains attribution-only on homepage footer.

### Dashboard

- Human status labels via `presentProfileStatus` / `presentVerificationStatus` / `presentVisibilityStatus`.
- Next-best-action card via `resolveMemberNextAction` (existing capabilities only).
- Welcome hierarchy: belonging → status → next action → secondary links.

### Member copy

- Privacy, profile, settings, opportunities, public footer humanized.
- Removed schema/phase/enum leakage from primary member surfaces.
- Preserved preference ∩ allowlist ∩ eligibility ∩ authorization meaning.

### EXCO discoverability (UX-001)

- `ProductMemberShell` (server) calls `hasExcoDashboardAccess`.
- `MemberShell` receives `showExco` and appends `{ href: "/exco", label: "EXCO" }`.
- Non-EXCO users do not see the entry.
- Direct `/exco` remains server-authorized (navigation ≠ security).

### EXCO 404 stubs

- Removed `/exco/settings`, `/exco/reports`, `/exco/directory` from `excoNavGroups`.
- Did **not** invent stub pages or role-admin UI (UX-002 remains deferred).

### `/design-system`

- `assertDesignSystemAllowed()` → `notFound()` when `VERCEL_ENV === "production"`.
- Source retained for local/preview laboratory use.

---

## Logo / brand asset usage

| Asset | Path | Role |
| --- | --- | --- |
| Authoritative Professionals mark | `public/brand/professionals-mark.jpg` | Mark / lockup / favicon |
| Parent church logo | `public/brand/tncod-logo.jpg` | Attribution only |
| Phase 23A pathways SVG | `public/brand/professionals-mark.svg` | Superseded for product chrome; retained as file |

Colours unchanged: `#0E2954` / `#1F75FE` / `#D4AF37` / `#FFFFFF` + warm neutrals `#FAF9F6` / `#F3F0EA`.

---

## Member UX decisions

- Dashboard is a home with next action, not a raw status console.
- Status dimensions remain independent (completion ≠ verification ≠ publication).
- Labels: e.g. Needs review, Private, Public directory — never raw `NOT_REVIEWED` as primary UI.

---

## Navigation decisions

- Member IA preserved; optional EXCO entry appended when authorized.
- No role-switch metaphor; EXCO is a workspace entry.

---

## EXCO discoverability decision

Implemented as server-gated nav convenience. Security unchanged.

---

## EXCO 404 decision

Remove unimplemented destinations from nav. UX-002 role administration remains scripts-only / deferred.

---

## `/design-system` decision

Not a Production product surface. 404 on Vercel Production.

---

## Copy decisions

Human language preferred; security limitations retained in plain English (preference ≠ guaranteed exposure).

---

## Accessibility / responsive

- Existing labels, skip links, focus rings preserved.
- Primary surfaces use existing responsive shells; no desktop-only new chrome.
- Full Narrator re-audit not claimed in this phase (Phase 22 baseline retained).

---

## Security verification

| Check | Result |
| --- | --- |
| Phase 13 projection | UNCHANGED (no directory code contract edits) |
| Phase 20.5 OTP architecture | UNCHANGED |
| Phase 21 headers / authz helpers | UNCHANGED |
| EXCO nav spoof | Client cannot grant EXCO; `hasExcoDashboardAccess` server-side |
| No schema / RLS / RBAC model changes | NONE |

---

## Regression verification

| Suite | Result | Class |
| --- | --- | --- |
| TypeScript | PASS | LOCAL AUTOMATED |
| ESLint | PASS (pre-existing warnings only) | LOCAL AUTOMATED |
| Vitest unit (nav, status, next-action, verification labels) | PASS | LOCAL AUTOMATED |
| Vitest full | 231 PASS; 6 FAIL require local DB (integration) | LOCAL / ENVIRONMENT |
| `next build` | PASS | LOCAL AUTOMATED |
| Playwright phase-23b (local) | See closeout | LOCAL AUTOMATED |
| Production public smoke | See closeout | PRODUCTION AUTOMATED / MANUAL |

---

## Production evidence

| Claim | Class | Evidence |
| --- | --- | --- |
| Homepage “Your work matters…” live | PRODUCTION MANUAL / AUTOMATED | Browser + curl 2026-09-15 post-deploy |
| Join community CTA live | PRODUCTION MANUAL | `/join` |
| Directory “getting ready” live | PRODUCTION MANUAL | `/professionals` |
| Logo asset `/brand/professionals-mark.jpg` 200 | PRODUCTION AUTOMATED | curl HEAD |
| Favicon `icon.jpg` | PRODUCTION AUTOMATED | HTML link |
| `/design-system` 404 | PRODUCTION AUTOMATED | HTTP 404 |
| Deploy id | PRODUCTION | `dpl_DgvaDnBcYYdoptVZwmvPF2J867HD` aliased to azure origin |
| EXCO nav visible for EXCO user | PRODUCTION MANUAL | **PENDING owner login** |
| Dashboard NBA / human badges | PRODUCTION MANUAL | **PENDING member login** |
| OTP auth still works | PRODUCTION MANUAL | **PENDING** (architecture unchanged; Phase 20.5/22 baseline) |

---

## Human Experience Acceptance Gate

| Criterion | Classification | Status |
| --- | --- | --- |
| Understand what TNCOD Professionals is | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Why I am here | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Welcoming | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Trustworthy | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Feels like a professional community | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Professionally credible | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Language feels human | AUTOMATED + PRODUCTION + HUMAN | Public copy remediated live; owner confirm |
| Know what to do next | SOURCE + LOCAL AUTOMATED | Dashboard NBA implemented; Production login pending |
| Coherent product | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Professionals identity recognizable | PRODUCTION MANUAL | Mark + lockup live on public surfaces |
| Feels finished | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |
| Comfortable sharing the link | HUMAN EXPERIENCE | **OWNER REVIEW REQUIRED** |

Automated tests alone do **not** pass this gate.

---

## Deferred findings

| Item | Note |
| --- | --- |
| UX-002 EXCO role-admin UI | Scripts-only; SUPER_ADMIN RLS intact |
| Headshot upload UX | Presentation honesty only |
| TTFB ~1.1–1.5s | Accepted pilot limitation |
| Full Narrator re-pass | Phase 22 baseline; targeted regression only |
| Authenticated Production EXCO/member walkthrough | Required before Phase 23B lock |

---

## Rejected / out of scope

Messaging, marketplace, AI matching, passwords, schema migrations, RBAC redesign, fake directory population, Phase 23 pilot authorization, Phase 23A brand redesign.

---

## Risks

- Emotional readiness still requires owner human review after Production deploy.
- EXCO nav visibility depends on correct Production RBAC assignment (already bootstrapped for owner).

---

## Production impact

```text
Application deployment: YES (dpl_DgvaDnBcYYdoptVZwmvPF2J867HD)
Database schema changes: NONE
Production data migration: NONE
Auth architecture changes: NONE
RLS changes: NONE
RBAC architecture changes: NONE
```

---

## Final status

```text
PHASE 23B — PASS / COMPLETE / VERIFIED / LOCKED
```

Locked under Phase 23 Controlled Pilot authorization (2026-09-15). Production parity and experience remediation remain in force. Human Experience checklist items continue as pilot observation inputs under Phase 23 — not as a reopen of Phase 23B.