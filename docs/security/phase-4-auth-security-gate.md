# Phase 4 — Authentication and runtime security gate

**Status:** `CONTROLLED-PILOT CANDIDATE — NOT PASS / NOT LOCKED` (pre-merge complete except release sequence)

**Evidence checkpoint:** 2026-10-08

**Authoritative branch:** `phase4-auth-security-lock`

**Auth code on Production (pre-merge):** `aa4db3a043a3b9f856f503ad39d8d45a6d3148c3`

**Production deployment (pre-merge):** `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ` → `https://tncod-professionals-azure.vercel.app`

One-page SoT: `docs/security/phase-4-evidence-ledger.md`.

## Implemented remediation

- Supabase self-registration disabled; Auth Admin registration; DEACTIVATED→ACTIVE activation; compensation/cleanup fail-closed.
- Active-identity guard; account-status ↔ Auth ban sync; Turnstile + registration rate limits.
- TNCOD sign-in OTP via same-origin `POST /api/auth/request-otp` (neutral member/unknown JSON; PKCE cookies on response).
- Inactive OTP denial (neutral copy); POST-only sign-out; Production helpers 404.
- Auth site URL / redirect tooling; soft-deleted duplicate detection; stable Turnstile remount.

## Runtime evidence

| Check | Result |
| --- | --- |
| Migrations disposable | **PASS — 20/20, 2026-10-08** |
| Vitest after seed | **PASS — 56 files / 252 tests, 2026-10-08** |
| Signup denied | **PASS** |
| Magic Link on `dpl_GwHB…` (1′) | **PASS** — dashboard; Auth `/otp` 200 @ 05:24:56 UTC, `/verify` 303 @ 05:25:30, `/token` 200 @ 05:25:34 (2026-10-08) |
| EXCO / stale-session / inactive / sign-out / helpers | **PASS** (ledger) |
| E-UI (TNCOD sign-in) | **PASS (scoped)** |
| E-API (public `/auth/v1/otp`) | **NOT PASS — known residual** (200 vs 422). Not fixed. |

## Accepted limitations

### Plan-gated

Leaked-password protection unavailable on current Free plan; app is passwordless/OTP-only; signup disabled.

### `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

Residual direct hosted `/auth/v1/otp` membership enumeration accepted **only** for the restricted controlled pilot. E-UI scoped PASS. E-API not PASS; enumeration not eliminated. Abuse controls listed in the ledger are defense in depth. **Mandatory reassessment before unrestricted launch.**

## Sequencing — retain controlled identity through post-merge sign-in

Pinned identity `df709e23-…` is the only approved Production test identity.

1. Merge PR #3 when pre-merge assertions are complete.  
2. Verify Git-linked `main` Production deploy + azure alias.  
3. **Retain** identity; prove sign-in/session on that deploy (`post-merge-signin` lifecycle script or human Magic Link — no new account; no real member).  
4. Cleanup pinned identity only; prove residue-zero.  
5. Commit controlled-pilot lock evidence. **Do not** label unrestricted Phase 4 PASS/LOCKED. **No Phase 5.**

## Decision

`NO-GO FOR PHASE 5`.  
Phase 4 **not** PASS/LOCKED until the release sequence above completes under the controlled-pilot exception.
