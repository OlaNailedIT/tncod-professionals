# Dirty-tree disposition (Release Gate 5)

**Forensic workspace:** local checkout historically at HEAD `6f31606` (`phase4-join-reclaim-truthful-success`)  
**Authoritative baseline:** `origin/main` at Gate 5 start `ba032a6`  
**Starting dirty path count:** **218**  
**Policy:** inventory + classify; promote only verified/necessary units; leave forensic tree intact.

Categories used during inventory: A already/equivalent · B superseded · C verified implementation candidate · D evidence/docs candidate · E forensic · F ops tooling · G generated · H stale/wrong · I unknown.

After Gate 5 promotion, remaining differences vs final `main` use these final classes:

```text
INTENTIONALLY LOCAL FORENSIC
SUPERSEDED
DEFERRED FUTURE WORK
DANGEROUS OPS TOOL — GOVERNED
GENERATED / EPHEMERAL
UNKNOWN   ← must be 0 for release-relevant paths
```

---

## Summary counts (starting inventory)

| Class | Approx. count | Notes |
| --- | ---: | --- |
| A — already on main / equivalent | ~15 | e.g. Phase 21 migration already on `main` while dirty showed `??` |
| B — superseded | ~25 | dirty-only `/auth/confirm`; local edits replaced by later main/verified paths |
| C — verified implementation candidates | 0 promoted as Phase 23 UI | Phase 18A importer modules **promoted**; Phase 23 UI **deferred** |
| D — evidence/docs candidates | ~25 | phase 18–23 status docs + sanitized Phase 18 reports **promoted** |
| E — historical forensic | ~40 | one-off forensic probes / join-profile forensics |
| F — operational tooling | ~70 | Production-capable scripts — **not** wholesale-promoted |
| G — generated / ephemeral | ~20 | evidence screenshots, local reports without durable value |
| H — stale / wrong | ~5 | docs that contradicted verified Production (reconciled via RELEASE-STATE) |
| I — unknown (release-relevant) | **0** | after disposition |

Exact path groups below.

---

## Promoted in Gate 5 (yes)

| Path / group | Class | Reason |
| --- | --- | --- |
| `docs/release/RELEASE-STATE.md` | D | Authoritative release summary |
| `docs/release/dirty-tree-disposition.md` | D | Durable disposition |
| `docs/product/phase-18*.md`, `phase-18a*.md` | D | Phase 18 final truth + 18A contract |
| `docs/product/phase-20*.md`, `phase-20.5*.md`, `phase-21*.md`, `phase-22*.md`, `phase-23*.md` | D | Status contracts for locked / in-progress phases |
| `docs/infrastructure/VERCEL-PRODUCTION-DEPLOYMENT-REPORT.md` | D | Production origin evidence |
| `scripts/migrations/phase18/reports/production-execute*` | D | Masked Production import evidence |
| `scripts/migrations/phase18/reports/production-post-import*` | D | Masked 18/18 reconciliation |
| `scripts/migrations/phase18/reports/pre-existing-orphan*` | D | Masked orphan disposition |
| `scripts/migrations/phase18/reports/phase18a-*` + blocked historical reports | D/E | Keep history + plan evidence |
| `src/features/legacy-migration/{execute,plan,auth-admin,constants,member-index,source-guard,target-safety,phase18a.test}.ts` + related updates | C→promoted | Verified Phase 18A auth-first importer source missing from `main` |
| `scripts/migrations/phase18/{import.ts,README.md}` + selected report updates | C/D | CLI + guidance aligned to executed importer |
| `.cursor/rules/tncod-professionals.mdc` | D | Agent governance must match verified reality |
| `README.md`, `CHANGELOG.md`, `docs/product/product-scope.md` | D | Stale status / PRIVACY-P1 / V1-O1 amendments |

---

## Not promoted (explicit disposition)

| Path / group | Final class | Safe future action |
| --- | --- | --- |
| `src/app/auth/confirm/**` | SUPERSEDED | Production uses `/sign-in` + `/auth/callback`; do not promote |
| Phase 23 UI: shells, theme, brand assets (`public/brand/landing-*`, `professionals-mark*`), guidance, dashboard next-action, globals/layout/page edits | DEFERRED FUTURE WORK | Authorized promotion only after 23C/23D human acceptance + clean PR |
| `docs/product/evidence/**` screenshots | GENERATED / EPHEMERAL or INTENTIONALLY LOCAL FORENSIC | Keep local; promote only if a future evidence gate requires curated assets |
| `e2e/phase-20.5*`, `e2e/phase-22*`, `e2e/phase-23*`, `e2e/forensic-*`, `playwright.phase22-prod.config.ts` | INTENTIONALLY LOCAL FORENSIC / DEFERRED | Promote with matching implementation PRs later |
| `scripts/phase205-*`, `scripts/phase21-*`, `scripts/phase22-*`, `scripts/phase23-*`, `scripts/prod-*`, `scripts/rbac-*`, `scripts/otp-*`, `scripts/forensic-*`, `scripts/auth-site-url-repair.cjs`, `scripts/set-vercel-supabase-public.cjs`, `scripts/write-prod-anon-legacy.cjs`, … | DANGEROUS OPS TOOL — GOVERNED | Retain locally; any future repo promotion requires explicit ops governance + secret review |
| `scripts/migrations/phase18/{orphan-cleanup,orphan-disposition,forensic-*,post-import-reconcile,reconcile-failed-run}.ts` | DANGEROUS OPS TOOL — GOVERNED / INTENTIONALLY LOCAL FORENSIC | Do not make accidental Production mutation easy |
| Dirty-only `.env.example` / `.gitignore` deltas | DEFERRED / GENERATED | Review later; do not hide source via broad ignores |
| Dirty `prisma/schema.prisma`, `supabase/templates/*` local edits | DEFERRED / SUPERSEDED | Diff against `main` before any future promote |
| Remaining modified `src/app/**`, `src/components/**`, `src/features/**` (non–Phase-18A / non–Phase-21 escape) | DEFERRED FUTURE WORK | Mixed Phase 23 / UX |
| `public/brand/professionals-mark*`, `professionals-logo.tsx`, `src/app/icon.jpg`, theme/shell wiring | DEFERRED FUTURE WORK | Verified Phase 23A/B brand work; needs clean UI promotion after human acceptance — not UNKNOWN |

---

## Verified implementation missing from main

```text
After Gate 5 docs PR: Phase 21 sanitizeNextPath + security headers were still missing (classification follow-up).
After Gate 5 follow-up PR: those Phase 21 escapes + Production /design-system 404 are promoted.

Remaining verified-but-deferred (not blocking UNKNOWN):
- Professionals mark / logo assets + shell wiring (Phase 23A/B polish)
```

Phase 18A importer modules + Phase 21 escape remediations + surgical `/design-system` Production 404 are on `main`.

Phase 23 brand/theme/navigation application implementation remains **intentionally deferred** (not UNKNOWN).

---

## Release-relevant UNKNOWN paths

```text
0
```
