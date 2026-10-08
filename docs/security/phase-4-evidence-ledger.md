# Phase 4 — Production evidence ledger (one page)

**Branch:** `phase4-auth-security-lock`  
**Candidate SHA (pre-enumeration fix):** `66b7d9bfccc4b39dd1629597801641baf0b65fba`  
**Production deploy exercised for runtime gates below:** `dpl_6qUhLT5YMvHBVVFBEjqQx5YD7VnY` (alias `https://tncod-professionals-azure.vercel.app`, 2026-10-07 ~23:25 SAST)  
**Controlled identity:** `df709e23-…` / `smiley7605+tncodphase4oct03@…` only  

| # | Control / exact assertion | Result | Evidence | SHA | Deploy |
| --- | --- | --- | --- | --- | --- |
| 1 | Fresh Magic Link on current candidate: sign-in → `/auth/callback` exchange succeeds → `/dashboard` 200 (no `auth_link_exchange_failed` / `pkce_exchange`) | **PASS** | Live human session 2026-10-07 after `66b7d9b` deploy; user reported dashboard / signed-in | `66b7d9b` | `dpl_6qUhLT5YMvHBVVFBEjqQx5YD7VnY` |
| 2a | With `EXCO_VIEWER` assigned, same signed-in session can open `/exco` | **PASS** | Human: opened `/exco` while holding role; DB `ASSIGNMENT=CREATED` via trusted admin script | `66b7d9b` | `dpl_6qUh…` |
| 2b | After revoking **only** `EXCO_VIEWER` (MEMBER retained, ACTIVE), **same session** reload `/exco` denies (redirect away from EXCO); `/dashboard` still works; no loop/error | **PASS** | DB `ROLES MEMBER`, `HAS_EXCO_VIEWER false`; human: `/exco` → `/dashboard`; `/dashboard` OK; no loops (2026-10-07) | `66b7d9b` | `dpl_6qUh…` |
| 3 | Protected page denial using a session issued **before** deactivation (stale session): ACTIVE signed-in tab → deactivate/ban → same-tab `/dashboard` fail-closed, no loop/500 | **UNPROVEN** | Only new-OTP-while-inactive was exercised; stale-session protocol not yet run | — | — |
| 4 | Live POST sign-out then protected-route denial | **PASS** | Human: after UI sign-out, redirect to sign-in; anon probes `/dashboard` `/exco` `/profile` → 307 `/sign-in` (2026-10-07) | `66b7d9b` | `dpl_6qUh…` |
| 5 | New sign-in denial while inactive (OTP verify path) | **PASS** | Identity `DEACTIVATED`+Auth ban; human: “That code is invalid or has expired”; then restored `ACTIVE` (2026-10-07/08) | `66b7d9b` | `dpl_6qUh…` |
| 6a | Direct Auth signup denied | **PASS** | `disable_signup=true`; `POST /auth/v1/signup` → 422, `signup_created false` (2026-10-08) | `66b7d9b` | Prod Auth `brpppukzqgpzxjelwwrj` |
| 6b | Production helper routes 404 | **PASS** | `/api/helpers/*`, `/helpers/*`, `/api/admin/helpers` → 404 | `66b7d9b` | `dpl_6qUh…` |
| 6c | Sign-out GET 405 | **PASS** | `GET /auth/sign-out` → 405 | `66b7d9b` | `dpl_6qUh…` |
| E | Browser-visible Auth OTP must not reintroduce membership enumeration after `66b7d9b` moved send to browser | **FAIL → defect** | Probe 2026-10-08: unknown email `422 signup_disabled` vs member `200 opaque` on `POST …/auth/v1/otp` (`create_user:false`). UI copy neutral; **network differential = Phase 4 defect**. Fix: same-origin `POST /api/auth/request-otp` (in working tree; not yet on `66b7d9b` deploy) | `66b7d9b` live = FAIL | `dpl_6qUh…` |

**Do not treat Phase 4 as PASS/LOCKED** until: (E) fix deployed + re-probed PASS; (3) stale-session PASS; final automated suite on the fix SHA; controlled-identity residue-zero; gate doc + PR updated; merge + Git-linked Production verify.

**Next release action:** land enumeration fix → one full automated gate → targeted stale-session (#3) on Production → residue-zero cleanup → update gate/PR → merge #3 only if all PASS → verify Git-linked `main` + azure alias → lock commit. No Phase 5.
