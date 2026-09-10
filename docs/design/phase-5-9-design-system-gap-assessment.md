# Phase 5.9 — Design-system gap assessment & product-readiness gate

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Mode:** READ-ONLY assessment (no implementation)  
**Depends on:** Phase 5.1–5.8 **LOCKED**; Phases 0–4 authoritative product/architecture

Human gate (2026-09-07): independent review accepted OPTION B. Do not reopen the assessment.

**Finding (locked):** Foundational gap = Application shells & navigation chrome. Deferred (contextual/speculative): tables, search/filter, pagination, tabs, upload, date/time, tooltip/overlay ecosystems, complex workflow abstractions.

This document does **not** authorize product UI. Shell implementation is Phase 5.10 (separate authorization).

---

## 1. Purpose

Answer:

> Is the current TNCOD Professionals design-system foundation sufficiently complete to safely begin building real product UI, or is there a genuinely necessary design-system layer that must be established first?

Do not assume another 5.x phase is required. Do not assume product UI is ready. Do not resurrect old roadmap numbering without product evidence.

---

## 2. Inputs reviewed

### Product / architecture (locked)

- Phase 0 product architecture (`docs/product/*`, `docs/architecture/system-overview.md`)
- Phase 1 UX/IA (`docs/ux/route-architecture.md`, `screen-inventory.md`, `navigation-architecture.md`, `component-system-architecture.md`)
- Phase 2 data architecture / DB gate
- Phase 3 security architecture
- Phase 4 technical foundation / runtime evidence
- Phase 5 authorization plan (`docs/architecture/phase-5-authorization-plan.md`)

### Locked design system

- 5.1 Visual direction · 5.2 Tokens · 5.3 Typography · 5.4 Layout · 5.5 Core components · 5.6 Data/status · 5.7 Forms · 5.8 Feedback

### Implementation inspected

- `src/components/ui/*` (36 component modules)
- `src/components/layout/*` (PageFrame, Container, Stack, Section, Grid)
- `src/components/brand/logo.tsx`
- `src/app/` routes: `/`, `/design-system`, health/session APIs only — **no product screens**
- `src/lib/status/*` presentations
- Design-system showcase at `/design-system`

Authority order applied: locked product/DB/security → locked Phase 5 → implementation → docs → roadmap assumptions.

---

## 3. Phase 5.1–5.8 coverage inventory

| Area | Classification | Evidence |
| --- | --- | --- |
| Visual language (brand, hierarchy, tone, Member/EXCO density) | **SUFFICIENT** | 5.1 locked palette/tone; 5.4 density tokens; showcase |
| Design tokens (colour, spacing, radius, elevation, focus, a11y) | **SUFFICIENT** | `globals.css` semantic tokens; 5.2 verified |
| Typography | **SUFFICIENT** | 5.3 scale/weights/loading; utilities in use |
| Layout (containers, gutters, grids, rhythm, responsive) | **SUFFICIENT** | layout primitives + overflow contract |
| Core components (Button, Surface, Card, Badge, Avatar, Separator) | **SUFFICIENT** | Implemented + evidenced |
| Data/status (StatusBadge/Field, Metadata, independent dimensions) | **SUFFICIENT** | 5.6 maps; Profile ≠ Verification ≠ Visibility preserved |
| Forms/input (Field through FormActions, validation a11y) | **SUFFICIENT** | 5.7 locked; Field tests |
| Feedback/interaction (Alert, loading, EmptyState, Dialog, Toast, etc.) | **SUFFICIENT** | 5.8 locked; Playwright evidence |
| Application shells / navigation chrome | **MISSING** (foundational) | Phase 1.5/1.8 + Phase 5 charter require Public/Member/EXCO shells; **no** Header/Sidebar/Drawer/Nav in `src/` |
| Operational tables / list workspaces | **PARTIALLY SUFFICIENT** | Density rules in 5.4; **no** Table primitive; EXCO lists need it later |
| Search / filter chrome | **UNNECESSARY TO PRE-BUILD** as a full DS phase | Required by product (directory/EXCO); pattern is Contextual to first list screen |
| Menus / popovers / tooltips | **PARTIALLY SUFFICIENT** | Dialog exists; Account menu needed with shells; generic dropdown kit is Speculative |
| Tabs / disclosure | **UNNECESSARY TO PRE-BUILD** | Editor/EXCO panels Contextual |
| File upload / date / multi-step wizards | **UNNECESSARY TO PRE-BUILD** | Domain/workflow Contextual or Speculative |

---

## 4. Product requirements mapped (19 screens — not built)

### Public

| Route | Needs from DS today | Gap? |
| --- | --- | --- |
| `/` | Brand, typography, layout, Button, Public shell | Shell missing |
| `/professionals` | Shell, list/results, search/filter, EmptyState, Status (projection only) | Shell; list/filter Contextual |
| `/professionals/[slug]` | Shell, Card/Surface, Metadata, Avatar, Empty/unavailable | Shell |
| `/register` | Shell, Field/Input, FormActions, Alert, Button loading | Shell |
| `/sign-in` | Shell, forms, feedback | Shell |

### Member

| Route | Needs | Gap? |
| --- | --- | --- |
| `/dashboard` | Member shell, Card, Alert, EmptyState, StatusField | Shell |
| `/profile` | Shell, status triad, Metadata, Avatar, Surface | Shell |
| `/profile/edit` | Shell, forms (5.7), Dialog unsaved, sections | Shell; section nav Contextual |
| `/opportunities` | Shell, forms/lists | Shell |
| `/settings` | Shell, forms | Shell |

### EXCO

| Route | Needs | Gap? |
| --- | --- | --- |
| `/exco` | EXCO shell, cards/metrics, Alert | Shell |
| `/exco/professionals` (+ businesses, verification, directory) | EXCO shell, **table/list**, search/filter URL state, StatusBadge, Empty/retry | Shell Foundational; Table/Filter Contextual to first workspace |
| Record detail routes | Shell, panels/tabs, StatusField triad, Dialog confirm, Toast | Shell; panels Contextual |
| Reports / settings | Shell, forms/filters | Shell |

**Distinction:** Absence of product screens is **not** a design-system defect. Absence of **shared chrome required by every screen** is.

---

## 5. Missing-foundation analysis

### A. Application shells & navigation chrome — FOUNDATIONAL

**Product evidence:** Phase 1.5 locks three environments; Phase 1.8.2 defines Public/Member/EXCO shells; Phase 5 authorization plan item 4 explicitly includes “Layout shells visual language.”

**Current coverage:** PageFrame/Container/Section only — page composition, **not** navigation chrome. Zero `Sidebar`/`Header`/`Drawer`/`Nav` implementations.

**Why not “wait for product” alone:** Without a shared shell language, Phases 6–13 each invent header/sidebar/active/mobile drawer patterns → density drift and visual inconsistency across 19 routes.

**Minimum future scope (if authorized):** Static scaffolds + `/design-system` specimens for Public header, Member header+drawer/sidebar, EXCO sidebar+workspace header, account menu affordance, active-state language, breadcrumb pattern, responsive behaviour. **No** Auth wiring, **no** product routes, **no** real queues/directories.

### B. Tables / EXCO data workspaces — CONTEXTUAL (near-term), not a blocking pre-product DS phase for first Member/Public screens

**Product evidence:** 1.8.9 Workspace → Search → Filters → DataTable; EXCO list screens.

**Coverage:** Spatial density rules exist; no Table primitive.

**Decision:** First product phases (6–9: register, access, profile) do **not** require DataTable. Standardise Table when authorizing first EXCO/list workspace (≈ Phase 10+) or as a narrow add-on then — not as a speculative “admin kit” now.

### C. Search / filters / URL state chrome — CONTEXTUAL

Locked behaviour (query = view state). Compose Input + Button + Badge + layout on first directory/EXCO list. Pre-building FilterBar/FilterChip systems now is premature abstraction.

### D. Dropdown / popover / tooltip kit — CONTEXTUAL / SPECULATIVE

Account menu belongs with shells. Full menu library without product actions is Speculative.

### E. Tabs / accordion — CONTEXTUAL

Profile editor sections and EXCO record panels: design with the screen.

### F. File upload, date/time, multi-step form engine — CONTEXTUAL / SPECULATIVE

Documents/verification later. Do not invent upload DS without Storage UX requirements.

### G. PermissionGate / route guards — APPLICATION LAYER (not DS gap)

Phase 1.8.11 — belongs with Auth/product phases; must not couple into presentational primitives.

### H. Global ToastProvider mount — FUTURE INTEGRATION (accepted 5.8)

Not a design-system gap; mount when app shell exists.

---

## 6. Decision matrix

| Candidate | Product evidence | Current coverage | Classification | Needed before product UI? | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Public / Member / EXCO shells + nav chrome | 1.5, 1.8.2, Phase 5 charter | Missing | **Foundational** | **Yes** (minimum) | Narrow DS phase or first product gate prerequisite |
| Account menu pattern | 1.5.4 | Missing | **Foundational** (with shells) | With shells | Include in shell phase |
| Breadcrumbs | 1.5.7 | Missing | **Foundational** (light) | With shells | Pattern + composition, not heavy component |
| DataTable | 1.8.9, EXCO lists | Density only | **Contextual** | No (for Phases 6–9) | When first list workspace authorized |
| Search/filter chrome | Directory + EXCO | Input exists | **Contextual** | No | With first list/directory screen |
| Dropdown/popover/tooltip suite | Common SaaS | Dialog only | **Speculative** / Contextual | No | Only as needed in product |
| Tabs / disclosure | Editor + EXCO panels | None | **Contextual** | No | With editor/record UI |
| File upload control | Documents | None | **Contextual** | No | Document/verification phase |
| Date/time inputs | Weak V1 evidence | None | **Speculative** | No | Do not pre-build |
| Multi-step form engine | Registration is Stage 1 only | Forms exist | **Speculative** | No | Compose FormSection |
| PermissionGate | 1.8.11 | Security lib exists | Application | N/A as DS | Product/Auth phase |
| Second colour/spacing system | None | Tokens locked | Speculative | No | Forbidden |
| Member-only / EXCO-only component forks | Density only | Shared primitives | Speculative | No | Forbidden |

---

## 7. Product-readiness hypothesis

### Could build cleanly today (after shells exist)

- `/register`, `/sign-in` (Public shell + 5.7/5.8)
- `/dashboard`, `/profile`, `/profile/edit` (Member shell + status + forms + feedback)
- `/professionals/[slug]` content composition (Card, Metadata, Avatar, Empty/unavailable)

### Would require contextual decisions (acceptable in product phase)

- Editor section switching (`?section=`)
- Dashboard first-time messaging (G)
- Directory result presentation (cards vs list)
- Exact mobile nav presentation (drawer vs bottom — destinations locked, visual OPEN in 1.5.8)

### Would force invention of shared language if started *without* shells

- Header, active nav, account affordance, EXCO sidebar, mobile drawer — **inconsistent across screens**

### First EXCO lists without a Table primitive

- Possible with composed Stack/Card/Metadata but higher inconsistency risk; Table still Contextual, not blocking Member/Public start

---

## 8. Accessibility readiness

| Foundation | Status |
| --- | --- |
| Focus-visible tokens | Ready (5.2/5.5) |
| Form label / describedby / alert | Ready (5.7) |
| Status text + intent (not colour-only) | Ready (5.6) |
| Dialog modal / Escape / focus return | Ready (5.8) |
| Live regions (toast) | Ready (opt-in provider) |
| Disabled / loading buttons | Ready |
| Reduced motion | Ready for introduced motion |
| Shell landmark / skip / nav keyboard | **Not yet** — emerges with shells |
| Table keyboard / sort headers | **N/A until Table** |

No foundational a11y redesign required before product UI **once shells are established with landmarks and keyboard nav**.

---

## 9. Responsive readiness

Locked layout + 5.5–5.8 Playwright evidence at 320–1280 for existing primitives: **ready as a substrate**.

Cannot meaningfully claim responsive PASS for EXCO tables, sidebars, or filter bars — those UIs do not exist yet. That is **not** a defect of 5.1–5.8.

Shell phase must include 320–1280 evidence for chrome wrapping, drawer usability, and no page overflow.

---

## 10. Architecture / security boundary

Design system remains presentation-oriented. 5.1–5.8 did not modify DB, Auth, RLS, Storage, or API contracts.

Proposed shell layer must remain **presentational scaffolds** (no Auth logic, no role checks embedded as JWT claims UI, no RLS coupling). Route protection and PermissionGate stay application/security layers.

Status semantics must continue: Profile ≠ Verification ≠ Directory; DIRECTORY ⇒ VERIFIED; PRIVATE ≠ REJECTED. Shells must not invent a fourth “nav status.”

---

## 11. Repository health (read-only)

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS with pre-existing warning: unused `cn` import in `src/components/ui/control-styles.ts` (hygiene; not introduced or fixed in this phase) |
| Vitest | 25/25 PASS |

No code was modified to obtain these results.

---

## 12. Adversarial audit

| Probe | Result |
| --- | --- |
| Scope creep / implementation? | No — docs-only assessment |
| Premature abstraction (every shadcn component)? | Rejected — Table/filter/menu kit not recommended as blocking DS phase |
| Product leakage as “DS requirement”? | Shells are cross-cutting chrome from locked IA, not disguised registration/profile |
| Architecture drift vs 0–4? | Aligns with 1.5/1.8 and Phase 5 charter item 4 |
| Semantic drift? | None recommended |
| Visual drift / new tokens? | None recommended |
| Density drift / Member vs EXCO forks? | Explicitly rejected |
| Accessibility foundational gap? | Only shell landmarks pending |
| Responsive foundational gap? | Substrate OK; product chrome untested because absent |
| Governance | No future phase authorized |

---

## 13. Recommendation

### OPTION B — LIMITED DESIGN-SYSTEM GAP

Phase 5.1–5.8 are **sufficient as a visual/interaction language** for composing product content.

**One genuine foundational gap remains before safe multi-screen product UI:** **Public / Member / EXCO application shells and navigation chrome** (including account menu affordance and light breadcrumb pattern).

Tables, search/filter systems, tabs, upload, and generic overlay kits are **not** justified as a broad additional DS programme before product start — they are Contextual to later owning product phases.

### Minimum scope if humans authorize a follow-on DS phase

```text
Application shells & navigation chrome only
— Public header + primary links
— Member header + primary destinations + account menu affordance + mobile drawer
— EXCO sidebar (desktop) + drawer (small) + workspace header pattern
— Active state language; breadcrumb composition pattern
— Density via existing 5.4 Section/layout (no forked components)
— /design-system specimens only; no product routes; no Auth/DB/API
```

**Do not** auto-name this “Phase 5.10” or “Phase 6.” Human governance chooses numbering and whether shells are a final 5.x phase vs the opening deliverable of product UI under explicit scope.

### Explicitly NOT recommended now

- Full DataTable + sort + pagination kit as a standalone DS mega-phase
- Filter/search framework
- Tooltip/dropdown library for its own sake
- Motion design expansion
- Product screens

---

## 14. Implementation boundary

```text
NO IMPLEMENTATION PERFORMED IN PHASE 5.9.
NO FUTURE PHASE AUTHORIZED BY THIS DOCUMENT.
```

Human decision next:

1. Authorize a **narrow shells/navigation** design-system phase, **or**
2. Transition to product UI with shells as the **first product-authorized deliverable**, **or**
3. (Rejected by this assessment) Broad “finish every missing component” DS phase.

---

## 15. Gate

```text
PHASE 5.9: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.10: Application Shell & Navigation Foundation (separate authorization)
PRODUCT UI: NOT AUTHORIZED BY THIS DOCUMENT
```
