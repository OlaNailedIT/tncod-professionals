# Phase 5.4 — Layout & spacing

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-06 (locked 2026-09-07)  
**Depends on:** Phase 5.1 · 5.2 spacing tokens · 5.3 typography (LOCKED)

Phase 5.4 establishes **layout and spacing composition only**. Phase 5.5 (core components) is authorized separately.

---

## 1. Purpose

Define how content occupies space so public, member, and EXCO surfaces share one spatial grammar — without building product screens.

---

## 2. Layout philosophy

```text
ONE PLATFORM LANGUAGE
+
TWO EXPERIENCE DENSITIES
```

| | Member | EXCO |
| --- | --- | --- |
| Feel | lighter, calmer, more spacious | denser, operational, efficient |
| Mechanism | larger composition gaps | smaller composition gaps |
| Not | separate brand / type / spacing scale | tiny text or cramped admin chrome |

Spacing communicates **relationship**: related close · groups moderate · sections larger.

---

## 3. Preserve Phase 5.2 spacing scale

Authoritative rhythm (unchanged):

| Token | px |
| --- | --- |
| 2xs | 2 |
| xs | 4 |
| sm | 8 |
| md | 12 |
| lg | 16 |
| xl | 24 |
| 2xl | 32 |
| 3xl | 48 |

Layout tokens **reference** these values. They do not replace them.

---

## 4. Container system

| Width | Token / class | Max width | Use |
| --- | --- | --- | --- |
| narrow | `--layout-content-narrow` / `Container width="narrow"` | 40rem (640px) | Forms, focused reading, foundation shell |
| standard | `--layout-content-standard` | 60rem (960px) | Typical application content |
| wide | `--layout-content-wide` | 80rem (1280px) | Directories, operational layouts |
| full | `layout-container-full` | none | Intentional edge-to-edge regions |

Default for app content: **standard**. Avoid inventing per-route max-widths.

---

## 5. Page gutters

`--layout-page-gutter` (applied by `PageFrame` / `.layout-page`):

| Viewport | Value | Source token |
| --- | --- | --- |
| default / mobile | 16px | `--space-lg` |
| ≥640px | 24px | `--space-xl` |
| ≥1024px | 32px | `--space-2xl` |
| ≥1536px | 48px | `--space-3xl` |

Same gutters across routes. No route-specific padding systems.

---

## 6. Vertical rhythm & stacks

| Stack | Gap | Token |
| --- | --- | --- |
| tight | 8px | `--layout-stack-tight` → `--space-sm` |
| standard | 12px | `--layout-stack-standard` → `--space-md` |
| comfortable | 24px | `--layout-stack-comfortable` → `--space-xl` |
| section | 32px | `--layout-stack-section` → `--space-2xl` |

Prefer parent `Stack` / `gap` over per-child margins.

---

## 7. Content grouping

1. Related elements → tight / standard stack  
2. Related groups → `--layout-group-gap` / density group tokens  
3. New section → Member/EXCO section density  

Headings stay close to their content (tight stack under the heading).

---

## 8. Grid

Simple CSS Grid — not a 12-column framework:

| Class | Mobile | ≥640px | ≥1024px |
| --- | --- | --- | --- |
| `layout-grid-2` | 1 | 2 | 2 |
| `layout-grid-3` | 1 | 2 | 3 |
| `layout-grid-4` | 1 | 2 | 4 |

Gap: `--layout-grid-gap` (24px). Cards must not become unreadably narrow — prefer fewer columns when content needs width.

---

## 9. Reading width

`.layout-prose` / `--layout-prose: 65ch` (~60–75 characters).

Use for descriptions, guidance, long-form. Tables/directories may exceed; use `.layout-scroll-x` for local overflow.

---

## 10. Alignment

- Default: **left-align** text; shared container edges  
- Centring: empty states, focused intro — not whole application screens  

---

## 11. Card layout guidance (not Card component)

Deferred to Phase 5.5. Spatial rules:

- Internal padding from spacing scale (typically `lg`–`xl`)  
- Title → body: tight stack  
- Card → card: grid gap  
- Do not card-wrap everything  

---

## 12. Form layout guidance (not Form components)

Deferred to Phase 5.8. Spatial rules:

- Label → control: tight  
- Control → help/error: tight  
- Field → field: standard  
- Field groups / sections: density gaps  
- Actions: separated with comfortable/section stack  

---

## 13. Operational / table density

Density via spacing and grouping — **not** by shrinking below Phase 5.3 body 16px. Caption 12px stays metadata-only. Wide tables: local horizontal scroll, not page overflow.

---

## 14. Member density

| Token | Value |
| --- | --- |
| `--density-member-section` | 32px (`2xl`) |
| `--density-member-group` | 24px (`xl`) |
| `--density-member-stack` | 16px (`lg`) |

Class: `Section density="member"` / `.layout-section-member`

---

## 15. EXCO density

| Token | Value |
| --- | --- |
| `--density-exco-section` | 16px (`lg`) |
| `--density-exco-group` | 12px (`md`) |
| `--density-exco-stack` | 8px (`sm`) |

Class: `Section density="exco"` / `.layout-section-exco`

**Dense but calm** — same Inter type scale.

---

## 16. Responsive structure (not Phase 5.10)

- Mobile-first: single column, safe gutters, stack by default  
- Tablet: 1–2 columns  
- Desktop: 2–4 columns where content benefits; containers capped  
- Large desktop: do not let content stretch unboundedly  

Component-level responsive polish is later phases.

---

## 17. Overflow

- `body` / `.layout-page`: `overflow-x: clip` — no unintended page scroll  
- Wide operational regions: `.layout-scroll-x`  

---

## 18. Shell / content relationship

```text
Shell (Phase 5.7)
  → PageFrame (gutters)
    → Container (max-width)
      → Section (density)
        → Stack / Grid / groups
```

Phase 5.4 defines the spatial contract; navigation chrome is Phase 5.7.

---

## 19. Full-bleed

Default: contained.  
`.layout-bleed` for intentional edge-to-edge regions only (media, backgrounds, rare promo). Not a default for ease of implementation.

---

## 20. Accessibility

- Readable prose measure  
- Control gap via `--layout-control-gap` (12px minimum between related controls)  
- Do not solve density by reducing typography  
- Touch targets not intentionally compressed  

---

## 21. Implementation

| Piece | Location |
| --- | --- |
| Tokens | `src/app/globals.css` |
| Utilities | `.layout-*` in `@layer components` |
| Primitives | `src/components/layout/*` |
| Showcase | `/design-system` Layout & spacing section |

Primitives: `PageFrame`, `Container`, `Stack`, `Section`, `Grid`.

---

## 22. Anti-patterns

- Per-route max-widths and gutters  
- Equal spacing everywhere  
- Full-width paragraphs on desktop  
- Separate Member/EXCO design systems  
- Absolute positioning for primary layout  
- Shrinking EXCO type below 16px body  
- Building dashboards/profiles in this phase  

---

## 23. Relationship to 5.2 / 5.3

- 5.2 spacing + colour tokens: preserved  
- 5.3 typography: preserved (no type-size changes for layout)  
- 5.4: composition only  

---

## 24. Validation

Local gate runs (2026-09-06): TypeScript PASS · ESLint PASS · Vitest 9/9 PASS · `next build` PASS · Playwright 3/3 PASS. Source audit: Phase 5.2 colour/spacing and Phase 5.3 typography tokens preserved; layout tokens compose existing spacing.
