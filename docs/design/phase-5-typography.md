# Phase 5.3 — Typography

**Status:** **PASS — COMPLETE** (await human audit before Phase 5.4)  
**Date:** 2026-09-06  
**Depends on:** Phase 5.1 visual direction · Phase 5.2 design tokens (LOCKED)

Phase 5.3 establishes **typography only**. Phase 5.4 (layout & spacing composition) is **not** authorized by this document.

## Validation (executed)

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| ESLint | PASS |
| Vitest | PASS (9) |
| `next build` | PASS |
| Playwright | PASS (3) |
| External font CDN / `@import` fonts | none in `src/` |

---

## 1. Objectives

Typography must feel: professional, trustworthy, modern, calm, mature, human, readable, community-appropriate.

Avoid: bureaucratic, sterile, luxury-editorial, playful, gimmicky, decorative display faces.

---

## 2. Font family

| Role | Choice |
| --- | --- |
| Primary UI / headings | **Inter** |
| Monospace | System mono stack (technical/code only) |

**Rationale:** Inter is a highly readable modern sans-serif, production-safe with Next.js `next/font`, and matches the locked calm/professional character. No decorative display family. One sans for Member and EXCO.

---

## 3. Font loading

```text
next/font/google → Inter
weights: 400, 500, 600, 700
CSS variable: --font-inter
display: swap
```

Implementation: `src/lib/fonts.ts`  
Applied on `<html className={inter.variable}>` in `src/app/layout.tsx`.

Self-hosted at build time via the Next.js font pipeline. No runtime CDN `@import`, no blocking third-party scripts.

`--font-family-sans` resolves to `var(--font-inter), …system fallbacks`.

---

## 4. Weight system

| Weight | Token / utility | Use |
| --- | --- | --- |
| 400 | `--font-weight-regular` / `font-normal` | Body, descriptions |
| 500 | `--font-weight-medium` / `font-medium` | Labels, nav emphasis, compact UI |
| 600 | `--font-weight-semibold` / `font-semibold` | Section / card headings |
| 700 | `--font-weight-bold` / `font-bold` | Page titles, strong emphasis |

Not used: 300, 800, 900.

---

## 5. Type scale

| Role | Class | Desktop | Mobile (&lt;640px) | Weight | Line-height | Tracking |
| --- | --- | --- | --- | --- | --- | --- |
| Display | `.text-display` | 48px (3rem) | 36px | 700 | 1.12 | -0.02em |
| H1 | `.text-h1` | 36px | 30px | 700 | 1.2 | -0.015em |
| H2 | `.text-h2` | 30px | 24px | 600 | 1.25 | -0.01em |
| H3 | `.text-h3` | 24px | 24px | 600 | 1.3 | -0.01em |
| H4 | `.text-h4` | 20px | 20px | 600 | 1.35 | 0 |
| Body large | `.text-body-lg` | 18px | 18px | 400 | 1.55 | 0 |
| Body | `.text-body` | 16px | 16px | 400 | 1.55 | 0 |
| Body small | `.text-body-sm` | 14px | 14px | 400 | 1.45 | 0 |
| Caption | `.text-caption` | 12px | 12px | 400 | 1.4 | 0.01em |
| Label | `.text-label` | 14px | 14px | 500 | 1.35 | 0.01em |

CSS variables: `--type-*-size|leading|weight|tracking` in `globals.css`.

Primary body remains **16px**. Caption (12px) is metadata only — not important content.

---

## 6. Line height

| Category | Range used |
| --- | --- |
| Display / large headings | 1.12–1.2 |
| Headings | 1.25–1.35 |
| Body | 1.55 |
| Compact UI (body-sm, label, caption) | 1.35–1.45 |

Readability over extreme compactness.

---

## 7. Letter spacing

- Large headings: slight negative tracking  
- Body: normal  
- Caption / label: slight positive (0.01em)  
- Avoid shouty all-caps tracking as a default pattern  

---

## 8. Semantic hierarchy

```text
Display → H1 → H2 → H3 → H4 → Body lg → Body → Body sm → Caption / Label
```

Hierarchy combines size + weight + Phase 5.2 colour tokens (`text-foreground`, `text-muted-foreground`, `text-link`). No new colours.

---

## 9. Responsive behaviour

Simple reduction under `max-width: 639px`:

- Display 48 → 36  
- H1 36 → 30  
- H2 30 → 24  

No multi-breakpoint clamp maze. Body sizes unchanged for readability.

---

## 10. Member vs EXCO

**One typography system.**

| | Member | EXCO |
| --- | --- | --- |
| Font | Inter | Inter |
| Scale | Same | Same |
| Composition | More spacious; prefer body / body-lg | Tighter; more H3/H4, body-sm, labels |

Differences come from hierarchy and spacing (Phase 5.4+), not separate fonts or scales.

---

## 11. Accessibility

- Body ≥ 16px for primary content  
- Body line-height 1.55  
- Prefer `max-w-prose` for long reading blocks in showcase  
- Semantic heading classes map to real heading elements in showcase  
- Focus tokens from Phase 5.2 unchanged  
- Colours remain Phase 5.2 semantic tokens (no sky-blue body text on white; no gold body text)  

---

## 12. Implementation

| File | Role |
| --- | --- |
| `src/lib/fonts.ts` | Inter via `next/font/google` |
| `src/app/layout.tsx` | Applies `--font-inter` on `<html>` |
| `src/app/globals.css` | Type tokens + `.text-*` component classes |
| `src/app/design-system/page.tsx` | Typography showcase section |
| `src/app/page.tsx` | Consumes `text-h1` / `text-body-sm` |

Anti-patterns avoided: no second font family for “premium”, no redesign of Button variants beyond existing semantic colours, no Phase 5.4 layout system.

---

## 13. Relationship to Phase 5.2

Colour, radius, elevation, spacing *aliases*, and focus remain as locked in 5.2. Typography consumes those colour tokens. Spacing *composition* for pages/shells is Phase 5.4.

---

## 14. Validation

Recorded in the Phase 5.3 completion report after CI-style local runs (TypeScript, ESLint, Vitest, Playwright, build as applicable).
