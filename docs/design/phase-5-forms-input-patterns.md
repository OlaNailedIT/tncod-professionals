# Phase 5.7 — Forms & input patterns

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5.1–5.6 **LOCKED**

Phase 5.7 establishes the reusable form and input language. It does **not** implement product forms (registration, profile edit, etc.).

Human gate (2026-09-07): independent review accepted implementation, a11y, responsive, browser evidence, and scope. Do not reopen.

---

## 1. Purpose

One coherent field composition and control set so later product forms inherit consistent spacing, focus, validation presentation, and accessibility.

---

## 2. Scope

| In | Out |
| --- | --- |
| Field, Input, Textarea, Select, Checkbox, Radio/RadioGroup, FormSection, FormActions | Product `/register`, profile edit, EXCO forms |
| Required/optional convention, help/error, disabled/read-only | Switch (no demonstrated V1 need) |
| Member/EXCO density via Phase 5.4 `Section` | Custom form libraries beyond existing RHF/Zod exports |
| Design-system specimens | DB/Auth/RLS/API wiring |

---

## 3. Field composition

```text
Field
 ├── Label (+ required * or optional marker)
 ├── Control
 ├── Help / description
 └── Error (role=alert)
```

Controls consume Field context for `id`, `aria-describedby`, `aria-invalid`, `required`, `disabled`.

---

## 4. Required / optional convention

**Platform rule:** Required fields show a visible asterisk (`*`) and set `required` / `aria-required` via the control. Optional fields may show `(optional)` when `optional` is set. Do not mix competing conventions across screens.

Placeholders are never a substitute for labels.

---

## 5. Validation presentation

Human-readable messages only in the design system (e.g. “Enter a valid email address.”). Error text uses `role="alert"` and `text-danger`. Colour reinforces; text carries meaning. No product Zod schemas in this phase.

---

## 6. Primitives

| Component | Notes |
| --- | --- |
| `Field` | Composition + a11y wiring |
| `Input` / `Textarea` / `Select` | Native controls + shared chrome |
| `Checkbox` | Inline Field layout |
| `Radio` / `RadioGroup` | Native radiogroup |
| `FormSection` / `FormActions` | Grouping + action row |

Switch: **not implemented** (no locked V1 justification).

---

## 7. Density

Same controls. Member/EXCO differences use Phase 5.4 `Section density="member|exco"`.

---

## 8. Accessibility

- Label ↔ control via `htmlFor` / `id`
- Description/error ↔ control via `aria-describedby`
- Focus-visible ring tokens preserved
- Disabled / read-only native semantics
- Minimum control height `h-9` for text inputs

---

## 9. Anti-patterns

- Placeholder-only labels  
- Colour-only errors  
- Product forms in `/design-system`  
- Duplicate Member/EXCO input components  
- New hex colours / parallel spacing scales  

---

## 10. Files

See Phase 5.7 completion report. Documentation: this file.

---

## 11. Validation

Local gate (2026-09-07): TypeScript PASS · ESLint PASS · Vitest 20/20 PASS · `next build` PASS · browser readiness PASS · Playwright 29/29 PASS (including Phase 5.7 forms evidence at 320–1280). `vitest.config.ts` include extended to `*.test.tsx` for Field unit tests.

---

## 12. Gate

```text
PHASE 5.7: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.8: PASS / COMPLETE / VERIFIED / LOCKED
PHASE 5.9+: NOT AUTHORIZED
```
