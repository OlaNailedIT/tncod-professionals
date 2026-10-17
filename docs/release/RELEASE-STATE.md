# TNCOD Professionals — Release State

**Authority date:** 2026-10-17 (AUTH-A Stage B private configuration deployed; acceptance incomplete; Stage C unapproved)
**Release Gate 5:** Release hygiene / clean source reconstruction (historical)  
**Launch Completion:** stages LC-A–LC-G organize remaining work; historical phases retain contracts. Operational backlog: `docs/release/gate-6b-action-board.md`.  
**Authoritative Git SHA (`origin/main` tip):** `bcd113de137bde1216aa147fc9cc699b40156884` (PR #25 merge; PR #22/#23 included)

**Authoritative Production (live Ready / azure):** Vercel `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC` · source CLI, clean reviewed `bcd113d` checkout and matching `meta.gitCommitSha`; actual azure alias pointer verified after staged tests and promotion. Private config is live; fresh emailed-code sign-in, existing-session continuity, renewal/token rotation and desktop Member↔EXCO passed. Registration/document/logout acceptance remains open. Evidence: `docs/release/auth-a-stage-b-release.md`. Earlier Stage A Git-linked build/CI evidence is retained separately.
**LC-B note:** Git-linked webhook created **no** deployment for `1a69915` after merge (deployment absent, not a failed build). Recovered 2026-10-16 via CLI Production deploy from clean checkout of that merge SHA on the linked project; azure alias updated. Fresh signed-in desktop Member↔EXCO acceptance passed on the Stage B release; physical phone/tablet acceptance remains separate. **OPEN reliability:** automatic Git→Vercel Production trigger for that historical merge remains unexplained (symptom ≠ root cause).
**LC-C note:** AUTH-A non-Production core acceptance is passing: hosted
provider/SSR 32 checks; earlier strict build/key-isolation checks; actual local
PKCE/profile/role journey 19 checks; Storage/account-control components 16
checks; focused numeric OTP/session renewal/signed-document HTTP 13 checks
(the latter: 1 test passed, 0 failed, 0 skipped). Runs overlap; do not sum them
as unique acceptance criteria. Earlier failed attempts remain in the reports.
The two-email quota hypothesis was not proven: runtime inspection found a
different local setting. Existing CAPTCHA evidence is carried forward with
unchanged control code; no fresh Production registration is claimed.
PR #25 head `ab9080b` was reviewed and released under explicit Stage A approval.
Separate Stage B approval then covered private Production configuration and a
fresh publishable key, while retaining all existing provider keys and 16 unrelated
environment entries. No migration/role change or paid resource. Stage B acceptance
and external-consumer reconciliation remain incomplete; Stage C is unapproved.
AUTH-A/public-launch PASS stays withheld. See `auth-a-stage-b-release.md`.
Evidence: `docs/release/auth-a-hosted-proof.md`.

**LC-F note:** Free plan identified. Use the $0 operator-managed recovery
proposal in `docs/operations/free-tier-recovery-plan.md`; do not require a
paid backup/PITR feature. Protected destination/key custody, operator/cadence,
export authorization and actual data-plus-objects restore remain unproven.

**Hosting read-only check:** existing Vercel team/project is active Hobby;
GitHub link and `main` production branch match. No paid change. Plan identity
does not resolve exact permitted-use fit for professional/service listings;
provider clarification and usage monitoring remain an operating decision.
See `docs/release/hosting-free-plan-check.md`. Historical missing automatic
deployment root cause remains unconfirmed; current auto-assignment is true.

This document is the **current release-state summary** for humans and agents.  
It does not replace locked phase contracts. It reconciles verified Production/gate evidence with repository status.

---

## Source-of-truth hierarchy

```text
Database schema authority  → supabase/migrations/*.sql
Prisma                     → derived application representation
Product contracts          → locked / amended scope docs under docs/product/
Runtime                    → src/
Verification               → tests + sanitized evidence
Production                 → deployed state evidence (Git SHA + deployment metadata)
Deployment authority       → Git SHA + Vercel Production deployment metadata
```

The local dirty forensic workspace is **not** an authority. Do not promote it wholesale.

---

## Current verified baseline

| Control | Status |
| --- | --- |
| `origin/main` CI (Gate 4 PR #12) | **PASS** — workflow `.github/workflows/ci.yml` |
| `main` push CI | **PASS** |
| Production Git-link | **READY / SUCCESS** for known `main` SHA |
| Phase 20 authenticated Production EXCO analytics | **VERIFIED** |
| Auth origin / Site URL (azure canonical) | **MATCH** |
| Production test helpers | **DISABLED** |
| Phase 21 live PostgREST/RLS directory revoke | **VERIFIED** |
| Phase 18 Production import | **VERIFIED COMPLETE** (18/18) |

---

## Phase lock summary (authoritative)

```text
Phases 0–17     PASS / COMPLETE / VERIFIED / LOCKED
Phase 18 / 18A  PASS / COMPLETE / VERIFIED / LOCKED
Phase 19        PASS / COMPLETE / VERIFIED / LOCKED
Phase 20        PASS / COMPLETE / VERIFIED / LOCKED
Phase 20.5      PASS / COMPLETE / VERIFIED / LOCKED
Phase 21        PASS / COMPLETE / VERIFIED / LOCKED
Phase 22        PASS / COMPLETE / VERIFIED / LOCKED
Phase 23A / 23B PASS / COMPLETE / VERIFIED / LOCKED (see note below)
Phase 23C / 23D IMPLEMENTATION COMPLETE / VERIFICATION INCOMPLETE / NOT LOCKED
Phase 23 pilot  AUTHORIZED / IN PROGRESS
Phase 24+       NOT AUTHORIZED
```

### Phase 21 escape note (Gate 5 follow-up)

Classification follow-up found Phase 21 remediations that were **LOCKED / VERIFIED** but absent from `main` while Production tracked `main`:

- `sanitizeNextPath` path-traversal normalization (`src/lib/auth/safe-redirect.ts`)
- baseline security headers (`next.config.ts`)

These were restored surgically after Gate 5 (do not treat Gate 5 “implementation NONE” as final for those two paths).

### Phase 23 source note (important)

Phase 23A–D **product/status documentation** is restored on `main` by Release Gate 5.

Surgical Phase 23B Production `/design-system` → `notFound()` is restored on `main`.

Phase 23 **application UI / brand mark / theme / navigation implementation** historically lived in a divergent local dirty tree. Professionals mark assets + shell/theme wiring remain **deferred / intentionally local** until a future authorized promotion after human acceptance — they are **not** wholesale-promoted by Gate 5.

---

## Phase 18 — final truth

```text
PHASE 18 PRODUCTION IMPORT: VERIFIED COMPLETE
```

- Source rows: **18**
- Production attributable records: **18**
- Matched / missing / duplicate / ambiguous: **18 / 0 / 0 / 0**
- Auth-linked / `public.users` / profiles / strong legacy provenance: **18/18**
- Forensic verification Production mutations: **0**
- Do **not** re-run Production import without new explicit authorization

Historical preflight **BLOCKED** reports remain evidence of the earlier gate and must not be rewritten to pretend they never happened. See:

- `docs/product/phase-18-historical-google-form-migration-scope.md`
- `docs/product/phase-18a-auth-first-importer.md`
- `scripts/migrations/phase18/reports/production-execute-latest.md`
- `scripts/migrations/phase18/reports/production-post-import-reconciliation.md`

---

## Locked Auth residuals (unrestricted launch)

```text
AUTH-A  E-API provider-level enumeration residual is NOT accepted
        for unrestricted/public launch. Controlled pilot may continue.
        Unrestricted Auth PASS remains withheld until residual removed
        or separately reassessed to PASS.

AUTH-B  Remaining identifier-collision candidates must be individually
        resolved under the approved reclaim process before unrestricted launch.

AUTH-C  The designated working test account remains retained through
        controlled-pilot closeout.
```

Do **not** claim `AUTH PASS` or `UNRESTRICTED LAUNCH READY`.

---

## Privacy / V1 owner amendments

```text
PRIVACY-P1  Historical "consent management" V1 scope is amended.
            Current V1 requires:
            - clear privacy / data-use explanation
            - directory / profile visibility controls
            - appropriate notice / acknowledgement
            A generic consent-management engine is NOT required by product scope.

PRIVACY-L1  A published Privacy Notice is required before unrestricted launch.
            Exact final legal / privacy wording remains a sign-off item.
            Do not invent final legal wording in engineering gates.

V1-O1       Deferred post-launch:
            - EXCO export
            - dedicated job-seeker operations workspace
            - headshot upload UX
            - generic CRM-style member notes
            Verification-bound Admin+ notes and existing EXCO/reporting
            are sufficient for initial launch operations.
```

---

## Gate 6A — technical launch closeout (2026-10-12)

See also:

- `docs/release/auth-a-eapi-closeout.md`
- `docs/release/auth-b-collision-confirmation-packet.md`
- `docs/legal/privacy-notice-candidate.md` + `/privacy`
- `docs/operations/backup-restore.md`
- `docs/operations/monitoring.md`
- `docs/operations/incident-rollback.md`
- `docs/release/phase-23c-human-acceptance-packet.md`
- `docs/release/phase-23d-comprehension-packet.md`
- `docs/release/pilot-closeout-packet.md`

## Gate 6B — human acceptance board

Consolidated owner board: `docs/release/gate-6b-action-board.md`  
(AUTH-B / Privacy-L1 / backup class / 23C / 23D / pilot matrix).

## Remaining launch gates (not complete)

Mapped to Launch Completion (see board LC overview). Do not treat historical phase PASS as automatic clearance of these rows.

- **LC-B** — signed-in Member↔EXCO acceptance on azure after #22 Production recovery (`docs/release/pr-22-signed-in-acceptance.md`)
- **LC-B** — PR #21 interest roster release + named migration authorization (`docs/release/pr-21-release-packet.md`)
- **LC-B** — PR #23 dashboard clarity released; signed-in CTA acceptance remains (`docs/release/pr-23-review.md`) — do not re-implement
- **LC-C / AUTH-A** — private Stage B live, acceptance incomplete; provider E-API residual remains, Stage C unapproved (unrestricted launch blocked; pilot exception remains)
- **LC-C / AUTH-B** — owner confirmations for remaining reclaim candidates
- **LC-F / PRIVACY-L1** — Privacy Notice **legal** sign-off (factual `/privacy` deployed)
- **LC-E / Phase 23C** — remaining packet rows (owner-reported navigation/profile/privacy checks carry forward; device models not recorded)
- **LC-E / Phase 23D** — participant comprehension (dashboard PR is only a partial implementation)
- **LC-E** — Controlled pilot closeout (human)
- **LC-F** — Free-tier protected backup destination/key custody + operator/cadence acceptance (historical schema-only drill **PASS**)
- **LC-F** — Protected production-data recovery drill (not executed)
- Monitoring alerting (optional; dashboards / procedure exist)
- Headshot UX / export / CRM / public business discovery — **deferred** (not launch blockers)

---

## Dirty workspace policy

A long-running local dirty tree (~218 paths) was treated as **forensic evidence** during Gate 5.

- Do **not** `git reset --hard`, bulk-commit, or delete that tree as part of release hygiene.
- Promote only intentional, verified, secret-free units.
- Remaining differences must carry explicit disposition in `docs/release/dirty-tree-disposition.md`.
