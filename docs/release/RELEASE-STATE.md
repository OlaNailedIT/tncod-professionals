# TNCOD Professionals — Release State

**Authority date:** 2026-10-16 (LC-A reconciliation)  
**Release Gate 5:** Release hygiene / clean source reconstruction (historical)  
**Launch Completion:** stages LC-A–LC-G organize remaining work; historical phases retain contracts. Operational backlog: `docs/release/gate-6b-action-board.md`.  
**Authoritative Git SHA (`origin/main` tip):** `1a699153cb6259628c9dc1372051aec5f1bf4b04` (PR #22 merge)  
**Authoritative Production (live Ready / azure):** Vercel `dpl_DTe6dmsQ51fckqdYPtQmhZZEzJRX` · application tree identical to reviewed head `b80bc5d` · azure `https://tncod-professionals-azure.vercel.app`  
**LC-B note:** Git-linked webhook created **no** deployment for `1a69915` after merge (deployment absent, not a failed build). Recovered 2026-10-16 via CLI Production deploy from clean checkout of that merge SHA on the linked project; azure alias updated. Signed-in Member↔EXCO acceptance still pending. **OPEN reliability:** automatic Git→Vercel Production trigger for that merge remains unexplained (symptom ≠ root cause); does not block signed-in acceptance.  
**LC-C note:** AUTH-A resource/cost gate resolved: independently verified Free/$0; isolated hosted `hyzkearnbhxznkeokacj` under explicit approval. Provider/SSR **32/32**, targeted tests **43/43**, build/local **12/12**, legacy-disabled runtime **15/15** passed; **141** public artifacts scanned clean (overlapping runs). First real local application journey passed **1 test / 19 checks**, including email/PKCE, saved profile and roles. Expanded run failed at new local email delivery (Auth HTTP 429 observed; configured two emails/hour; exact provider code unconfirmed): **1 failed test**, numerical-code/refresh/Storage not reached. No retry/reset to manufacture PASS. Draft #25 at `2fc52aa`; remaining consumer/real CAPTCHA/rollback checks and separate Production approval required. See `docs/release/auth-a-hosted-proof.md`. No Production cutover or public-launch PASS.

**Subsequent LC-C evidence:** draft #25 now at `da62f1c`. Independent private
Storage/document authorization and canonical account-control proof passed
**1 test / 16 checks**, without another email. Initial component failure
after 12 checks is retained; cause unconfirmed, no application/permission
change made. This advances component acceptance only: numeric-code UI,
browser refresh, signed-document HTTP, real CAPTCHA, rollback and Production
approval remain open. Earlier failed email run is not erased.

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
- **LC-B** — PR #23 dashboard clarity merge/release after review (`docs/release/pr-23-review.md`) — do not re-implement
- **LC-C / AUTH-A** — provider-level E-API residual (unrestricted launch blocked; pilot exception remains; cutover unapproved)
- **LC-C / AUTH-B** — owner confirmations for remaining reclaim candidates
- **LC-F / PRIVACY-L1** — Privacy Notice **legal** sign-off (factual `/privacy` deployed)
- **LC-E / Phase 23C** — remaining packet rows (owner-reported navigation/profile/privacy checks carry forward; device models not recorded)
- **LC-E / Phase 23D** — participant comprehension (dashboard PR is only a partial implementation)
- **LC-E** — Controlled pilot closeout (human)
- **LC-F** — Dashboard backup **class** confirmation (schema-only disposable restore drill **PASS**)
- **LC-F** — Protected production-data recovery drill (not executed)
- Monitoring alerting (optional; dashboards / procedure exist)
- Headshot UX / export / CRM / public business discovery — **deferred** (not launch blockers)

---

## Dirty workspace policy

A long-running local dirty tree (~218 paths) was treated as **forensic evidence** during Gate 5.

- Do **not** `git reset --hard`, bulk-commit, or delete that tree as part of release hygiene.
- Promote only intentional, verified, secret-free units.
- Remaining differences must carry explicit disposition in `docs/release/dirty-tree-disposition.md`.
