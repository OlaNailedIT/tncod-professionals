# Changelog

All notable product and repository changes for TNCOD Professionals.

Format: phase-oriented until releases exist. Application versions will be added when the technical foundation exists (Phase 4+).

---

## [Unreleased]

### Phase 13 — Professionals Directory (2026-09-09)

- Public/member directory `/professionals` + `/professionals/[slug]`; `VERIFIED`+`DIRECTORY` server projection; search/filter/pagination (25); `noindex`; extends `app.directory_professionals()`. `docs/product/phase-13-public-member-directory-scope.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 14 **not** authorized.

### Phase 12 — Verification Centre (2026-09-08; evidence remediation 2026-09-09)

- EXCO `/exco/verification` queue; member `submitProfile`; clarification; professional EXCO lifecycle; `publishProfile`/`unpublishProfile` + slug. Evidence remediation: command-boundary suite, real-command DB closeout, member submit Playwright. `docs/product/phase-12-verification-centre-scope.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 13/14 **not** authorized.

### Phase 6 — Quick Registration MVP (2026-09-07)

- Landing `/`, canonical `/join`, `/join/success`, `/register` → `/join`. Passwordless Auth identity + profile/details persistence, duplicate/anti-spam controls, non-PII analytics, KPI duration instrumentation. `docs/product/phase-6-quick-registration-mvp.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 7 **not** authorized.

### Phase 5.14 — Final Phase 5 evidence audit (2026-09-07)

- Forensic evidence/traceability audit of Phase 5.1–5.13. One documentation label corrected (nav shell Phase 5.10). Ladder re-validated 34/34 Vitest · 39/39 focused Playwright. `docs/design/phase-5-14-final-evidence-audit.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. **Phase 5 formally closed.** Phase 6 **not** authorized.

### Phase 5.13 — Component validation / consolidated validation (2026-09-07)

- Integrated composition specimens (Member/EXCO Card + status + metadata + forms). Badge wrap fix for long status text at narrow widths. `docs/design/phase-5-13-component-validation.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 5.14 / product UI **not** authorized.

### Phase 5.12 — Accessibility audit + targeted remediation (2026-09-07)

- Evidence-driven a11y audit. Remediations: AccountMenu menuitem/focus restore; shell logo empty alt; `aria-required` on form controls. `docs/design/phase-5-12-accessibility.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 5.13–5.14 / product UI **not** authorized.

### Phase 5.11 — Member vs EXCO experience differentiation (2026-09-07)

- Audit + targeted refinement of one platform / two densities. Showcase density specimens; shell `data-*` markers; Playwright density evidence. `docs/design/phase-5-11-member-vs-exco.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Initial full Playwright failure = stale 5.10 selector after showcase rename (corrected; focused 5.10+5.11+smoke **19/19**). Phase 5.12–5.14 / product UI **not** authorized.

### Phase 5.11 readiness decision (2026-09-07)

- Earlier post–5.10 note argued against further 5.x work. **Superseded** by human authorization of roadmap Phase 5.11 (Member vs EXCO audit). Retained for history: `docs/design/phase-5-11-readiness-decision.md`.

### Phase 5.10 — Application shell & navigation foundation (2026-09-07)

- Public/Member/EXCO shells; NavLink, drawer, account menu, breadcrumbs, skip link; `/design-system` shell specimens; `docs/design/phase-5-10-application-shell-navigation.md`. **PASS / COMPLETE / VERIFIED / LOCKED** (human adversarial review 2026-09-07). Phase 5.11+ / product UI **not** authorized.

### Phase 5.9 — Design-system gap assessment (2026-09-07)

- Read-only product-readiness assessment. Recommendation: **OPTION B — LIMITED DESIGN-SYSTEM GAP** (application shells / navigation chrome foundational; tables/filters contextual). `docs/design/phase-5-9-design-system-gap-assessment.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Product UI **not** authorized.

### Phase 5.8 — Feedback, interaction & transient UI patterns (2026-09-07)

- Alert, Spinner, Skeleton, Progress, EmptyState, Dialog (native), ToastProvider; Button `loading`; `/design-system` feedback section; `docs/design/phase-5-feedback-interaction-patterns.md`. **PASS / COMPLETE / VERIFIED / LOCKED** (human adversarial review 2026-09-07). Phase 5.9+ **not** authorized.

### Phase 5.7 — Forms & input patterns (2026-09-07)

- Field composition; Input, Textarea, Select, Checkbox, Radio; FormSection/Actions; `/design-system` forms section; `docs/design/phase-5-forms-input-patterns.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 5.8+ **not** authorized.

### Phase 5.6 — Data & status patterns (2026-09-07)

- Semantic status inventory/mappings; StatusBadge, StatusField/Group, MetadataItem/Group; `/design-system` status section; `docs/design/phase-5-data-status-patterns.md`. **PASS / COMPLETE / VERIFIED / LOCKED**. Phase 5.7+ **not** authorized.

### Phase 5.5 — Verification environment remediation (2026-09-07)

- Diagnosed missing Playwright Chromium under Cursor Temp `PLAYWRIGHT_BROWSERS_PATH`. Project-local `.cache/ms-playwright` + `scripts/run-playwright.mjs`; Layer 4 readiness + Phase 5.5 browser evidence specs. Phase 5.6 **not** started.

### Phase 5.5 — Core components (2026-09-07)

- Reusable Button, Surface, Card, Badge, Avatar, Separator; `/design-system` core components section; `docs/design/phase-5-core-components.md`. **PASS / COMPLETE / VERIFIED / LOCKED** (2026-09-07).

### Phase 5.4 — Layout & spacing (2026-09-06)

- Container/gutter/stack/grid/density composition on Phase 5.2 spacing tokens; layout primitives; `/design-system` layout section; `docs/design/phase-5-layout-spacing.md`. **PASS / COMPLETE / VERIFIED / LOCKED** (2026-09-07).

### Phase 5.3 — Typography (2026-09-06)

- Inter via `next/font`; type scale/weights/leading/tracking tokens; `.text-*` utilities; `/design-system` typography section; `docs/design/phase-5-typography.md`.

### Phase 5.2 — Source verification (2026-09-06)

- Design-contract audit accepted. Source verification of `globals.css` / `button.tsx` **PASSED**. Docs hardened for `secondary` vs `secondary-solid`. Phase 5.3 **not** authorized.

### Phase 5.1–5.2 — Visual direction + design tokens (2026-09-06)

- Brand palette locked (`#0E2954`, `#1F75FE`, `#D4AF37`, `#FFFFFF`). Official logo at `public/brand/tncod-logo.jpg`. Semantic token system in `globals.css`; docs in `docs/design/phase-5-design-tokens.md`; showcase at `/design-system`. Phase 5.3 **not** started.

### Phase 5 — GO authorized; visual direction blocked (2026-09-06)

- Phase 5 GO issued. Inspection found no brand/visual assets or Phase 1 visual-direction document in the repository. Token implementation paused pending owner upload. See `docs/design/phase-5-visual-direction-checkpoint.md`.

### Phase foundation closed; Phase 5 GO plan (2026-09-06)

- Phases 3–4 formally closed. Phase 5 authorization/execution plan added (`docs/architecture/phase-5-authorization-plan.md`). **Implementation not authorized** until explicit human GO. No Phase 5 design-system code started.

### Phase 4 — Final evidence audit (2026-09-06)

- Independent review of trigger catalog, Auth/Storage HTTP methodology, IDOR + denial hardening, and scope discipline. **PASS**. See `docs/architecture/phase-4-evidence-audit.md`.

### Phase 4 — Auth & runtime integration (COMPLETED — 2026-09-06)

- Applied `20260827140000_auth_user_sync.sql` on local disposable Postgres. Live Auth Admin API proved `auth.users` → `public.users` (`id` match, MEMBER only). Malicious metadata did not elevate privilege. Storage HTTP isolation EXECUTED. Opportunity and `business_professionals` IDOR tests added. Denial tests classify SQLSTATE. No product UI. Phase 5 not started. See `docs/architecture/phase-4-runtime-completion-report.md`.

### Phase 4 — Technical foundation (IMPLEMENTED; database gate still BLOCKED)

- Next.js App Router, Tailwind, shadcn Button, Lucide, Zod env validation, split Supabase clients, server-only Prisma, authorization primitives, Vitest unit tests. Auth sync SQL added as a migration file — **not applied**. No product feature UI. Database gate remains **BLOCKED**.
- Checks **EXECUTED** on this machine: TypeScript, ESLint, Vitest (8 passed), `next build` **PASSED**, Playwright smoke **PASSED** (1). RLS/Storage remain **NOT EXECUTED**.

### Database gate (PASS — 2026-09-06)

- Phase 2 SQL `120000`–`20300` **APPLIED** on local disposable Supabase. Auth trigger `140000` **NOT APPLIED**. Seed ×2, integrity probes, and 32 RLS/Storage runtime tests **EXECUTED / PASSED**. See `docs/data/database-gate-test-report.md`.

### Phase 3 — Privacy, permissions and security (architecture contract)

- Security contract documented under `docs/security/`. RLS/storage SQL designed in `supabase/policies/` (not applied). Permission constants and authorization helpers in `src/security/` (no API). Seed: role_permissions + EXCO identities + cross-user fixtures. Final reconciliation: Viewer cannot SELECT `users` (email), directory projection aligned, member visibility preference vs DIRECTORY, SECURITY DEFINER grants, no Viewer FOR ALL. No live DB, no Auth, no UI.

### Phase 2 — Data architecture (PASS — LOCKED pending human confirmation)

- Finalization: business M:N, opportunity vocabulary, church service_area, DIRECTORY requires VERIFIED, Supabase SQL as sole migration authority. Prisma validate required after freeze edits. No live DB.

### Phase 1 — UX & information architecture (awaiting human Phase 1 lock)

- 1.1–1.6 UX/IA/workflows locked; 1.7 conceptual domain model; 1.8 component/system construction contract.
- Independent profile / verification / visibility preserved. Record-first and four EXCO/member roles preserved.
- No application implementation. Next Phase 0 step is **Phase 2 schema**, not feature build.

### Phase 0 — Product architecture and specification

- Established documentation foundation under `docs/`.
- Locked product vision, V1 scope, non-goals, participation, lifecycle, independent states, roles, hybrid directory, record-first + passwordless access, verification philosophy, intended stack, and starter strategy.
- Added implementation governance for phase-based work.
- No application implementation.
