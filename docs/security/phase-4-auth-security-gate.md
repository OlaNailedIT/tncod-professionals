# Phase 4 — Authentication and runtime security gate

**Status:** `REMEDIATION CANDIDATE — PRODUCTION PASS WITHHELD`

**Date:** 2026-09-25

**Authoritative branch:** `phase4-auth-security-lock`

**Candidate commit:** `771fe74`

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

## Candidate evidence

| Check | Result |
| --- | --- |
| TypeScript | **PASS** |
| ESLint | **PASS** |
| Prisma schema validation | **PASS** |
| Vitest | **PASS — 48 files / 224 tests** |
| Optimized Next.js Production build | **PASS** |
| Direct Supabase signup | **DENIED** |
| Auth Admin create + trigger default | **PASS — `DEACTIVATED`** |
| Existing-member OTP exchange | **PASS** |
| OTP replay | **DENIED** |
| Registration distributed limit | **PASS — ninth attempt denied** |
| Production Phase 3 database gate | **PASS — LOCKED separately** |

## Remaining Production stop conditions

Phase 4 must not be marked `PASS`, `COMPLETE`, or `LOCKED`, and this pull request must not merge, until all of the following are evidenced:

1. A real Cloudflare Turnstile widget is provisioned for `tncod-professionals-azure.vercel.app`.
2. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are configured in Vercel Production; test keys are forbidden.
3. The candidate is deployed and Production `/join`, existing-member OTP, inactive-account denial, POST-only sign-out, disabled helper routes, and `/api/health` are exercised successfully.
4. The Production deployment is linked to the merged authoritative commit.
5. This report is updated with immutable deployment and merge evidence and then changed to `PASS — COMPLETED AND LOCKED`.

## Accepted plan-gated limitation

Supabase leaked-password protection cannot be enabled on the current plan; the provider rejected the setting with a plan-required response. The application is passwordless/OTP-only and direct signup is disabled. This item is an explicit hosting-plan decision, not evidence of a control being enabled.

## Decision

`NO-GO FOR PHASE 5` until the Production stop conditions above are closed.
