# TNCOD Professionals — Release State

**Authority date:** 2026-10-12  
**Release Gate 5:** Release hygiene / clean source reconstruction  
**Authoritative Git SHA (at gate start):** `ba032a6` (`origin/main`)  
**Authoritative Production:** Git-linked Vercel Production deployment for the current `main` tip

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

## Remaining launch gates (not complete)

- AUTH-A — provider-level E-API residual (unrestricted launch blocked)
- AUTH-B — owner confirmations for remaining reclaim candidates
- PRIVACY-L1 — Privacy Notice **legal** sign-off
- Phase 23C — real phone/tablet human acceptance
- Phase 23D — participant / task comprehension evidence
- Controlled pilot closeout (human)
- Backup/restore drill (operator + disposable target)
- Monitoring alerting (optional; dashboards exist)
- Phase 23 brand/theme/navigation UI (intentionally deferred)

---

## Dirty workspace policy

A long-running local dirty tree (~218 paths) was treated as **forensic evidence** during Gate 5.

- Do **not** `git reset --hard`, bulk-commit, or delete that tree as part of release hygiene.
- Promote only intentional, verified, secret-free units.
- Remaining differences must carry explicit disposition in `docs/release/dirty-tree-disposition.md`.
