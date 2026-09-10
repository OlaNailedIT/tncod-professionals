# Phase 5.2 — Design tokens

**Status:** **PASS — LOCKED** (design contract + source verification)  
**Date:** 2026-09-06  
**Depends on:** `docs/design/phase-5-visual-direction.md` (PASS — LOCKED)

## Architecture

```text
Brand tokens (fixed hex)
        ↓
Semantic tokens (purpose)
        ↓
Component states / Tailwind utilities
```

Implementation: `src/app/globals.css` (`:root` + `@theme inline` for Tailwind v4 / shadcn).

**Rule:** Components consume semantic utilities (`bg-primary`, `text-muted-foreground`). Raw brand hex appears only in Level 1 token definitions (plus this doc).

Validation surface: `/design-system` (development-only, `robots: noindex`).

---

## Level 1 — Brand tokens

| Token | Value | Role |
| --- | --- | --- |
| `--brand-primary` | `#0E2954` | Triumphant Royal Blue — identity, primary chrome |
| `--brand-secondary` | `#1F75FE` | Vibrant Sky Blue — interactive emphasis |
| `--brand-gold` | `#D4AF37` | Muted Accent Gold — restrained distinction |
| `--brand-white` | `#FFFFFF` | Pure White |

Do not alter these four values.

---

## Level 2 — Semantic colour

| Token | Purpose | Notes |
| --- | --- | --- |
| `background` | Page canvas | `#F5F7FB` cool light (not flat zinc) |
| `foreground` | Body / heading text | Brand primary (AA on white/background) |
| `surface` / `surface-muted` / `surface-subtle` | Cards, panels, nested surfaces | White → soft blue-gray |
| `primary` / `primary-foreground` / `primary-hover` | Primary actions | Brand primary + white |
| `secondary` | Brand Sky Blue for **non-text** interactive emphasis | Exact brand secondary. Prefer rings, icons, borders, active indicators. **Do not** use `bg-secondary text-secondary-foreground` for filled controls — brand sky + white fails WCAG AA for text (4.17:1). |
| `secondary-solid` / `secondary-hover` | Accessible filled secondary actions | **Derived** `#155EE8` / `#1248C9` for white foreground (AA). Not a brand replacement. Button `secondary` variant uses these. |
| `secondary-foreground` | Foreground for `secondary-solid` fills | White — pair only with `secondary-solid` / `secondary-hover`, not with raw `secondary` |
| `accent` / `accent-foreground` / `accent-muted` | Gold accent | Navy on gold; muted wash for badges |
| `muted` / `muted-foreground` | Quiet surfaces / secondary copy | `#4A5D7A` on white ≈ 6.7:1 AA |
| `border` / `border-subtle` / `border-strong` | Dividers, inputs | Soft blue-gray scale |
| `input` / `ring` / `ring-offset` | Forms + focus | Ring = brand secondary |
| `success` / `warning` / `danger` / `info` (+ muted / foreground) | Status communication | Not brand colours; palette-compatible |
| `link` / `link-hover` | Inline links | Default navy (AA); sky on hover |

### Colour usage rules

| Colour | Use | Do not |
| --- | --- | --- |
| Royal Blue | Primary buttons, headers, body text, brand chrome | Flood large decorative areas without hierarchy |
| Sky Blue (`secondary`) | Focus rings, active indicators, icons, chrome | Default body text; filled buttons with white text (`bg-secondary`) |
| Sky Blue solid (`secondary-solid`) | Filled secondary actions with white text | Replace brand secondary token |
| Gold | Badges of distinction, rare highlights, muted washes | Default buttons, nav backgrounds, large fills, default links |
| White | Surfaces, primary-foreground on navy / secondary-solid | White text on gold |

### `secondary` vs `secondary-solid` (mandatory)

```text
secondary
= brand Sky Blue (#1F75FE); primarily non-text decorative/interactive emphasis

secondary-solid
= accessible filled-action token (#155EE8) intended for white foreground
```

Incorrect:

```text
bg-secondary text-secondary-foreground   ← AA fail for text
```

Correct:

```text
bg-secondary-solid text-secondary-foreground
ring-secondary / text-secondary (icons, chrome)
```

### One token system

Member and EXCO share these tokens. Density differs via spacing/layout later — not separate palettes.

---

## State colours (verified against `globals.css`)

| Token | Hex | On white | White on colour | Muted wash pairing |
| --- | --- | --- | --- | --- |
| `success` | `#0B7A4B` | 5.39 AA PASS | 5.39 AA PASS | on `#E6F5EE` → 4.79 AA PASS |
| `warning` | `#B45309` | 5.02 AA PASS | 5.02 AA PASS | on `#FFF4E5` → 4.62 AA PASS |
| `danger` | `#B91C1C` | 6.47 AA PASS | 6.47 AA PASS | on `#FDE8E8` → 5.51 AA PASS |
| `info` | `#1D4ED8` | 6.70 AA PASS | 6.70 AA PASS | on `#EFF6FF` → 6.16 AA PASS |

Meaning is never colour-only: later components must keep text/icons.

## Spacing

4px base aliases:

| Token | Rem | px |
| --- | --- | --- |
| `--space-2xs` | 0.125 | 2 |
| `--space-xs` | 0.25 | 4 |
| `--space-sm` | 0.5 | 8 |
| `--space-md` | 0.75 | 12 |
| `--space-lg` | 1 | 16 |
| `--space-xl` | 1.5 | 24 |
| `--space-2xl` | 2 | 32 |
| `--space-3xl` | 3 | 48 |

Aligns with Tailwind’s default spacing rhythm. Prefer these or Tailwind spacing utilities over one-off values.

Density hooks: `--density-member-section` (2xl) vs `--density-exco-section` (lg).

---

## Radius

| Token | Value | Typical use |
| --- | --- | --- |
| `sm` | 0.25rem | Compact controls |
| `md` | 0.375rem | Default controls (default `--radius`) |
| `lg` | 0.5rem | Cards / panels |
| `xl` | 0.75rem | Larger shells |
| `full` | 9999px | Avatars, pills, dots only |

Restrained — not “pill UI everywhere.”

---

## Elevation

| Token | Role |
| --- | --- |
| `none` | Flat |
| `subtle` | Barely lifted surface |
| `default` | Card resting |
| `raised` | Emphasised panel |
| `overlay` | Dialogs / popovers |

Favour surface + border over heavy shadow. Shadows are tinted with brand navy, not generic black.

---

## Typography foundation (Phase 5.2 only)

| Token | Value |
| --- | --- |
| `--font-family-sans` | System UI stack |
| `--font-family-heading` | Same as sans (for now) |
| `--font-family-mono` | System mono stack |

**OPEN for Phase 5.3:** approved display/body typeface selection, type scale (Display → Caption), weights, letter-spacing. No decorative font invented here.

---

## Theme (dark mode)

**Decision:** Dark mode **not implemented** for V1.

- `color-scheme: light` on `html`
- Variables live in `:root` so a future theme can add `.dark { … }` without restructuring
- No second visual system created

---

## Focus

`:focus-visible` → 2px solid `var(--ring)` (sky blue), offset 2px. Do not remove without an equal replacement.

---

## Accessibility notes (executed)

| Pairing | Ratio | Result |
| --- | --- | --- |
| White on Royal Blue | 14.35 | AA PASS |
| Royal Blue on White / background | ≥13.3 | AA PASS |
| Sky Blue `#1F75FE` on White | 4.17 | **AA FAIL** for text — not used as body/link default or filled-button fill |
| White on `secondary-solid` `#155EE8` | 5.53 | AA PASS (derived fill) |
| Navy on Gold | 6.82 | AA PASS |
| White on Gold | 2.10 | FAIL — do not put white text on gold |
| Muted foreground on White | 6.69 | AA PASS |
| Success / warning / danger / info on White | ≥5.02 | AA PASS (see state table above) |

Meaning is never colour-only: later components must keep text/icons.

---

## Source verification (2026-09-06)

| Claim | Source | Result |
| --- | --- | --- |
| Four brand hex values | `globals.css` L11–14 | **CONFIRMED** |
| `secondary` = brand secondary | L28 | **CONFIRMED** |
| `secondary-solid` = `#155ee8` | L30 | **CONFIRMED** |
| Button secondary uses `bg-secondary-solid` | `button.tsx` L18 | **CONFIRMED** |
| Button does not use `bg-secondary` for fill | `button.tsx` | **CONFIRMED** |
| State colour hexes | `globals.css` L49–63 | **CONFIRMED** + contrast re-run |
| Focus `:focus-visible` ring | `globals.css` L195–198 | **CONFIRMED** |
| Dark mode absent | `color-scheme: light` only | **CONFIRMED** |
| No product zinc leftovers in button | `button.tsx` | **CONFIRMED** |

**Implementation matches the design contract.**

---

## Logo

`public/brand/tncod-logo.jpg` — official asset. Component: `src/components/brand/logo.tsx`. Do not recolour or redraw.

---

## Files

| File | Role |
| --- | --- |
| `src/app/globals.css` | Token definitions + Tailwind `@theme` |
| `src/components/ui/button.tsx` | Consumes semantic tokens |
| `src/components/brand/logo.tsx` | Official logo display |
| `src/app/design-system/page.tsx` | Token showcase |
| `public/brand/tncod-logo.jpg` | Authoritative logo |

---

## Out of scope (confirmed)

No registration, login, profiles, directory, EXCO workflows, migrations, Auth/RLS/Storage changes. Phase 5.3 typography not started.
