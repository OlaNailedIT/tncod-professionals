# Phase 4 — Production evidence ledger (one page)

**Status:** `CONTROLLED-PILOT LOCK EVIDENCE RECORDED` — **not** unrestricted Phase 4 PASS/LOCKED. **No Phase 5.**

**Merge:** PR #3 → `main` @ `96ebbc00f35273fe1d9f4dd4940879253a35e845` (2026-10-08)  
**Merge:** PR #4 → `main` @ `33ad92a4ef239efc44583b1fb9c36dc7dcae9c98` (2026-10-08) — join reclaim UX + operator reclaim  
**Git-linked Production (PR #4):** `dpl_F2n5QJnHz7dvUt6fA9rMK4QfHz6a` → azure (SHA `33ad92a`); `/join/success` shows “Request received” + church-channel support  
**Prior Git-linked Production:** `dpl_ExJFQusLeKWrnd3BJZGvcuq8iVTp` (SHA `96ebbc0`)  
**Pre-merge Auth candidate:** `aa4db3a` on `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ`

| # | Control | Result | Evidence | Deploy |
| --- | --- | --- | --- | --- |
| 1 | Magic Link (browser-PKCE) | **PASS** | Human 2026-10-07 | `dpl_6qUh…` |
| 1′ | Magic Link same-origin OTP | **PASS** | Dashboard; Auth `/otp` 200 05:24:56 UTC, `/verify` 303 05:25:30, `/token` 200 05:25:34 (2026-10-08) | `dpl_GwHB…` |
| 2a–2b | EXCO grant/revoke same session | **PASS** | Human + DB | `dpl_6qUh…` |
| 3 | Stale-session denial | **PASS** | Probe | `dpl_6qUh…` |
| 4 | POST sign-out | **PASS** | Human + probes | `dpl_6qUh…` |
| 5 | Inactive new-sign-in denial | **PASS** | Human | `dpl_6qUh…` |
| 6a–6c | Signup / helpers / GET 405 | **PASS** | Probes | Prod Auth + `dpl_6qUh…` |
| E-UI | TNCOD sign-in neutral | **PASS (scoped)** | Same-origin | `dpl_GwHB…` / `dpl_ExJF…` |
| E-API | Public `/auth/v1/otp` non-enumerating | **NOT PASS — residual** | Member 200 vs unknown 422. **Not fixed.** | GoTrue |
| M | Post-merge sign-in on Git-linked `main` | **PASS** | Retained identity; admin OTP session → `/dashboard` **200** on azure/`dpl_ExJF…` | `dpl_ExJF…` |
| C | Controlled identity residue-zero | **PASS** | Soft-deleted user+profile; roles 0; Auth absent; `active_product=false` | Prod DB/Auth |

## `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

Residual public `/auth/v1/otp` enumeration accepted **only** for restricted controlled pilot. E-UI scoped PASS. E-API not PASS. Reassess before unrestricted launch.

**Abuse controls (depth):** `disable_signup`; signup 422; same-origin OTP; GET sign-out 405; helpers 404; registration Turnstile + DB rate limit; provider OTP rate limits.

## Sequencing (executed)

1. Pre-merge assertions complete (incl. 1′).  
2. Merged PR #3; Git-linked Production `dpl_ExJF…` / `96ebbc0` + azure **verified**.  
3. Retained pinned identity; post-merge sign-in **PASS**.  
4. Cleanup + **RESIDUE_ZERO true**.  
5. This controlled-pilot lock evidence commit.

**Automated:** migrations 20/20; Vitest 56/252 PASS (2026-10-08).

**Pinned identity:** `df709e23-…` cleaned; no longer an active product identity.

## Identifier reclaim (2026-10-08) — one record

**Authorization:** owner confirmed reclaim of `df709e23-1a55-4ba4-bfac-dde6740512ff` + PR #4 deploy.  
**Snapshot:** ACL-private dir under `%LOCALAPPDATA%\TNCOD-Professionals-Reclaim\` (outside repo; contents not logged).  
**Apply:** `OK true`, `CHANGED true` — email → tombstone `@tombstone.invalid`, phone → `NULL`.  
**Independent verify (masked):** tombstone email; phone null; soft-deleted; Auth absent (admin + SQL); original email/phone free for new `/join`.  
**Human `/join` + member OTP + dashboard:** **PENDING owner** (admin session is not a substitute).  
**Phase 4 unrestricted PASS:** **not** claimed. Controlled-pilot E-API residual unchanged.
