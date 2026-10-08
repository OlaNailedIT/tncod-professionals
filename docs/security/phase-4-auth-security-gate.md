# Phase 4 — Authentication and runtime security gate

**Status:** `CONTROLLED-PILOT CANDIDATE — NOT PASS / NOT LOCKED`

**Evidence checkpoint:** 2026-10-08

**Authoritative branch:** `phase4-auth-security-lock`

**Auth code on Production:** `aa4db3a043a3b9f856f503ad39d8d45a6d3148c3` (same-origin OTP send)

**Production deployment:** `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ` → canonical alias `https://tncod-professionals-azure.vercel.app` (CONFIRMED 2026-10-08)

**Note:** `140ccbf` only changes a forensic probe script relative to `aa4db3a`; it is not a distinct Production Auth binary. Documentation commits after `aa4db3a` are documentation-only.

This gate supersedes the narrow 2026-09-06 local-foundation completion claim for production-readiness purposes. One-page runtime SoT: `docs/security/phase-4-evidence-ledger.md`.

## Implemented remediation

- Supabase self-registration is disabled; application registration uses Auth Admin creation.
- New Auth identities default to `DEACTIVATED` and application activation is the final write of one domain transaction.
- Failed registration compensates Auth and domain state and remains fail-closed if cleanup is incomplete.
- One active-identity guard protects sessions, pages, API routes, server actions, role loaders, and permission loaders.
- Suspension/deactivation synchronizes the application account with an Auth ban and rolls the Auth transition back if the database write fails.
- Registration uses database-backed atomic throttling and fail-closed Cloudflare Turnstile verification.
- TNCOD sign-in OTP request uses same-origin `POST /api/auth/request-otp` with neutral member/unknown JSON (scoped anti-enumeration on the product path).
- OTP verification rejects inactive identities and replayed or expired tokens without exposing provider details.
- Sign-out is POST-only.
- Production helper routes return 404 even if their feature flag is accidentally enabled.
- Canonical Supabase Auth site URL, redirect allow-list, provider state, and disabled signup have executable repair/verification tooling.
- Registration duplicate detection covers soft-deleted email and phone tombstones, and the Turnstile widget no longer remounts when form state changes.

## Candidate evidence (runtime)

| Check | Result / scope |
| --- | --- |
| Local migration rebuild | **PASS — 20/20 migrations on disposable Postgres, 2026-10-08** |
| Full Vitest after seed | **PASS — 56 files / 252 tests, 2026-10-08** |
| Direct Supabase signup | **DENIED — `disable_signup=true`; signup 422, 2026-10-08** |
| Magic Link (pre same-origin OTP) | **PASS — human, `66b7d9b` / `dpl_6qUh…`, 2026-10-07** |
| Magic Link on `dpl_GwHB…` / `aa4db3a` | **UNPROVEN — awaiting one fresh human Magic Link** |
| EXCO grant/revoke same session | **PASS — human + DB, 2026-10-07** |
| Stale-session denial | **PASS — probe, 2026-10-08** |
| Inactive new-sign-in denial | **PASS — human, 2026-10-07/08** |
| POST sign-out + protected denial | **PASS — human + probes** |
| Helpers 404 / GET sign-out 405 | **PASS** |
| TNCOD sign-in enumeration (E-UI) | **PASS (scoped)** — neutral app responses on `dpl_GwHB…` |
| Public Supabase `/auth/v1/otp` (E-API) | **NOT PASS — known residual** (member 200 vs unknown 422). Enumeration **not** eliminated. |

## Accepted limitations

### Plan-gated (hosting)

Supabase leaked-password protection cannot be enabled on the current plan; the provider rejected the setting with a plan-required response. The application is passwordless/OTP-only and direct signup is disabled.

### Controlled-pilot exception — direct OTP membership enumeration

**Decision:** `ACCEPT CONTROLLED-PILOT EXCEPTION`  
**Date:** 2026-10-08  

- **In scope:** Restricted controlled pilot only (not unrestricted / public launch).
- **E-UI:** Scoped PASS — TNCOD’s own sign-in responses are neutral for member/unknown.
- **E-API:** Known residual on public hosted `POST /auth/v1/otp` (member **200** vs unknown **422**). Do **not** mark this endpoint PASS. Do **not** claim membership enumeration was eliminated.
- **Verified abuse controls (defense in depth, not an E-API fix):** `disable_signup`; signup deny; same-origin OTP neutralization; POST-only sign-out (GET 405); Production helper 404s; registration Turnstile + distributed rate limit (prior evidence); provider OTP rate limits exist.
- **Mandatory reassessment:** Before any unrestricted launch authorization. This exception **does not** carry forward to public launch without a new decision.

## Remaining stop conditions (before merge / controlled-pilot lock)

Phase 4 must **not** be marked `PASS`, `COMPLETE`, or `LOCKED` until:

1. One fresh Magic Link succeeds on `dpl_GwHB…` / `aa4db3a` (record callback + dashboard; no link/code in evidence).
2. Pinned controlled identity cleanup with residue-zero proof.
3. This gate + PR #3 description reconciled to final SHA / deploy / exception text.
4. PR #3 merged; Git-linked `main` Production deployment and canonical azure alias verified.
5. Final controlled-pilot lock evidence committed (still **not** an unrestricted-launch lock).

## Decision

`NO-GO FOR PHASE 5`.  
`NO Phase 4 PASS/LOCKED` until remaining stop conditions close under the controlled-pilot exception above.
