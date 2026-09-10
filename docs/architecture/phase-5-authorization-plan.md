# Phase 5 — Authorization & execution plan

**Document type:** GO review / scope contract  
**Status:** **Phase 5 CLOSED**; **Phase 6 Quick Registration MVP LOCKED**; Phase 7+ **NOT AUTHORIZED**  
**Date:** 2026-09-06 (Phase 6 locked 2026-09-07)  

Phase 6 evidence: `docs/product/phase-6-quick-registration-mvp.md`. Do **not** start Phase 7 until explicitly authorized.

---

## Foundation status (closed)

| Phase | Status |
| --- | --- |
| Phase 0 — Product architecture | **PASS — LOCKED** |
| Phase 1 — UX / IA | **PASS — LOCKED** |
| Phase 2 — Data architecture | **PASS — LOCKED** |
| Phase 2 — Database Gate | **PASS — EXECUTED** |
| Phase 3 — Security architecture | **PASS — COMPLETE** |
| Phase 4 — Technical foundation and runtime | **PASS — COMPLETE** |
| Phase 5 — Design system and visual direction | **PASS — COMPLETE / CLOSED** — 5.1–5.14 LOCKED |
| Phase 6 — Quick Registration MVP | **PASS — COMPLETE / VERIFIED / LOCKED** |
| Phase 7+ product modules | **NOT AUTHORIZED** |


Evidence:

- Phase 3 contract: `docs/security/phase-3-security-gate.md`
- Phase 4 runtime: `docs/architecture/phase-4-runtime-completion-report.md`
- Phase 4 audit: `docs/architecture/phase-4-evidence-audit.md`

**Do not reopen Phases 3–4** for “extra coverage.” Documented caveats become requirements when the corresponding functionality is introduced (e.g. Phase 7 browser login, later signed document URLs).

---

## Formal decision language

```text
PHASE 5.1–5.14: PASS — LOCKED
PHASE 5: FORMALLY CLOSED
PHASE 6: PASS — LOCKED
PHASE 7+: NOT AUTHORIZED
```

See `docs/product/phase-6-quick-registration-mvp.md`.
---

## What Phase 5 is

From the Phase 0 roadmap and locked 1.8 construction contract:

```text
Design system & visual foundation
```

In scope when authorized:

1. **Visual direction** — TNCOD-specific look (not generic starter aesthetics).
2. **Design tokens** — type scale, colour (primary, surface, success, warning, danger, text), spacing, radius, limited shadows; Tailwind + shadcn token approach (no parallel design system).
3. **Primitives** — expand the primitive set beyond the foundation Button where needed for later phases (Input, Select, Badge, Dialog, Card, Avatar, Table, etc.) as design-system building blocks, not product screens.
4. **Layout shells visual language** — Member / EXCO / Public shell structure from Phase 1.8, visually coherent, without building registration, profile editors, directory search, or EXCO dashboards as product workflows.
5. **Shared reliability UI patterns** — EmptyState, loading skeleton conventions, error copy patterns, toast conventions — as reusable patterns, not feature pages.
6. **Documentation** — Phase 5 gate report: tokens chosen, primitives shipped, shells shown, acceptance criteria, and explicit non-goals.

Authoritative references:

- `docs/architecture/component-system-architecture.md` (§1.8.5 tokens, §1.8.13 build order)
- `docs/ux/experience-principles.md`
- `docs/product/product-brief.md` (Phase 5 row)
- Existing foundation: Next.js App Router, Tailwind, shadcn Button, Lucide

---

## What Phase 5 is not

Do **not** treat Phase 5 GO as permission to build:

| Out of scope | Belongs to |
| --- | --- |
| Quick registration / record-first signup | Phase 6 |
| Passwordless login / magic link / OTP UI | Phase 7 |
| Profile completion / editors | Phase 8–9 |
| EXCO auth dashboard / queues | Phase 10 |
| Directory search / filters / publication UI | Phase 11–13 |
| Verification centre | Phase 12 |
| Spotlight | Phase 14 |
| Auth trigger redesign | Closed (Phase 4) |
| Schema / RLS redesign | Closed (Phases 2–3) unless genuine architecture defect |
| Signed URL subsystem | Later, when document viewing is implemented |
| Browser cookie login e2e | Phase 7 (carry-forward from Phase 4 caveat) |

Phase 5 may use **static / empty shells** and **story-like demos of primitives** only if they do not become product routes with real domain data.

---

## Carry-forward requirements (not Phase 5 work)

From Phase 4 evidence audit — track here; implement when the owning phase starts:

| Caveat | Owning phase / trigger |
| --- | --- |
| Browser cookie login round-trip | Phase 7 (Auth UI) |
| Signed document URLs | Document view / EXCO review UI |
| Seed users without Auth passwords | When Auth flows and seed are unified |
| Empty Auth email → `''` uniqueness | Phase 6–7 registration/Auth design |
| Storage HTTP denial status (observed 400) | Document access implementation; assert access outcome, not assumed 403 |

---

## Pre-GO checklist (human)

Before authorizing Phase 5 implementation, confirm:

- [ ] Phase 4 evidence audit accepted (`docs/architecture/phase-4-evidence-audit.md`)
- [ ] No intent to reopen Phase 2 schema or Phase 3 security for “polish”
- [ ] Phase 5 will remain **visual / primitive / shell** only (no Phase 6+)
- [ ] Brand / visual direction owner is available for review of token choices
- [ ] Explicit GO message will be issued in the instruction that starts coding

---

## Proposed execution order (only after GO)

```text
1. Read locked UX + 1.8 construction contract + this plan
2. Define / document visual direction and token map
3. Implement tokens in Tailwind / CSS variables
4. Expand primitives (narrow set needed for shells)
5. Apply visual language to Member / EXCO / Public shell scaffolds (no feature workflows)
6. Shared EmptyState / loading / error / toast patterns
7. Focused visual/smoke checks (no product e2e)
8. Phase 5 gate report + CHANGELOG
9. STOP — Phase 6 remains blocked until separate GO
```

---

## Acceptance criteria (draft for post-GO gate)

Phase 5 may be marked **PASS** only if:

1. Tokens and visual direction are documented and applied consistently.
2. Core primitives exist as design-system components (not one-off page markup).
3. Shells reflect Phase 1 IA without implementing product workflows.
4. No Phase 6–13 product features were built.
5. Frozen data/security invariants were not altered.
6. Phase 4 caveats were not falsely marked “done.”
7. A Phase 5 completion report exists with the same evidence vocabulary (CREATED / EXECUTED / PASSED / SKIPPED).

---

## Agent instruction template (paste when ready)

```text
PHASE 5 GO AUTHORIZED.

Read:
- docs/architecture/phase-5-authorization-plan.md
- docs/architecture/component-system-architecture.md
- docs/ux/experience-principles.md
- docs/architecture/phase-4-evidence-audit.md (carry-forward caveats only)

Execute Phase 5 — Design System and Visual Direction only.
Do not start Phase 6 or any product registration/login/profile/directory/EXCO workflow.
Do not reopen Phase 2 schema or Phase 3 security unless you find a genuine architecture contradiction — then STOP and report.
```

---

## Current instruction to agents

**Without** the GO message above:

```text
DO NOT START PHASE 5 IMPLEMENTATION.
```
