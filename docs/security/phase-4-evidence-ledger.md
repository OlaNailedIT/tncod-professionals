# Phase 4 — Production evidence ledger (one page)

**Branch:** `phase4-auth-security-lock`  
**Head SHA:** `140ccbf043a3…` / short `140ccbf`  
**Current Production (CLI):** `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ` → alias `https://tncod-professionals-azure.vercel.app` (2026-10-08)  
**Prior Production (Magic Link / EXCO / sign-out human gates):** `dpl_6qUhLT5YMvHBVVFBEjqQx5YD7VnY`  
**Controlled identity:** `df709e23-…` / `smiley7605+tncodphase4oct03@…` only — still ACTIVE/MEMBER; cleanup not run  

| # | Control / exact assertion | Result | Evidence | SHA | Deploy |
| --- | --- | --- | --- | --- | --- |
| 1 | Fresh Magic Link → `/dashboard` on browser-PKCE candidate | **PASS** | Human 2026-10-07 dashboard / signed-in | `66b7d9b` | `dpl_6qUh…` |
| 1′ | Magic Link after same-origin OTP route | **UNPROVEN** | PKCE cookies now from `POST /api/auth/request-otp`; one live Magic Link required on `dpl_GwHB…` | `140ccbf` | `dpl_GwHB…` |
| 2a–2b | EXCO grant access + same-session revoke denial | **PASS** | Human + DB role grant/revoke 2026-10-07 | `66b7d9b` | `dpl_6qUh…` |
| 3 | Stale-session `/dashboard` denial (session before deactivation) | **PASS** | Probe: before **200**; after deactivate **307** `/sign-in`; no 5xx; restored ACTIVE | probe/`140ccbf` | `dpl_6qUh…` middleware |
| 4 | POST sign-out → protected denial | **PASS** | Human + anon 307s | `66b7d9b` | `dpl_6qUh…` |
| 5 | New-sign-in denial while inactive | **PASS** | Human neutral OTP message; restored ACTIVE | `66b7d9b` | `dpl_6qUh…` |
| 6a–6c | Signup deny / helpers 404 / GET sign-out 405 | **PASS** | Auth settings + HTTP probes 2026-10-07/08 | `66b7d9b` | Prod Auth + `dpl_6qUh…` |
| E | No browser-visible OTP membership enumeration | **PASS** (after fix) | Was FAIL on `66b7d9b` (422 vs 200). On `dpl_GwHB…`: bundle uses `/api/auth/request-otp`, no browser `signInWithOtp`; member/unknown same-origin bodies identical | `140ccbf` | `dpl_GwHB…` |

**Automated:** non-integration Vitest **48/215 PASS**; full suite **7 FAIL** (no local DB). Seeded full gate still required.

**Blocked for merge/LOCK:** (1′) Magic Link on `dpl_GwHB…`; seeded full Vitest; residue-zero cleanup; gate doc + PR sync; Git-linked `main` verify.

**Next release action:** one Magic Link on azure (`dpl_GwHB…`) → seeded full Vitest → cleanup controlled identity to residue-zero → update gate/PR → merge #3 only if all PASS → verify Git-linked Production → lock commit. No Phase 5.
