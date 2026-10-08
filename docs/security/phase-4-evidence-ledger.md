# Phase 4 — Production evidence ledger (one page)

**Status:** `CONTROLLED-PILOT` — live reclaim `/join` **PASS** recorded; **not** unrestricted Phase 4 PASS/LOCKED. **No Phase 5.**

**Merge:** PR #3 → `main` @ `96ebbc00f35273fe1d9f4dd4940879253a35e845` (2026-10-08)  
**Merge:** PR #4 → `main` @ `33ad92a4ef239efc44583b1fb9c36dc7dcae9c98` (2026-10-08) — join reclaim UX + operator reclaim  
**Merge:** PR #5 → `main` @ `1fc939aa8f6059329f304db7d3c7df3d16d05568` (2026-10-08) — reclaim tx timeout + ledger  
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
| R1 | One-record identifier reclaim | **PASS** | Owner-authorized apply `CHANGED true`; tombstone + phone null; Auth absent; identifiers freed | Prod DB |
| R2 | Human `/join` after reclaim | **PASS** | Owner 2026-10-08: reclaimed identifiers reused (`s***@gmail.com` / phone `234…74`); new Auth `008480d8…` + ACTIVE user + profile + professional details + MEMBER; member OTP sign-in; PRIVATE / NOT_REVIEWED | `dpl_F2n5…` / azure |
| R3 | Second live `/join` (distinct unused pair) | **PASS** | Observed 2026-10-08 ~09:42 UTC — distinct from R2 reclaim path: `d***@gettingahead.ng` / phone `234…62`; Auth `6f98bc2a…`; ACTIVE + profile + professional details + MEMBER; PRIVATE / NOT_REVIEWED | `dpl_F2n5…` / azure |

## `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

Residual public `/auth/v1/otp` enumeration accepted **only** for restricted controlled pilot. E-UI scoped PASS. E-API not PASS. Reassess before unrestricted launch.

**Abuse controls (depth):** `disable_signup`; signup 422; same-origin OTP; GET sign-out 405; helpers 404; registration Turnstile + DB rate limit; provider OTP rate limits.

## Sequencing (executed)

1. Pre-merge assertions complete (incl. 1′).  
2. Merged PR #3; Git-linked Production `dpl_ExJF…` / `96ebbc0` + azure **verified**.  
3. Retained pinned identity; post-merge sign-in **PASS**.  
4. Cleanup + **RESIDUE_ZERO true**.  
5. This controlled-pilot lock evidence commit.

**Automated:** migrations 20/20; Vitest **290 passed | 2 skipped (292)** / **62** files PASS (2026-10-08) — 2 skipped = disposable synthetic live cases without `PHASE4_DISPOSABLE_AUTH_TESTS=1`; with opt-in disposable synthetic **3/3 PASS**.

**Pinned identity:** `df709e23-…` cleaned; no longer an active product identity.

## Identifier reclaim (2026-10-08) — one record

**Authorization:** owner confirmed reclaim of `df709e23-1a55-4ba4-bfac-dde6740512ff` + PR #4 deploy.  
**Snapshot:** ACL-private dir under `%LOCALAPPDATA%\TNCOD-Professionals-Reclaim\` (outside repo; contents not logged).  
**Apply:** `OK true`, `CHANGED true` — email → tombstone `@tombstone.invalid`, phone → `NULL`.  
**Independent verify (masked):** tombstone email; phone null; soft-deleted; Auth absent (admin + SQL); original email/phone free for new `/join`.  
**Human `/join` + member OTP + dashboard (R2 — reclaim path):** **PASS** (owner-verified 2026-10-08). Reused reclaimed `s***@gmail.com` / `234…74`; new Auth `008480d8…`; matching ACTIVE application account, profile, professional details, MEMBER; Supabase sign-in recorded; PRIVATE / NOT_REVIEWED. Admin-generated session was **not** used as the proof.  
**Second live registration (R3 — distinct unused pair):** **PASS** (observed 2026-10-08). Separate from R2: `d***@gettingahead.ng` / `234…62`; Auth `6f98bc2a…`; ACTIVE + profile + professional details + MEMBER; PRIVATE / NOT_REVIEWED. Masked read-only verify via `scripts/phase4-masked-active-since.ts`.  
**Honest scope:** two live unused-pair paths (reclaim-reuse + distinct) follow the same registration code; this still does **not** guarantee every registration. Masked Production inventory (2026-10-08): soft-deleted **10** (Auth-absent); reclaim candidates **8**; already tombstoned **2**; phones retained among Auth-absent **6**. Reusing candidate identifiers can still yield neutral “Request received” without Auth. See `phase-4-remaining-identifier-recovery.md`.  
**Disposable synthetic registrations (full Auth):** **PASS** (2026-10-08 re-run) — opt-in `PHASE4_DISPOSABLE_AUTH_TESTS=1` + verified loopback DB/Auth only (no personal `.env` path / no implicit fallback / hosted refused); 3 unused `@example.invalid` pairs + soft-deleted collision neutral; cleanup reports failures. Fail-closed without opt-in (live cases skipped). See `synthetic-registration.integration.test.ts` + `disposable-env-gate.ts`.  
**Working test account:** **retain** — do not clean up yet. **No bulk-delete** of remaining soft-deleted rows.  
**Phase 4 unrestricted PASS:** **not** claimed. Controlled-pilot E-API residual unchanged. **No Phase 5.**
