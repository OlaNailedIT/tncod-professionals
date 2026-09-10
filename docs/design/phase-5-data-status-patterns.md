# Phase 5.6 — Data & status patterns

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.5 **LOCKED**

Phase 5.6 establishes a **language for representing information and state**. It does not build product screens.

Human gate (2026-09-07): adversarial audit accepted Phase 2 schema authority for `SUBMITTED` (profile) and `BusinessStatus` secondary mappings; primary Profile ≠ Verification ≠ Visibility preserved. Do not reopen.

---

## 1. Purpose

Provide reusable semantic presentation rules and minimal primitives so later screens can show profile, verification, visibility, and related states consistently — without collapsing independent dimensions.

---

## 2. Authoritative semantic inventory

Sources: `src/types/status.ts`, `prisma/schema.prisma`, `docs/data/state-transitions.md`, Phase 0 principles.

### Primary professional dimensions (must stay separate)

| Domain | States | User-facing | Typical presentation |
| --- | --- | --- | --- |
| Profile completeness | `REGISTERED`, `INCOMPLETE`, `COMPLETE`, `SUBMITTED` | Yes | Badge + domain label |
| Verification | `NOT_REVIEWED`, `PENDING`, `UNDER_REVIEW`, `VERIFIED`, `NEEDS_CLARIFICATION`, `REJECTED` | Yes (member + EXCO) | Badge + domain label |
| Directory visibility | `PRIVATE`, `MEMBERS_ONLY`, `DIRECTORY` | Yes | Badge + domain label |

Invariant (data layer): `DIRECTORY` requires `VERIFIED`. Presentation must still show both dimensions.

### Secondary schema domains (presentation maps only)

| Domain | States | Notes |
| --- | --- | --- |
| Account | `ACTIVE`, `SUSPENDED`, `DEACTIVATED` | Operational account lifecycle |
| Business | `DRAFT`, `SUBMITTED`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED` | Separate from profile verification |
| Opportunity | `DRAFT`, `ACTIVE`, `CLOSED`, `EXPIRED` | Opportunity lifecycle |
| Document | `UPLOADED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED` | Document review |

Opportunity **types** (`SEEKING_EMPLOYMENT`, etc.) are classifications, not lifecycle statuses — present as neutral metadata when needed, not as success/danger status.

No invented states beyond the locked schema.

---

## 3. Profile vs verification vs directory visibility

```text
Profile COMPLETE  ≠  Verification VERIFIED  ≠  Visibility DIRECTORY
```

| Combination | Meaning |
| --- | --- |
| COMPLETE + VERIFIED + MEMBERS_ONLY | Verified, not public directory |
| COMPLETE + PENDING + PRIVATE | In review pipeline, private |
| INCOMPLETE + NOT_REVIEWED + PRIVATE | Early record — not “rejected” |
| COMPLETE + VERIFIED + DIRECTORY | Public directory listing (requires verified) |

`PRIVATE` must never read as rejection. `DIRECTORY` must not be styled as verification success (uses **info**, not **success**).

---

## 4. Status presentation taxonomy

| Intent | Token usage | Use for |
| --- | --- | --- |
| `neutral` | muted badge | Ordinary / privacy / inactive emphasis |
| `info` | `info-muted` / `info` | Pending, under review, members-only, directory listing |
| `success` | `success-muted` / `success` | Complete, verified, approved, active |
| `warning` | `warning-muted` / `warning` | Incomplete, needs clarification, suspended, expired |
| `danger` | `danger-muted` / `danger` | Rejected |

Consumers choose **intent**, never raw green/blue/red.

---

## 5. Semantic colour mapping

Implemented in `src/lib/status/presentations.ts` and `secondary.ts`.

Gold (`#D4AF37`) is **not** a status colour. Sky brand remains interactive; filled secondary still uses `secondary-solid`. No Phase 5.2 token changes.

---

## 6. Badge rules

- Presentational `Badge` (Phase 5.5) remains generic.
- `StatusBadge` wraps `Badge` with `intent` + text children.
- No `profileStatus` / `verificationStatus` props on the component.
- Mapping lives in `src/lib/status/*`, not in UI props.

---

## 7. Metadata rules

`MetadataGroup` + `MetadataItem`: generic label/value. No hard-coded profession/industry fields.

---

## 8. Status hierarchy

1. Identity (name/avatar) — later product screens  
2. Independent status dimensions via `StatusGroup` / `StatusField`  
3. Secondary metadata via `MetadataGroup`  
4. Supporting prose when a state needs explanation  

Guidance: Member surfaces prefer ≤3 simultaneous status chips; EXCO may show denser sets using Phase 5.4 density. Prefer text over a fourth equally loud badge when scanning cost rises.

---

## 9. Multiple-state grouping

Use `StatusField` domain labels (`Profile`, `Verification`, `Directory`) so chips are not anonymous coloured pills.

---

## 10. Data-density guidance

Reuse Phase 5.4 Member/EXCO density tokens. Do not fork StatusBadge per experience.

---

## 11. Accessibility

- Visible text label required  
- Colour reinforces only  
- Showcase includes colour-independent specimen  
- Interactive focus unchanged for Buttons; status chips are non-interactive `<span>`s  

---

## 12. Icon policy

No new icons for status. Lucide not required for this phase.

---

## 13. Component inventory

| Piece | Path |
| --- | --- |
| Intent + presentation maps | `src/lib/status/*` |
| StatusBadge | `src/components/ui/status-badge.tsx` |
| StatusField / StatusGroup | `src/components/ui/status-field.tsx` |
| MetadataItem / MetadataGroup | `src/components/ui/metadata.tsx` |

---

## 14. Design-system evidence

`/design-system` — **Data & status patterns** section. `robots: noindex`.

---

## 15. Scope exclusions

No directory/profile/dashboard/verification queue/search/filter/nav/forms/toasts/dialogs/product tables. No DB/Auth/RLS/Storage/API changes.

---

## 16. Validation evidence

Local gate runs (2026-09-07): TypeScript PASS · ESLint PASS · Vitest 14/14 PASS · `next build` PASS · browser readiness 2/2 PASS · Playwright suite 21/21 PASS (smoke + 5.5 + 5.6 browser evidence).

---

## 17. Phase completion status

```text
PHASE 5.6: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.7: NOT AUTHORIZED
```