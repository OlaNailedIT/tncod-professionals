# Phase 4 — Authentication and runtime security gate

**Status:** `CONTROLLED-PILOT LOCK EVIDENCE RECORDED` — **NOT** unrestricted `PASS / COMPLETE / LOCKED`. **NO-GO FOR PHASE 5.**

**Evidence checkpoint:** 2026-10-08

**Merged:** PR #3 → `main` @ `96ebbc00f35273fe1d9f4dd4940879253a35e845`

**Git-linked Production:** `dpl_ExJFQusLeKWrnd3BJZGvcuq8iVTp` → `https://tncod-professionals-azure.vercel.app` (+ `…-git-main-…`)

**Pre-merge Auth candidate:** `aa4db3a` / `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ`

SoT detail: `docs/security/phase-4-evidence-ledger.md`.

## Implemented remediation

- Auth Admin registration; DEACTIVATED→ACTIVE; compensation; active-identity guard; account↔ban sync.
- Turnstile + registration rate limits; same-origin `POST /api/auth/request-otp` (neutral E-UI; PKCE cookies).
- Inactive OTP denial; POST-only sign-out; Production helpers 404; Auth URL tooling; soft-deleted duplicate detection.

## Runtime evidence

| Check | Result |
| --- | --- |
| Migrations / Vitest | **20/20**; **56/252 PASS** |
| Magic Link 1′ on `dpl_GwHB…` | **PASS** (Auth `/otp` 200, `/verify` 303, `/token` 200) |
| EXCO / stale-session / inactive / sign-out / helpers / signup | **PASS** |
| E-UI | **PASS (scoped)** |
| E-API public `/auth/v1/otp` | **NOT PASS — known residual** (200 vs 422). Not fixed. |
| Git-linked `main` Production + azure | **VERIFIED** `dpl_ExJF…` / `96ebbc0` |
| Post-merge sign-in (retained pinned identity) | **PASS** (`/dashboard` 200) |
| Controlled identity residue-zero | **PASS** |

## Accepted limitations

### Plan-gated

Leaked-password protection unavailable on current plan.

### `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

Residual hosted `/auth/v1/otp` membership enumeration accepted **only** for the restricted controlled pilot. Do not claim the public provider endpoint is fixed. **Mandatory reassessment before unrestricted launch.**

## Sequencing executed

Retain-only-approved-test-identity through post-merge sign-in → cleanup → residue-zero → this lock evidence. No new accounts; no real members.

## Decision

`NO-GO FOR PHASE 5`.  
Unrestricted Phase 4 **PASS / COMPLETE / LOCKED** remains **withheld** pending future launch gate under a reassessed E-API posture.
