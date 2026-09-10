# Phase 5.5 — Core components

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.4 **LOCKED**

Phase 5.5 establishes **reusable core UI components only**.

Product-specific components and workflows are **not** implemented in this phase.

Verification environment: see `docs/architecture/verification-environment.md`.

---

## 1. Purpose

Define the fundamental visual building blocks of TNCOD Professionals so later phases can compose navigation, forms, profiles, directories, and operational surfaces consistently — without building those experiences now.

---

## 2. Phase boundary

| In scope | Out of scope |
| --- | --- |
| Button, Surface, Card, Badge, Avatar, Separator | Forms (5.8), navigation (5.7), status systems (5.6) |
| Fundamental interaction states | Toasts, alerts, dialogs (5.9) |
| Design-system laboratory demos | Dashboards, profiles, directory, auth, EXCO screens |

---

## 3. Core component philosophy

```text
REUSABLE PRIMITIVES
+
COMPONENT CONTRACTS
+
VISUAL CONSISTENCY
```

Components consume locked tokens and layout primitives. They do not invent a parallel visual system. One shared component set for Member and EXCO — density remains a layout concern.

---

## 4. Existing foundation dependencies

| Phase | Contribution |
| --- | --- |
| 5.1 | Visual character (professional, calm, restrained) |
| 5.2 | Colour, spacing, radius, elevation tokens |
| 5.3 | Typography utilities (`.text-label`, `.text-h4`, …) |
| 5.4 | `PageFrame`, `Container`, `Section`, `Stack`, `Grid` |

---

## 5. Component inventory

| Component | Path | Role |
| --- | --- | --- |
| Button | `src/components/ui/button.tsx` | Primary interactive control |
| Surface | `src/components/ui/surface.tsx` | Low-level plane |
| Card | `src/components/ui/card.tsx` | Meaningful content boundary |
| Badge | `src/components/ui/badge.tsx` | Presentational metadata chip |
| Avatar | `src/components/ui/avatar.tsx` | Image / initials identity mark |
| Separator | `src/components/ui/separator.tsx` | Visual divider |
| BrandLogo | `src/components/brand/logo.tsx` | Preserved (not redesigned) |

Barrel: `src/components/ui/index.ts`.

---

## 6. Button

Refined existing Button; not duplicated.

**Core variants:** `default` (primary), `secondary` (uses `secondary-solid`), `outline`, `ghost`.

**Preserved token-backed extras:** `destructive` (danger fill), `link` (link tokens). Not workflow patterns.

**Sizes:** `sm` · `default` · `lg` — shared across Member/EXCO; no tiny EXCO buttons.

**States:** default, hover, focus-visible, disabled.

---

## 7. Card / Surface

```text
PAGE BACKGROUND (canvas)
  → SURFACE (plane)
    → CARD (structured boundary)
      → CONTENT
```

- **Surface:** tone `default` | `muted` | `subtle`; optional border; elevation `none` | `subtle` | `default`.
- **Card:** Surface with padding, subtle elevation, and composition slots: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

Do **not** create ProfileCard, DirectoryCard, OpportunityCard, etc.

Do not wrap every text block in a Card.

---

## 8. Badge

Presentational variants: `muted` (default), `default`, `secondary`, `outline`, `accent`.

**Not** a verification/approval/workflow status system. That is Phase 5.6.

---

## 9. Avatar

Sizes: `sm` · `md` · `lg`. Supports `src` image or `fallback` initials. No upload, storage, or identity workflows.

---

## 10. Separator

Horizontal (default) or vertical. Prefer Phase 5.4 spacing when a line is unnecessary.

---

## 11. Surface hierarchy

| Level | Token / usage |
| --- | --- |
| Canvas | `--background` / page |
| Primary surface | `--surface` |
| Secondary / nested | `--surface-muted`, `--surface-subtle` |
| Interactive control | primary / secondary-solid / outline / ghost Button tokens |

No additional surface colours invented in this phase.

---

## 12. Component composition

Conceptual pattern (showcase only):

```text
PageFrame
└── Container
    └── Section
        └── Card
            └── Stack / Avatar / Badge / Button / Separator
```

---

## 13. Interaction states

Intrinsic only: default, hover, focus-visible, active (browser), disabled.

Deferred: loading, async feedback, validation, empty states (5.9 / 5.8).

---

## 14. Focus and keyboard

- Visible `focus-visible` ring using `--ring`
- Native `<button>` / semantic elements
- Disabled: non-interactive + reduced opacity
- Avatar uses `role="img"` + `aria-label`

---

## 15. Member / EXCO consistency

No MemberButton / EXCOCard duplicates. Density via Phase 5.4 layout composition around shared components.

---

## 16. Component API principles

Minimal props. No speculative `mode` / `context` / `status` / `intent` APIs. Prefer composition over configuration.

---

## 17. Token usage

Components use semantic Tailwind utilities (`bg-primary`, `text-muted-foreground`, `shadow-subtle`, `rounded-md`, type utilities). No parallel colour/spacing/type systems. **No new design tokens** added in Phase 5.5.

---

## 18. Anti-patterns

- Product-named cards or buttons
- Status-encoded badges
- Form or navigation components smuggled in
- Arbitrary hex / px in components
- Excessive nesting of Surfaces/Cards
- Decorative icon systems
- Glassmorphism / gradient chrome without token justification

---

## 19. Deferred work

| Phase | Deferred |
| --- | --- |
| 5.6 | Data & status patterns |
| 5.7 | Navigation |
| 5.8 | Forms (Input, Select, …) |
| 5.9 | Feedback (Toast, Alert, Dialog, …) |
| 5.10 | Detailed responsive behaviour |
| 5.11 | Member vs EXCO experience composition |
| 5.12 | Full accessibility audit |
| 5.13 | Component validation gate |
| 5.14 | Final Phase 5 evidence audit |

---

## 20. Accessibility considerations

Foundation-level only. Phase 5.12 remains the comprehensive a11y gate. Interaction targets use `h-8`–`h-10` (not tiny). Overflow policy from 5.4 still applies: fix causes; do not rely on clipping to hide defects.

---

## 21. Design-system showcase

`/design-system` — **Core components** section. `robots: noindex`. Laboratory, not product prototype.

---

## 22. Validation

Local gate runs (2026-09-07): TypeScript PASS · ESLint PASS · Vitest 9/9 PASS · `next build` PASS · Playwright request smoke PASS.

Verification remediation (2026-09-07): Chromium installed to project `.cache/ms-playwright` via `npm run test:e2e:install`. Browser readiness PASS. Phase 5.5 browser evidence PASS (overflow 320–1280, wrap, focus-visible, disabled, routes). See `docs/architecture/verification-environment.md`.

---

## 23. Relationship to 5.1–5.4

Composes visual direction, tokens, typography, and layout. Does not reopen or redesign them.

---

## 24. Explicit Phase 5.6+ boundary

```text
PHASE 5.5: core UI primitives only
PHASE 5.6+: NOT AUTHORIZED from this phase
```
