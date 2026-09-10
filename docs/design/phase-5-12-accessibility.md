# Phase 5.12 — Accessibility audit + targeted remediation

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.11 **LOCKED**

**Mode:** Evidence-driven accessibility audit and targeted remediation. Not redesign. Not WCAG certification.

Phase 5.13–5.14 and Phase 6 are **not** authorized by this document.

---

## 1. Phase objective

Prove the locked Phase 5 foundation is demonstrably operable for keyboard users, has coherent semantics, preserves focus language, respects contrast token rules, works across 320–1280, and respects reduced motion — without inventing a second accessibility system.

---

## 2. Governance state (at lock)

```text
PHASE 5.1–5.11 — LOCKED
PHASE 5.12 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.13 — NOT AUTHORIZED
PHASE 5.14 — NOT AUTHORIZED
PHASE 6 — NOT AUTHORIZED
```

---

## 3. Scope

In: UI primitives, layout primitives, shells/navigation, forms, feedback, showcase surfaces, existing tests.

Out: product screens, Auth/DB/RLS/API, new libraries, visual redesign, Member/EXCO forks, 5.13–5.14, Phase 6.

---

## 4. Accessibility principles

- Native HTML before ARIA  
- Shared a11y across Member/EXCO densities  
- Colour reinforces; text/structure carry meaning  
- Locked brand tokens (Sky Blue / Gold not used as ordinary body text)  
- Honest limits: no claimed screen-reader session or WCAG certificate  

---

## 5. Audit matrix (summary)

| Area | Result | Evidence class |
| --- | --- | --- |
| Keyboard | PASS | Proven (Playwright) |
| Focus-visible | PASS | Proven + inspection |
| Skip link | PASS | Proven |
| Landmarks / named nav | PASS | Proven + DOM |
| Form labels / required / errors | PASS (+ aria-required remediation) | Proven |
| Dialog / drawer | PASS | Proven |
| Account menu | PASS (remediated) | Proven |
| Toast live region | PASS | Proven |
| Alert / status text | PASS | Proven |
| Contrast token usage | PASS | Inspection |
| Responsive 320–1280 | PASS | Proven |
| Reduced motion | PASS | Proven (emulated) |
| Logo in labeled controls | PASS (remediated empty alt) | Proven |
| Zoom | LIMITED | Not fully automated — see limitations |
| Real screen reader | NOT TESTED | Environment |

---

## 6–8. Findings & severity

| Severity | Finding | Status |
| --- | --- | --- |
| P2 | Account menu used `role="menu"` without `menuitem`; Escape did not restore focus to trigger | **Fixed** |
| P2 | Brand logo inside labeled shell buttons also exposed image alt → dual naming | **Fixed** (`alt=""`) |
| P3 | Explicit `aria-required` not set alongside native `required` | **Fixed** (Input/Textarea/Select/Checkbox) |
| P3 | Native checkbox visual hit area is 16×16 (label expands target in Field inline) | **Deferred** as accepted native pattern |
| P3 | Full-page Tab order on `/design-system` starts in page chrome before shell skip link | **Deferred** (fixture page structure; skip works inside shells) |

```text
P0: 0
P1: 0
P2: 0 open (2 fixed)
P3: 2 deferred / accepted
```

**Material defects requiring remediation were found and fixed.** No open P0–P2 remain.

---

## 9. Remediations

1. **AccountMenu** — `role="menuitem"`, `aria-controls`, focus first item on open, Escape/close restores focus to trigger.  
2. **Shell BrandLogo** — `alt=""` when parent button already provides the accessible name.  
3. **Form controls** — `aria-required` when Field/control is required.  
4. **NavLink** — optional `role` prop for menu composition.  

---

## 10. Files changed

- `src/components/shell/account-menu.tsx`  
- `src/components/shell/nav-link.tsx`  
- `src/components/shell/{public,member,exco}-shell.tsx`  
- `src/components/ui/{input,textarea,select,checkbox}.tsx`  
- `src/components/ui/field.test.tsx`  
- `e2e/phase-5-12-browser-evidence.spec.ts`  
- `src/components/ui/control-styles.ts` (unused import cleanup for clean ESLint gate)  
- Docs/governance: this file, authorization plan, Cursor rule, README, CHANGELOG, home status, package description, smoke assertion  

---

## 11–22. Validation evidence (executed 2026-09-07)

| Check | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | **PASS** |
| ESLint | **PASS** (0 errors; unused import removed in `control-styles.ts`) |
| Vitest | **31/31 PASS** |
| Production build | **PASS** |
| Browser readiness | **2/2 PASS** |
| Playwright Phase 5.12 | **10/10 PASS** (7 widths + keyboard/forms/dialog/toast + drawer + reduced motion) |
| Playwright Phase 5.10 regression | **8/8 PASS** |
| Playwright Phase 5.11 regression | **8/8 PASS** |
| Smoke | **3/3 PASS** |
| Focused Playwright total (5.10+5.11+5.12+smoke) | **29/29 PASS** |

Widths proven: **320, 375, 390, 430, 768, 1024, 1280** (overflow + shell/a11y fixtures).

### Contrast / tokens

Inspection: no Sky Blue/Gold as ordinary body text; status/feedback use semantic text + muted backgrounds; focus uses `--ring` (Sky) as ring only.

### Reduced motion

Playwright `emulateMedia({ reducedMotion: "reduce" })` — dialog still opens/closes via Escape.

---

## 23. Limitations (honest)

- No VoiceOver/NVDA/JAWS session in this environment.  
- No formal WCAG certification claim.  
- Browser zoom not exhaustively automated (layout uses relative tokens; zoom left as future product QA).  
- Showcase page is dense laboratory chrome — not a product page Tab-order model.  

---

## 24. Adversarial audit

| Question | Answer |
| --- | --- |
| Keyboard-only showcase/shells? | Yes for shells, forms, dialogs, drawers, account menu (proven) |
| Focus traps / invisible focus? | No material trap found; focus language preserved |
| Forms without colour/placeholder? | Labels + errors + aria-required/invalid |
| Nav location? | `aria-current="page"` + weight |
| Mobile drawer? | Native dialog Escape/focus |
| Colour-blind status? | Text labels on StatusBadge/Alert |
| Contrast misuse? | No brand anti-patterns found in components |
| ARIA vs HTML? | Native dialog/forms preferred; menu roles added where needed |
| 320px? | Overflow + drawer tested |
| Member/EXCO forks? | None introduced |
| Scope creep? | No product UI / Auth / DB |
| Evidence honesty? | Limitations stated |

---

## 25–26. Final decision

```text
PHASE 5.12: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.13: NOT AUTHORIZED
PHASE 5.14: NOT AUTHORIZED
PHASE 6: NOT AUTHORIZED
```

---

## 27. Deferred issues

- Checkbox 16px visual box (label expands hit area) — P3  
- Design-system page Tab order before shell skip — P3 fixture  
- Automated axe/lighthouse dependency — not added (no justification)  
- Real AT testing — product QA later  
