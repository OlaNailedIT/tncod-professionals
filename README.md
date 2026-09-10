# TNCOD Professionals

Secure professional community platform for TNCOD: identify, understand, connect, and activate professional capacity, businesses, skills, needs, and opportunities in the community.

The **TNCOD Professionals Directory** is a controlled output of the underlying professional database — not the whole product.

---

## Current phase

**Phase 0 — PASS / LOCKED** (product specification)  
**Phases 3–4:** **COMPLETE**.  
**Phase 5 — Design system:** **PASS / COMPLETE / CLOSED** (5.1–5.14).  
**Phase 6 — Quick Registration MVP:** **PASS / COMPLETE / VERIFIED / LOCKED**. See `docs/product/phase-6-quick-registration-mvp.md`.  
**Phase 7+ / other product modules:** **not** authorized.

Application product features (registration, login, profile, directory, EXCO) are **not** implemented.

Read:

- [`docs/product/product-brief.md`](docs/product/product-brief.md) — master reference
- [`docs/product/product-scope.md`](docs/product/product-scope.md) — V1 in/out of scope
- [`docs/ux/README.md`](docs/ux/README.md) — Phase 1 UX/IA index
- [`docs/data/phase-2-data-architecture-gate.md`](docs/data/phase-2-data-architecture-gate.md) — schema contract
- [`docs/security/phase-3-security-gate.md`](docs/security/phase-3-security-gate.md) — security contract
- [`docs/architecture/implementation-governance.md`](docs/architecture/implementation-governance.md) — rules for implementers

---

## Documentation map

```text
docs/
├── product/
│   ├── product-brief.md
│   ├── product-scope.md
│   ├── product-principles.md
│   └── user-roles.md
├── architecture/
│   ├── system-overview.md
│   ├── implementation-governance.md
│   ├── domain-model.md
│   ├── component-system-architecture.md
│   ├── phase-4-technical-foundation.md
│   ├── phase-4-runtime-completion-report.md
│   ├── phase-4-evidence-audit.md
│   └── phase-5-authorization-plan.md
├── design/
│   ├── phase-5-visual-direction.md
│   ├── phase-5-design-tokens.md
│   ├── phase-5-typography.md
│   ├── phase-5-layout-spacing.md
│   ├── phase-5-core-components.md
│   ├── phase-5-data-status-patterns.md
│   └── phase-5-forms-input-patterns.md
├── ux/
│   ├── README.md
│   ├── experience-principles.md
│   ├── information-architecture.md
│   ├── route-architecture.md
│   ├── screen-inventory.md
│   ├── navigation-architecture.md
│   ├── interaction-workflows.md
│   ├── phase-1-acceptance.md
│   └── product-journeys.md
├── data/
│   ├── repository-audit.md
│   ├── data-architecture.md
│   ├── data-classification.md
│   ├── ownership-matrix.md
│   ├── state-transitions.md
│   ├── consent.md
│   ├── auth-and-migrations.md
│   ├── erd.md
│   ├── phase-2-data-architecture-gate.md
│   ├── database-environment.md
│   └── database-gate-test-report.md
├── security/
│   ├── security-principles.md
│   ├── security-architecture.md
│   ├── permission-matrix.md
│   ├── data-visibility-matrix.md
│   ├── rls-architecture.md
│   ├── storage-security.md
│   ├── threat-model.md
│   ├── api-security-contract.md
│   ├── authentication-boundary.md
│   ├── security-test-plan.md
│   └── phase-3-security-gate.md
└── qa/
    └── acceptance-criteria.md
```

---

## Locked direction (summary)

| Topic | Decision |
| --- | --- |
| Who can register | Anyone connected to TNCOD who wants to participate professionally |
| Registration | Record-first; no password |
| Access | Passwordless (magic link / OTP) — implement later |
| Directory | Hybrid (private / members / public); publication controlled |
| Verification | Separate from profile completeness and from publication |
| Stack (intended) | Next.js, TypeScript, Tailwind, shadcn/ui, Supabase, Vercel |
| Starter | Technical scaffolding only; not a product template |

---

## Roadmap

Phase 1 is UX and information architecture. Do not implement the application until Phase 1 is fully locked **and** a later implementation phase is explicitly instructed.

---

## Contributing / Cursor

Do not build features until the relevant phase is explicitly instructed. Do not invent requirements. Follow `docs/architecture/implementation-governance.md`.
