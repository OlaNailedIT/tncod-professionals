# Phase 5.10 — Application shell & navigation foundation

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.9 **LOCKED**

Phase 5.10 establishes shared Public / Member / EXCO application chrome so product screens do not invent navigation independently. It does **not** implement product workflows.

Human gate (2026-09-07): independent review accepted implementation, a11y, responsive, browser evidence, and scope. Do not reopen.

Phase 5.11 is **not** authorized. Next work requires a separate gap decision — do not assume the roadmap.

---

## 1. Purpose

Cross-route structural UI for:

```text
PUBLIC → MEMBER → EXCO
```

One platform language + two densities (Member spacious / EXCO denser). Navigation is presentational — it does not grant privilege.

---

## 2. Architectural rationale

Phase 5.9 (LOCKED) found shells/navigation as the only foundational pre-product DS gap. Tables, filters, upload, etc. remain deferred.

---

## 3. Shells

| Context | Structure | Density |
| --- | --- | --- |
| Public | Header + main + light footer; mobile drawer | Light |
| Member | Desktop sidebar + header; mobile drawer + account | Spacious |
| EXCO | Desktop sidebar (grouped) + workspace header; mobile drawer; optional breadcrumbs | Dense |

Composition:

```text
SkipLink → Shell chrome → main#main-content → Phase 5.4 layout (Container / Stack / …)
```

---

## 4. Navigation model

Config in `nav-config.ts` mirrors locked Phase 1 destinations only.

Active matching (`isNavActive`):

- `/` and `/exco` exact
- Nested paths keep parent active
- `/profile/edit` keeps Profile active

Showcase uses `mode="button"` + local pathname so product routes are not hit.

---

## 5. Account control

Presentational `AccountMenu` (Profile / Settings / Sign out destinations listed). **No Auth, sessions, or role queries.**

---

## 6. Breadcrumbs

Optional `Breadcrumbs` for deeper EXCO orientation. Not on every page. Specimen-only data.

---

## 7. Accessibility

- Landmarks: `header`, `nav`, `main`, `footer` / `aside`
- Skip link → `#main-content`
- `aria-current="page"` + weight for active (not colour alone)
- Focus rings preserved
- Mobile drawer: native `<dialog>` (Escape, backdrop, focus) — Phase 5.8 modality pattern
- Account menu: Escape + outside click

---

## 8. Responsive model

| Width | Behaviour |
| --- | --- |
| &lt; lg | Header + Menu → drawer |
| ≥ lg | Persistent sidebar (Member/EXCO); Public horizontal nav |

Verified at 320–1280 in Playwright.

---

## 9. Component inventory

| Component | Role |
| --- | --- |
| `AppShell` | Context switcher |
| `PublicShell` / `MemberShell` / `ExcoShell` | Context chrome |
| `NavLink` | Item + active state |
| `NavigationDrawer` | Mobile nav dialog |
| `AccountMenu` | Account affordance |
| `Breadcrumbs` | Optional trail |
| `SkipLink` | Skip to content |
| `isNavActive` / `nav-config` | Matching + destinations |

No MemberButton / ExcoCard forks. Reuses Button, Separator, BrandLogo, Container, Alert, Surface.

---

## 10. Dependencies

**None added.** Native dialog + React state.

---

## 11. Explicit non-goals

Product dashboards/profiles/directory/verification; Auth; tables; search/filter kits; tooltip libraries; DB/API/RLS.

---

## 12. Validation

Local gate (2026-09-07):

| Step | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS (pre-existing unused `cn` in `control-styles.ts`) |
| Vitest | 28/28 PASS |
| `next build` | PASS |
| Browser readiness | PASS |
| Playwright | 45/45 PASS (incl. Phase 5.10 overflow 320–1280 + shell interaction) |

---

## 13. Known limitations (non-blocking; accepted at lock)

- Showcase pathname is local state (intentional).
- Account “Sign out” is a destination label only — correct until Auth/product phases (**accepted**).
- Shell specimens use button mode rather than real product routes (**accepted** — avoids pretending product routes exist).
- Desktop Member account lives in sidebar footer; mobile in header.
- Pre-existing `control-styles.ts` unused `cn` warning unchanged.

---

## 14. Gate

```text
PHASE 5.10: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.11: NOT AUTHORIZED
```
