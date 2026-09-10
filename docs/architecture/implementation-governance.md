# Implementation governance

**Status:** In force from Phase 0  
**Audience:** All Cursor (and human) implementers of this repository

This repository’s product specification is the source of truth. Agents implement approved phases. They do not invent the product.

---

## Required reading before implementation work

Before writing application code, read at least:

1. `docs/product/product-brief.md`
2. `docs/product/product-scope.md`
3. `docs/product/product-principles.md`
4. `docs/product/user-roles.md`
5. `docs/architecture/system-overview.md`
6. This file
7. Phase-specific docs: `docs/ux/`, `docs/architecture/domain-model.md`, `docs/architecture/component-system-architecture.md`, `docs/data/`, `docs/security/`

If a request conflicts with locked documentation, **stop and report the conflict**. Do not silently “fix” the product.

---

## Phase discipline

Work **phase by phase** according to the roadmap in `docs/product/product-brief.md`.

- Do not implement future phases.
- Do not skip to features because they are easy.
- Phase 0 is specification only: no application features, screens, migrations, Auth, APIs, or major dependency installs for the product.

Current approved implementation phase must be stated in the human instruction. If it is not, assume **documentation-only** until clarified.

---

## Product authority

- Locked decisions in `docs/` are not optional.
- Do not invent product requirements, roles, fields, or V1 features.
- Do not modify locked architecture without explicit human approval **and** a documentation update in the same change set.
- Label unknowns as **OPEN DECISION**. Do not silently invent an answer.
- V1 non-goals in `docs/product/product-scope.md` must not appear as requirements.

---

## Engineering constraints

- Minimize unnecessary dependencies.
- Preserve existing working functionality when changing code (once code exists).
- Prefer the technical starter as scaffolding only (Phase 4+); strip demo product assumptions.
- Do not treat Vercel as a database.
- Do not collapse profile / verification / visibility into one status field.
- Do not use insecure permanent secret profile URLs as long-term security.
- Do not display verification marks for self-asserted claims.

---

## Delivery standards

When finishing a phase or implementation task:

1. List files created or modified.
2. Summarize what was done against the phase instruction.
3. Report contradictions or open decisions honestly.
4. Run appropriate validation for that phase (none required for docs-only Phase 0 beyond review).
5. Report failures honestly.
6. Do **not** claim PASS unless the phase acceptance criteria are satisfied.

Use:

`PHASE N STATUS: PASS` or `PHASE N STATUS: FAIL`

Do not claim PASS to proceed.

---

## Forbidden in Phase 0 (historical record)

Phase 0 must not:

- Build landing page, registration, dashboard, or other UI
- Create database tables or migrations
- Configure Supabase or authentication
- Install major product dependencies
- Implement routes, RLS, storage, or API endpoints
