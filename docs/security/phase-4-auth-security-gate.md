# Phase 4 — Authentication and runtime security gate

**Status:** `REMEDIATION CANDIDATE — PRODUCTION PASS WITHHELD`

**Evidence checkpoint:** 2026-10-03

**Authoritative branch:** `phase4-auth-security-lock`

**Candidate code commit:** `491a63c3b773ecd08874fb879a8735ec3c74c30e`

This gate supersedes the narrow 2026-09-06 local-foundation completion claim for production-readiness purposes. The historical runtime report remains valid evidence for the scope it tested, but it did not test the later product registration, OTP, account-state, abuse-control, and Production deployment boundaries covered here.

## Implemented remediation

- Supabase self-registration is disabled; application registration uses Auth Admin creation.
- New Auth identities default to `DEACTIVATED` and application activation is the final write of one domain transaction.
- Failed registration compensates Auth and domain state and remains fail-closed if cleanup is incomplete.
- One active-identity guard protects sessions, pages, API routes, server actions, role loaders, and permission loaders.
- Suspension/deactivation synchronizes the application account with an Auth ban and rolls the Auth transition back if the database write fails.
- Registration uses database-backed atomic throttling and fail-closed Cloudflare Turnstile verification.
- Duplicate registration and unknown-member OTP requests use neutral responses.
- OTP verification rejects inactive identities and replayed or expired tokens without exposing provider details.
- Sign-out is POST-only.
- Production helper routes return 404 even if their feature flag is accidentally enabled.
- Canonical Supabase Auth site URL, redirect allow-list, provider state, and disabled signup have executable repair/verification tooling.
- Registration duplicate detection covers soft-deleted email and phone tombstones, and the Turnstile widget no longer remounts when form state changes.

## Candidate evidence

| Check | Result / scope |
| --- | --- |
| Local migration rebuild | **PASS — all 19 migrations on disposable Postgres, 2026-10-03** |
| Full Vitest after seed | **PASS — 54 files / 246 tests, 2026-10-03** |
| TypeScript, ESLint, Prisma schema validation | **PASS — candidate code** |
| Optimized Next.js Production build | **PASS — candidate code, including Vercel build** |
| Direct Supabase signup | **DENIED — prior negative test; fresh Production rerun pending** |
| Auth Admin create + trigger default | **PASS — `DEACTIVATED` in disposable test** |
| Existing-member OTP exchange / replay | **PASS / DENIED in prior disposable test; Production inbox check pending** |
| Registration distributed limit | **PASS — ninth attempt denied in prior test** |
| Production candidate | **READY — `dpl_E5ewtu5hPseCo9nUDJGyYk36mr79`, canonical alias confirmed, 2026-10-02** |
| Production smoke | **`/join` 200; `/api/health` 200; sign-out GET 405; helper POSTs 404** |
| Production registration | **NOT VERIFIED — 2026-10-03 attempt matched existing soft-deleted email and phone and intentionally returned neutral success; no new account created** |
| Production Phase 3 database gate | **PASS — LOCKED separately** |

## Remaining Production stop conditions

Phase 4 must not be marked `PASS`, `COMPLETE`, or `LOCKED`, and this pull request must not merge, until all of the following are evidenced:

1. Confirm the hosted Magic Link email template contains both `{{ .Token }}` and `{{ .ConfirmationURL }}`, with no secret copied into the gate.
2. Register a genuinely new controlled Production identity with a unique email and phone, then verify inbox OTP delivery, one-time consumption/replay denial, expiry, and the canonical `/auth/callback` link.
3. Exercise Production inactive-account denial, stale-session invalidation, EXCO-role revocation, and POST-only sign-out with a controlled disposable identity; restore or clean up test state afterward.
4. Reconcile the one incomplete `DEACTIVATED` Auth/domain identity created 2026-09-29, which has no profile and no durable cleanup job. Its origin and ownership are not yet confirmed; do not delete it by assumption.
5. Record the plan-gated legacy-password decision explicitly: accept the current Free-plan exception or upgrade for provider-enforced OTP-only.
6. Merge PR #3 only after these runtime gates pass, then verify the Git-linked Production deployment matches the merged authoritative commit.
7. Update this report with immutable runtime, deployment, merge, and cleanup evidence before changing it to `PASS — COMPLETED AND LOCKED`.

## Accepted plan-gated limitation

Supabase leaked-password protection cannot be enabled on the current plan; the provider rejected the setting with a plan-required response. The application is passwordless/OTP-only and direct signup is disabled. This item is an explicit hosting-plan decision, not evidence of a control being enabled.

## Decision

`NO-GO FOR PHASE 5` until the Production stop conditions above are closed.
