# Phase 5.11 — Member vs EXCO experience differentiation

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.10 **LOCKED** (actual execution numbering)

**Mode:** Audit + targeted refinement (not a new design-system invention phase).

Human gate: single-pass execution package authorized 2026-09-07. Do not reopen without cause.

Phase 5.12–5.14 and Phase 6 are **not** authorized by this document.

---

## 1. Phase purpose

Prove:

> **ONE PLATFORM LANGUAGE + TWO EXPERIENCE DENSITIES**

Member = lighter / friendlier / more spacious. EXCO = denser / operational / scannable. Same brand, tokens, typography, and shared primitives.

---

## 2. Authoritative principles

- Shared: palette, tokens, Inter, Button/Card/Surface/Badge/Status/forms/feedback, focus, radius, elevation  
- Differentiated by: composition, density tokens, nav structure, chrome padding, content grouping  
- Forbidden: MemberButton/ExcoCard forks, second palette, Auth-as-chrome, product workflows  

---

## 3. Member experience definition

- Flat primary destinations (Dashboard, Profile, Opportunities, Settings)  
- Wider sidebar / more main padding  
- `Section density="member"` (32px section gap)  
- Fewer simultaneous actions; clearer primary CTA in specimens  
- Community-oriented framing (“what matters next”)  

---

## 4. EXCO experience definition

- Grouped operational nav (Overview / Manage / Workflows / Insights / System)  
- Narrower sidebar / tighter header & main padding  
- `Section density="exco"` (16px section gap)  
- Metadata + multiple status chips coexisting in specimens  
- Workspace framing — not a generic admin skin  

---

## 5. Shared platform language

Verified: both shells use BrandLogo, Button, Surface, Alert, StatusBadge, Separator, NavigationDrawer, SkipLink, same focus rings and semantic colours. No Member*/Exco* primitive forks.

---

## 6. Differentiation mechanisms

| Mechanism | Member | EXCO |
| --- | --- | --- |
| Shell `data-density` | member | exco |
| Main padding | `py-6` / `lg:py-8` | `py-4` / `lg:py-5` |
| Sidebar width | `w-56` | `w-52` |
| Nav | Flat 4 items | Grouped 7 destinations |
| NavLink density | member | exco |
| Content Section | `density="member"` | `density="exco"` |
| Breadcrumbs | Not default | Optional on deep specimens |

Density tokens (Phase 5.4, unchanged):

```text
member section/group/stack: 32 / 24 / 16 px
exco section/group/stack:   16 / 12 /  8 px
```

---

## 7. Audit findings

| Area | Classification | Notes |
| --- | --- | --- |
| Shell composition | **PASS WITH EVIDENCE** | Distinct chrome already from 5.10 |
| Navigation density | **PASS WITH EVIDENCE** | 4 vs 7 grouped destinations |
| Page density hooks | **PASS WITH EVIDENCE** | Section member/exco tokens |
| Content composition in showcase | **TARGETED FIX** | Specimen content now uses Section density + Member/EXCO framing |
| Measurable shell markers | **TARGETED FIX** | `data-shell`, `data-density`, `data-shell-main` |
| Component consistency | **PASS** | No forks |
| Visual identity (adversarial) | **PASS** | Not social-app / not generic admin skin at chrome level |
| One platform test | **PASS** | Shared primitives |
| Responsive | **PASS WITH EVIDENCE** | 320–1280 Playwright |
| Accessibility preserved | **PASS WITH EVIDENCE** | Drawer Escape, skip, aria-current intact |
| Table readiness | **DEFERRED** | Contextual to product list phases |
| Product screens | **OUT OF SCOPE** | Not built |

---

## 8. Changes made

- `MemberShell` / `ExcoShell` / `PublicShell`: audit `data-*` attributes  
- `shell-showcase.tsx`: density-aware Member vs EXCO specimen content  
- `member-exco-density.test.tsx`, `e2e/phase-5-11-browser-evidence.spec.ts`  
- This document + governance updates  

**Not changed:** tokens, typography, core primitives, Auth/DB/RLS/API, routes, IA destinations.

---

## 9. Validation evidence

Local gate (2026-09-07):

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS (pre-existing unused `cn` in `control-styles.ts`) |
| Vitest | 31/31 PASS |
| `next build` | PASS |
| Browser readiness | PASS |
| Playwright 5.11 + smoke (focused) | 11/11 PASS |
| Playwright 5.10 + 5.11 + smoke (focused regression) | **19/19 PASS** |
| Responsive 320–1280 | PASS (Member + EXCO shell overflow) |
| Density metrics | Member main padding & section gap **>** EXCO; EXCO nav count **>** Member |

### Regression note (not a Phase 5.11 product/design failure)

**Initial full Playwright suite run: FAILED** due to a **stale Phase 5.10 selector** after an intentional 5.11 showcase label change (`Simulate professional record` → `Open specimen`). Selector corrected. Focused regression suite subsequently passed **19/19**. No unresolved regression remained. Cascade connection errors after the timeout are infrastructure fallout from that stale selector, not accessibility or density defects.

---

## 10. Responsive evidence

Member and EXCO shells overflow-checked at 320 / 375 / 390 / 430 / 768 / 1024 / 1280. Mobile drawers Escape-tested for both.

---

## 11. Accessibility observations

Skip link, landmarks, `aria-current`, drawer modality, focus rings unchanged. Density not achieved by shrinking body text below 16px or colour-only cues.

---

## 12. Architectural boundary verification

No schema, Auth, RLS, Storage, API, or security model changes. Navigation remains presentational.

---

## 13. Deferred / contextual

Tables, search/filter, pagination, upload, product dashboards — later owning phases. Formal Phase 5.12 accessibility consolidation and 5.13–5.14 gates remain separate.

---

## 14. Roadmap crosswalk

| Original roadmap | Actual execution |
| --- | --- |
| 5.7 Navigation | Actual Phase 5.10 |
| 5.8 Forms | Actual Phase 5.7 |
| 5.9 Feedback | Actual Phase 5.8 |
| 5.10 Responsive | Across 5.4 / 5.5 / 5.8 / 5.10 (+ continued evidence) |
| **5.11 Member vs EXCO** | **This phase** |
| 5.12 Accessibility | Not started |
| 5.13 Component validation | Not started |
| 5.14 Phase 5 evidence audit | Not started |

Note: An earlier post–5.10 “readiness” note arguing against any 5.11 was **superseded** by human authorization of roadmap Phase 5.11 as this audit/refinement gate.

---

## 15. Final decision

```text
PHASE 5.11: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.12: NOT AUTHORIZED
PHASE 5.13: NOT AUTHORIZED
PHASE 5.14: NOT AUTHORIZED
PHASE 6: NOT AUTHORIZED
```
