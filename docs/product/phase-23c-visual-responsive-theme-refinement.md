# Phase 23C — Visual System, Responsive & Theme Refinement

**Status:** `IMPLEMENTATION COMPLETE` · `VERIFICATION INCOMPLETE` · `NOT LOCKED` (2026-09-16)  
**Prior claim:** Premature `LOCKED` after automated checks — **withdrawn**.  
**Gate:** Visual acceptance remediation + authentic image asset hunt — **AUTHORIZED**  
**Predecessor:** Phase 23B LOCKED; Phase 23 Controlled Pilot IN PROGRESS  
**Successor:** Phase 24+ **NOT AUTHORIZED**  
**Prior 23C deploy:** `dpl_73vBGkaHbikGEENHDW2e8RLen4b4`  
**Remediation deploy:** `dpl_vXW2NcPm7tZmkdPa1DdgHqeX54uX` → `https://tncod-professionals-azure.vercel.app` (READY)  
**Manual visual acceptance:** still required before LOCK

---

## Purpose

Correct remaining visual-quality defects after the first Phase 23C ship, and research authentic imagery — without changing product semantics, Auth, RLS, RBAC, directory, or privacy.

---

## Governance

```text
PHASE 5–13 / 18–22 / 23A / 23B — LOCKED
PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS
PHASE 23C — IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / NOT LOCKED
PHASE 24+ — NOT AUTHORIZED
```

---

## 1. Audit summary (visual defects found)

| Finding | Severity | Disposition |
| --- | --- | --- |
| Premature LOCK on Playwright alone | P1 (process) | Withdrawn; manual gate restored |
| Hero/mid imagery AI-generated / drab / commercial-banner candidate | P2 | Replaced with Unsplash License photos after research |
| Phone header overflow @ 320 (logo + theme + Join + Menu) | P2 | Compact logo, short theme labels, tighter gaps; mark-only &lt;sm |
| Content touching viewport edges (Container lacked gutters) | P1 | `.layout-container` now pads with `--layout-page-gutter`; phone gutter ≥1.25rem |
| Duplicate hero logo under header logo | P2 | Removed hero lockup — brand only in header |
| Images felt “pasted” as bordered cards | P2 | Full-bleed phone hero band; editorial panels without card chrome; ambient participation section |
| Theme control lived in footer (competed less with CTAs but not top-level) | P2 | Header cycle button across shells |
| CTA labels used long “Join the Professionals community” | P2 | Locked to `Join` / `Sign In` |
| Public shell `wide` vs landing `standard` misalignment | P2 | Shared `standard` container |
| Tablet hero treated as stacked phone until lg | P2 | Two-column from `md` |
| Official TNCOD/CoD reusable photography not found cleared | — | Documented; licensed alternative used |

---

## 2. Responsive remediation

**Phone:** tighter hero stack; compact header; Join always in header; Sign In via hero + Menu; theme short labels (`Sys`/`Lt`/`Dk`).  
**Tablet/iPad:** two-column hero + belonging section from `md`; shared gutters.  
**Desktop:** intentional max-width via `layout-container-standard`; not full-bleed stretch.

Automated overflow widths: 320, 375, 390, 430, 768, 834, 1024, 1280, 1440 — **PASS** (Playwright).

---

## 3. Spacing / alignment

Stepped `--layout-hero-pad-y` / `--layout-section-pad-y`; reduced phone gaps; header/content/footer share `Container width="standard"`.

---

## 4. Navigation / header

Logo · Home/Professionals (md+) · ThemeToggle · Join · Sign In (sm+) · Menu (md−).

---

## 5. Landing page

Journey retained: Welcome → Why → Belong pillars → Belonging image → How → Join. No fake stats/testimonials. Exact CTAs.

---

## 6. Image research (IMAGE-RESEARCH)

### Sources searched

| Source | Result |
| --- | --- |
| Public web: Triumphant Nation / TNCOD / City of David Ibadan | Directory listings; Enterprise Sunday / Business School / Strong Men Conference references |
| `triumphantassembly.org` | **502 Bad Gateway** — not usable as gallery |
| Instagram `@tn.cityofdavid` | Indexed worship/praise posts only; **not scraped**; church-service imagery unsuitable for Professionals hero |
| LinkedIn (third-party TNCOD Business School posts) | Visible; **third-party**; reuse **not cleared** |
| RCCG City of David Lagos / Abuja media | **Wrong organisation** — excluded |
| Unsplash License library | Shortlist generated; free commercial use under Unsplash License |

### Search limitations (honest)

- Facebook/Instagram **not exhaustively searched** (no private access; no scrape).
- No official TNCOD Professionals media library with clear reuse grant was found.
- Official church worship imagery rejected for product fit even where public.

### Shortlist

| ID | Asset | Communicates | Fit | Reuse | Decision |
| --- | --- | --- | --- | --- | --- |
| C1 | Annie Spratt — collaborative table (`MChSQHxGZrQ`) | Warm shared work | Strong | Unsplash License **CLEARED** | **Hero** |
| C2 | Headway — conversation/gesture (`5QgIuuBxKwM`) | Mentorship / connection | Strong | Unsplash License **CLEARED** | **Second** |
| C3 | Office light architecture | Space only | Medium | CLEARED | Rejected — cooler, less human |
| C4 | Startup all-hands | Energy | Weak | CLEARED | Rejected — US branding, low diversity |
| C5 | Classic collaboration stock | Team | Weak | CLEARED | Rejected — stock stereotype risk |
| C6 | Meeting room windows | Space | Medium | CLEARED | Rejected — empty room |
| R1 | Sunset outdoor event (`6bpJDiO5Cnc`) | Warmth | Weak | CLEARED | Rejected — commercial banners (MAPETROL) |
| AI prior | Generated terrace | Decorative | Fail | N/A | Rejected — AI / inauthentic |

### Final image decision

```text
Hero image:
  public/brand/landing-hero-community.jpg
  Source: owner-supplied (Pexels-origin filename: ninthgrid)
  Crop: trimmed headroom + right edge for a clean frame
  Reuse status: AUTHORIZED by product owner for this deployment
  Placement: landing hero

Second image:
  public/brand/landing-welcome-home.jpg
  Source: owner-supplied Triumphant Nation community photograph
  Crop: address banner removed from bottom
  Reuse status: AUTHORIZED by product owner for this deployment
  Placement: belonging section

Third image:
  public/brand/landing-collab-conversation.jpg
  Source: owner-supplied (Pexels-origin filename: antonio-ribeiro)
  Crop: trimmed chair legs (top) and excess floor (bottom)
  Reuse status: AUTHORIZED by product owner for this deployment
  Placement: how participation works
```

Prior Unsplash substitutes withdrawn in favour of these owner-provided assets.

---

## 7. Theme

```text
System / Light / Dark — preserved
Header ThemeToggle (cycle button) — public, member, EXCO
Settings ThemePreferenceControl — retained
Persistence: localStorage tncod-theme
Boot script: preserved
useLayoutEffect hydration sync: applied
```

Cosmetic only — never authorization.

---

## 8. CTA invariants

```text
Join → /join
Sign In → /sign-in
```

Registration page heading may still say “Join the Professionals community” (page title, not primary marketing CTA).

---

## 9. Accessibility

ThemeToggle: `aria-label` + `title`; keyboard focus-visible; touch ≥32px. Semantic headings retained. Reduced-motion preserved for landing fades.

---

## 10. Performance

Hero ~630KB source JPEG (Next/Image optimizes). Second ~203KB. No new npm dependencies. No animation libraries.

---

## 11. Testing

| Check | Class | Result |
| --- | --- | --- |
| TypeScript (`tsc --noEmit`) | AUTOMATED | PASS |
| Vitest theme preference | AUTOMATED | PASS |
| Playwright Phase 23C (15) | AUTOMATED | PASS |
| Smoke / 23B (prior run) | AUTOMATED | PASS |
| Next production build | AUTOMATED | pending deploy |
| Production smoke | PRODUCTION-SMOKE | PASS (`/` Join/Sign In/theme/images; directory 200 prior) |
| Manual phone / iPad / desktop | VISUAL-MANUAL | **NOT PASSED** — awaits human |

---

## 12. Adversarial findings

| ID | Finding | Sev | Disposition |
| --- | --- | --- | --- |
| A1 | 320 overflow from header chrome | P2 | Fixed |
| A2 | Theme select competed / hydrated as System | P2 | Cycle button + layout effect |
| A3 | Banner-heavy sunset candidate | P2 | Rejected |
| A4 | Hero file weight | P3 | Deferred (Next/Image); residual |
| A5 | C1 demographic narrowness | P3 | Accepted with honesty; better than AI/church-service |

---

## 13. Pilot impact

Visual/theme/imagery change is **material**. Record observations as **post-remediation** after this deploy. No new cohort feedback gathered in this pass — do not invent.

---

## 14. Deferred

- Exhaustive EXCO screenshot matrix  
- Official TNCOD photo grant / shoot  
- AVIF/WebP source variants  
- UX-002 role-admin UI  

---

## 15. Rejected / out of scope

Auth/OTP · schema · RLS · RBAC · directory · privacy · Phase 24 · social scrape · fake permission claims · fake visual acceptance · new design system

---

## 16. Files changed (this remediation)

```text
src/app/page.tsx
src/app/globals.css
src/app/join/success/page.tsx
src/components/theme/theme-toggle.tsx
src/components/theme/theme-provider.tsx
src/components/shell/public-shell.tsx
src/components/shell/product-public-shell.tsx
src/components/shell/member-shell.tsx
src/components/shell/exco-shell.tsx
src/components/shell/nav-config.ts
public/brand/landing-hero-community.jpg
public/brand/landing-collab-conversation.jpg
e2e/phase-23c-visual-theme.spec.ts
e2e/smoke.spec.ts
e2e/phase-23b-experience.spec.ts
e2e/phase-6-registration-browser-evidence.spec.ts
docs/product/phase-23c-visual-responsive-theme-refinement.md
docs/product/evidence/phase-23c/*
.cursor/rules/tncod-professionals.mdc
```

---

## 17. Production impact

```text
Application deployment: YES (when published)
Database schema: NO
Production data mutation: NO
RLS: NO
RBAC: NO
Auth architecture: NO
SMTP: NO
Storage permissions: NO
Phase 13: NO
Phase 20: NO
Phase 21: NO
```

---

## Final responsive / theme / visual decisions (honest)

```text
320–1440 automated overflow — PASS (Playwright)
Phone visual acceptance — NOT PASSED (awaits human)
Tablet/iPad visual acceptance — NOT PASSED (awaits human)
Desktop visual acceptance — NOT PASSED (awaits human)

Theme toggle / persistence — AUTOMATED PASS
System / Light / Dark — AUTOMATED PASS; VISUAL-MANUAL pending

Join → /join — PASS
Sign In → /sign-in — PASS
```

---

## Closeout status

```text
PHASE 23C — IMPLEMENTATION COMPLETE
PHASE 23C — VERIFICATION INCOMPLETE
PHASE 23C — NOT LOCKED

PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS
PHASE 24+ — NOT AUTHORIZED

HARD STOP
```
