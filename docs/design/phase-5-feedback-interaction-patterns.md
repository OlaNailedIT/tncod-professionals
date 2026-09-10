# Phase 5.8 — Feedback, interaction & transient UI patterns

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.7 **LOCKED**

Phase 5.8 establishes the reusable visual and interaction language for progress, completion, failure, waiting, emptiness, confirmation, and brief notifications. It does **not** implement product screens or workflows.

Human gate (2026-09-07): independent adversarial review accepted implementation, semantic integrity, a11y, responsive, browser evidence, and scope. Do not reopen.

Phase 5.9 is **not** authorized. Remaining design-system gaps must be assessed before any 5.9 scope is issued.

---

## 1. Purpose

Answer: how does TNCOD Professionals communicate when something is happening, finished, failed, empty, or consequential — before real product UI is built.

Tone: professional, calm, trustworthy, human, practical, accessible, restrained.

---

## 2. Scope

| In | Out |
| --- | --- |
| Alert, Spinner, Skeleton, Progress, EmptyState, Dialog, ToastProvider | Product routes (registration, profile, directory, EXCO, etc.) |
| Button `loading` processing state | Navigation / shells redesign |
| Generic `/design-system` specimens | API, Auth, DB, RLS, Storage changes |
| Semantic intents reused from Phase 5.2/5.6 | Motion design system (Phase 5.9) |
| Native `<dialog>` + lightweight toast live region | Notification/dialog libraries |

---

## 3. Component inventory

| Component | Responsibility |
| --- | --- |
| `Alert` | Persistent semantic notice (`neutral` / `info` / `success` / `warning` / `danger`). Default `role="status"`; `role="alert"` for urgent dynamic errors. |
| `Spinner` | Indeterminate loading; `role="status"` + accessible label; `motion-safe:animate-spin`. |
| `Skeleton` | Layout-preserving placeholder; decorative (`aria-hidden`); `motion-safe:animate-pulse`. |
| `Progress` | Determinate progress bar (`role="progressbar"`). |
| `EmptyState` | Absence of content (heading + explanation + optional action). Not an error. |
| `Dialog` | Native modal confirmation; ordinary vs destructive (`tone`). Explicit action labels. |
| `ToastProvider` / `useToast` | Brief non-blocking feedback via `aria-live="polite"`; auto-dismiss; max ~3 visible. |
| `Button` (+`loading`) | Processing state: `aria-busy`, disabled, spinner; preserves label/dimensions. |

Composition: EmptyState / Dialog / Toast reuse `Button`, Surface tokens, typography utilities, Phase 5.2 semantic colours. No Member/EXCO component forks — density remains Phase 5.4.

---

## 4. Semantic model

Feedback intents reuse `StatusIntent`:

```text
neutral | info | success | warning | danger
```

**Feedback ≠ domain status.** Phase 5.6 remains authoritative for Profile / Verification / Visibility / Business / Opportunity / Document status meaning.

Do not use feedback alerts as substitutes for StatusBadge. Do not collapse:

```text
Profile ≠ Verification ≠ Directory
PRIVATE ≠ REJECTED
VERIFIED ≠ DIRECTORY
```

Colour reinforces meaning; text and structure carry it. Gold is not a warning colour.

---

## 5. Feedback & messaging rules

- Human, concise, specific: what happened, whether anything completed, what to do next.
- Avoid vague copy (“Something went wrong”, “Success!”).
- No SQL, stack traces, internal IDs, or security-sensitive detail in user-facing specimens.
- Form field validation remains Phase 5.7 (`Field` + `role="alert"`).

---

## 6. Loading rules

- Prefer local/section indicators over full-page spinners.
- Skeletons only where layout continuity helps.
- Button loading prevents duplicate activation and keeps label visible.
- Determinate Progress when percent is meaningful; Spinner when duration is unknown.

---

## 7. Error / recovery rules

| Kind | Pattern |
| --- | --- |
| User-correctable | Inline / Field error (5.7) or Alert with corrective guidance |
| Recoverable system | Alert or toast + retry guidance; state completion clarity |
| Consequential failure | Explicit whether action completed / partial / not completed |

Do not imply retry safety or invent backend behaviour.

---

## 8. Empty-state rules

Empty ≠ error. Distinguish no content yet, no results, unavailable, action required — with heading, short explanation, optional action. No giant illustrations or product-specific empty screens in this phase.

---

## 9. Dialog rules

- Clear title, concise body, explicit actions.
- Destructive confirmations use `tone="destructive"` and explicit labels (`Remove` / `Keep`), not vague `Continue` / `Okay`.
- Native `<dialog>` provides modal behaviour, Escape, backdrop, and focus restoration.
- No product deletion workflows.

---

## 10. Notification rules

Toasts: brief confirmation / lightweight operational feedback only.

Not for: critical errors requiring attention, complex instructions, destructive confirmation, essential validation.

Live region: `aria-live="polite"`. Auto-dismiss ~5s. Cap stacking.

---

## 11. Accessibility

- Prefer native semantics (`dialog`, `progressbar`, `status` / `alert`).
- Visible focus rings preserved.
- Colour is not the sole carrier of meaning.
- `prefers-reduced-motion` via `motion-safe:` / `motion-reduce:` utilities on spin/pulse/progress width transition.
- Keyboard: dialog Escape; toast Dismiss; buttons focusable.

---

## 12. Motion

Functional only (spinner, pulse skeleton, progress width, dialog browser animation). No bounce, parallax, or decorative micro-interaction system. Phase 5.9 motion expansion is out of scope.

---

## 13. Responsive

Patterns must remain usable and overflow-free at 320–1280px. Dialog width `min(100%-2rem, 28rem)`; toast `min(100%-2rem, 22rem)`; actions wrap.

---

## 14. Dependency decisions

**No new dependencies.** Native `<dialog>`, React state for toasts, existing CVA/Slot/Button. No animation or toast libraries.

---

## 15. Explicit non-goals

- Product screens and workflows
- Navigation / dashboard shells
- Global app notification architecture beyond design-system ToastProvider
- Phase 5.9 motion/interaction expansion
- DB / Auth / RLS / Storage / API changes

---

## 16. Files

| Path | Role |
| --- | --- |
| `src/components/ui/alert.tsx` | Alert |
| `src/components/ui/spinner.tsx` | Spinner |
| `src/components/ui/skeleton.tsx` | Skeleton |
| `src/components/ui/progress.tsx` | Progress |
| `src/components/ui/empty-state.tsx` | EmptyState |
| `src/components/ui/dialog.tsx` | Dialog |
| `src/components/ui/toast.tsx` | Toast |
| `src/components/ui/button.tsx` | +`loading` |
| `src/components/design-system/feedback-showcase.tsx` | Showcase |
| `src/components/ui/feedback.test.tsx` | Unit tests |
| `e2e/phase-5-8-browser-evidence.spec.ts` | Browser evidence |

---

## 17. Validation

Local gate (2026-09-07):

| Step | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS (pre-existing warning in `control-styles.ts` unused `cn` only) |
| Vitest | 25/25 PASS |
| `next build` | PASS |
| Browser readiness | PASS |
| Playwright | 37/37 PASS (incl. Phase 5.8 overflow 320–1280 + dialog/toast interaction) |

---

## 18. Known limitations (non-blocking; accepted at lock)

- ToastProvider is showcase-oriented / opt-in; product pages must mount it intentionally later — not a global app shell (**future integration decision**).
- Native dialog focus trap depends on browser support (Chromium verification covered).
- Button `loading` ignores `asChild` while processing (real button required for spinner + label) (**non-blocking API constraint**).
- No indefinite toast persistence; critical info must not rely on toasts alone.
- Pre-existing ESLint unused-`cn` warning in `control-styles.ts` is repository hygiene, unrelated to 5.8.

---

## 19. Gate

```text
PHASE 5.8: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.9: NOT AUTHORIZED
```
