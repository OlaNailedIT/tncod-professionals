# Acceptance criteria

This file has two layers:

1. **Phase 0** — documentation/governance (this delivery)
2. **V1 product** — conceptual acceptance for later implementation phases (not claimed complete now)

---

## Phase 0 acceptance criteria

Phase 0 **PASS** requires all of the following.

### Product

- [x] Product purpose documented
- [x] V1 scope documented
- [x] Non-goals documented

### Participation

- [x] Everyone connected to TNCOD who wants to participate professionally can register
- [x] Professional category does not restrict registration

### Lifecycle

- [x] Registration, profile completion, internal availability, directory publication, and verification are conceptually distinct

### State

- [x] Profile status is separate
- [x] Verification status is separate
- [x] Directory visibility is separate

### Auth (documented only)

- [x] Record-first
- [x] Passwordless access
- [x] No password friction during registration
- [x] No insecure permanent secret profile URL as long-term security

### Verification

- [x] Member claims are not automatically verified
- [x] Verified designation requires EXCO action / evidence

### Roles

- [x] Member, EXCO Viewer, EXCO Admin, Super Admin documented

### Privacy

- [x] Collection distinct from publication
- [x] Sensitive information identified conceptually

### Tech (documented only)

- [x] Next.js, TypeScript, Supabase, Vercel, Tailwind, shadcn/ui documented as intended stack
- [x] Technical starter strategy documented
- [x] No application implementation in Phase 0

### Scope

- [x] V1 scope documented
- [x] Future features explicitly excluded

### Governance

- [x] Phase-based Cursor implementation process documented
- [x] No-code / no-feature rule for Phase 0 respected

### Documentation set

- [x] `docs/product/product-brief.md`
- [x] `docs/product/product-scope.md`
- [x] `docs/product/product-principles.md`
- [x] `docs/product/user-roles.md`
- [x] `docs/architecture/system-overview.md`
- [x] `docs/architecture/implementation-governance.md`
- [x] `docs/ux/product-journeys.md`
- [x] `docs/security/security-principles.md`
- [x] `docs/qa/acceptance-criteria.md`
- [x] `README.md`
- [x] `CHANGELOG.md`

---

## V1 product acceptance (deferred — do not claim now)

These will be refined in Phases 1, 16, and feature phases. Recorded so later agents do not invent success.

| Area | Criterion (intent) |
| --- | --- |
| Registration | Median completion ≤ 60 seconds; Stage 1 field set respected |
| Record-first | Record exists without password |
| Access | Passwordless access to own record; no secret-URL security model |
| Profile | Progressive; conditional sections; incomplete records still internally useful |
| Verification | No auto-verified credentials; EXCO workflow for review/clarify/reject/history |
| Directory | Hybrid; publication controlled; sensitive data not leaked |
| EXCO | Dashboard, search, filters, verification queue, notes, export, RBAC |
| Non-goals | Listed V1 exclusions absent |

---

## How to report

After a phase:

- `PHASE N STATUS: PASS` only if that phase’s criteria are met.
- Otherwise `PHASE N STATUS: FAIL` with remaining work.

Phase 0 does **not** authorize Phase 1 implementation until humans review this documentation independently.
