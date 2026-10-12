# Phase 23A — Brand + Member Experience Refinement

**Status:** `PASS` / `COMPLETE` / `VERIFIED` / **LOCKED** (2026-09-15)

**Predecessor:** Phase 22 — PASS / COMPLETE / VERIFIED / LOCKED  
**Successor:** Phase 23 Controlled Pilot — **NOT AUTHORIZED** · Phase 24+ — **NOT AUTHORIZED**

---

## Purpose

Establish a distinct **TNCOD Professionals** identity and a warmer, human member-facing experience — without reopening locked product, security, directory, auth, or RBAC contracts, and without conducting the controlled pilot.

---

## Governance

```text
PHASE 5–13, 18–22 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23A — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23 — CONTROLLED PILOT — NOT AUTHORIZED
PHASE 24+ — NOT AUTHORIZED
```

---

## Brand architecture

```text
Triumphant Nation
        │
        └── TNCOD (Triumphant Nation City of David)
              │
              └── TNCOD Professionals  ← product identity
```

Professionals is clearly of TNCOD, with its own mark, lockup, and voice. Parent church logo remains for attribution — not primary chrome.

---

## Brand promise

| Pillar | Statement |
| --- | --- |
| Who we are | A professional community connecting the people, skills, businesses and experiences within TNCOD. |
| What we help people do | Be known. Connect. Contribute. Grow. |
| How we feel | Warm. Credible. Welcoming. Professional. Connected. Hopeful. Calm. |
| What we are not | Cold · bureaucratic · mechanical · church-admin software · a job board · a generic social network |

Emotional pillars (messaging, not features): **Belong · Be known · Connect · Contribute · Grow**.

---

## Logo system

| Asset | Location | Role |
| --- | --- | --- |
| Professionals mark | `ProfessionalsMark` + `public/brand/professionals-mark.svg` | Symbol / favicon / compact |
| Primary lockup | `ProfessionalsLogo` | TNCOD + Professionals wordmark + mark |
| Compact lockup | `ProfessionalsLogo compact` | Header chrome |
| Parent church logo | `ParentBrandLogo` / `public/brand/tncod-logo.jpg` | Parent attribution only |
| Favicon | `src/app/icon.tsx` | App icon from Professionals mark |

**Mark concept:** Ascending connected pathways with a gold lead node — growth, connection, forward movement. Not handshake / briefcase / globe / church cross.

**Usage rules (LOCKED):**

- Do not recolour, stretch, rotate, or decorate the mark arbitrarily.
- Gold is accent only (lead node / accent token) — not dominant UI fill.
- Shells and product chrome use Professionals lockup; church logo only where parent relationship is intentional (e.g. homepage “Part of” footer).
- Minimum practical mark size ~24px; headers use 32–40px mark.

---

## Colour system

### Foundation (unchanged hex)

| Colour | Hex | Role | Must not |
| --- | --- | --- | --- |
| Royal Blue | `#0E2954` | Primary brand / text / primary buttons | Do not lighten for body text |
| Sky Blue | `#1F75FE` | Secondary / focus / interactive accent | Do not use as sole state cue |
| Gold | `#D4AF37` | Accent only | Do not use as primary fill |
| White | `#FFFFFF` | Surfaces | — |

### Warm supporting neutrals (Phase 23A)

| Token | Hex | Role |
| --- | --- | --- |
| Warm white | `#FAF9F6` | `--background` |
| Warm sand | `#F3F0EA` | `--surface-muted` |
| Warm mist | `#EBE7DF` | `--surface-subtle` |

Borders shifted slightly warmer for cohesion. Status colours (success/warning/danger/info) unchanged.

**Accessibility:** Navy on warm white remains high contrast; muted foreground `#4A5D7A` retained for AA body on light surfaces. Gold never used alone for meaning.

---

## Typography

**Decision: LOCKED — retain Inter** (existing Next.js font pipeline).

Refinement via hierarchy, weight, and spacing — no new typeface dependency. Heading/body tokens from Phase 5.3 remain authoritative.

---

## Messaging

| Surface | Direction |
| --- | --- |
| Homepage | “Your work matters…” · community proposition · ~1 minute CTA · pillars Belong / Be known / Connect / Contribute & grow |
| Registration | “Join the Professionals community” · “Tell us about yourself” · “Join the community” |
| Sign-in | Calm OTP copy; no password; no link-primary implication |
| Dashboard | Welcome home; status badges retained; clearer next actions |
| Directory | Human empty state; projection rules unchanged |
| Footer | Parent TNCOD attribution in human language |

No exaggerated claims. Registration ≠ verification ≠ publication preserved in copy.

---

## Member visual language

Warm background, Professionals chrome, human CTAs, restrained card treatments on homepage pillars. Navigation routes unchanged (`/dashboard`, `/profile`, `/opportunities`, `/settings`, …).

---

## EXCO visual language

Same Professionals lockup for brand continuity; density and operational structure unchanged. **UX-001 / UX-002 remain DEFERRED** — no EXCO menu discoverability feature, no role-admin UI.

---

## Church ↔ Professionals relationship

| Context | Rule |
| --- | --- |
| Website chrome | Professionals lockup |
| Homepage footer | Parent logo + “Part of TNCOD / Triumphant Nation…” |
| Auth / member / directory | Professionals identity |
| Documents / social / events | Use Professionals mark; parent mark only when explicitly representing the church |

---

## Decision register

| Decision | Status |
| --- | --- |
| Brand architecture (TN → TNCOD → Professionals) | **LOCKED** |
| Dedicated Professionals mark + lockup | **IMPLEMENTED** |
| Logo variants (mark / primary / compact) | **IMPLEMENTED** |
| Logo usage rules | **LOCKED** |
| Colour foundation hexes | **LOCKED** |
| Warm supporting neutrals | **IMPLEMENTED** |
| Typography = Inter | **LOCKED** |
| Tone of voice / pillars | **LOCKED** |
| Homepage messaging | **IMPLEMENTED** |
| Registration messaging | **IMPLEMENTED** |
| Navigation tone (labels/routes) | **LOCKED** (routes unchanged) |
| Member visual language | **IMPLEMENTED** |
| EXCO visual consistency (logo only) | **IMPLEMENTED** |
| Church relationship | **LOCKED** |
| UX-001 EXCO nav discoverability | **DEFERRED** |
| UX-002 EXCO role-admin UI | **DEFERRED** |
| New fonts / UI libraries | **REJECTED** |
| Feature development / pilot | **OUT OF SCOPE** |

---

## Pilot-readiness UX review (documented judgment)

| Question | Assessment |
| --- | --- |
| What is this? | Clearer: professional community within TNCOD |
| Why join? | Homepage pillars + CTA |
| Trustworthy / welcoming? | Warmer palette + human copy; pilot should confirm with real members |
| Difficult? | Registration still ~1 minute; fields unchanged |
| Recommendable? | Suitable foundation for a future controlled pilot authorization |

Human emotional validation remains a **Phase 23 pilot criterion**, not claimed as automated PASS.

---

## Implementation summary

| Area | Change |
| --- | --- |
| Logo | `professionals-logo.tsx`, SVG asset, `app/icon.tsx` |
| Tokens | Warm background/surfaces in `globals.css` |
| Shells | Public / member / EXCO use Professionals lockup |
| Homepage | Messaging + pillars + parent attribution |
| Join / success / sign-in / dashboard / directory | Copy + CTA refinements |
| Design system | Shows Professionals + parent marks; warm swatches |
| E2E selectors | Accept new CTA copy |

---

## Testing

| Suite | Result | Label |
| --- | --- | --- |
| TypeScript | **PASS** | LOCAL / AUTOMATED |
| Vitest auth/security/registration | **34 PASS** | LOCAL / AUTOMATED |
| Playwright smoke (`e2e/smoke.spec.ts`) | **4/4 PASS** | LOCAL / AUTOMATED |
| Playwright phase-22 closure (local) | PARTIAL — `/professionals` 500 without local DB | LOCAL / ENVIRONMENT (not a brand defect) |
| Phase 13 projection / auth / RBAC contracts | Preserved by inspection | INSPECTED |
| Production deploy / Production browser | **NONE** under this authorization | — |

---

## Findings

| Sev | Finding | Disposition |
| --- | --- | --- |
| P0/P1 | None | — |
| P2 | Emotional pilot criteria need human cohort | Deferred to Phase 23 authorization |
| P3 | Prior P2-001/P3-001 Production deploy still pending separate auth | Accepted residual |

---

## Deferred / rejected / out of scope

- UX-001, UX-002  
- Controlled pilot, legacy migration, public launch  
- Messaging/chat/job marketplace/AI matching  
- Auth redesign, RBAC changes, schema changes  
- New typeface libraries  

---

## Production impact

```text
Production deployment: NONE
Production DB schema changes: NONE
Production data mutations: NONE
Production Auth changes: NONE
Production RLS changes: NONE
Production Storage changes: NONE
Production configuration changes: NONE
```

---

## Final governance

```text
PHASE 5–13, 18–22 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23A — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 23 — CONTROLLED PILOT — NOT AUTHORIZED
PHASE 24+ — NOT AUTHORIZED
HARD STOP
```
