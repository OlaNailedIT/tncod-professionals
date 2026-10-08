# Phase 4 — Production evidence ledger (one page)

**Branch:** `phase4-auth-security-lock`  
**Auth code on Production:** `aa4db3a` (same-origin `POST /api/auth/request-otp`). **`140ccbf`** = probe-script only (diff vs `aa4db3a`: `scripts/phase4-stale-session-probe.cjs`); does not change Production Auth binary. Later docs commits are documentation-only.  
**Current Production:** `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ` → alias `https://tncod-professionals-azure.vercel.app` (**CONFIRMED** 2026-10-08)  
**Prior deploy (gates 1–6; do not re-run):** `dpl_6qUhLT5YMvHBVVFBEjqQx5YD7VnY`  
**Controlled identity:** `df709e23-…` — ACTIVE/MEMBER; cleanup not run  
**Phase 4 status:** **NOT PASS / NOT LOCKED**

| # | Control / exact assertion | Result | Evidence | SHA | Deploy |
| --- | --- | --- | --- | --- | --- |
| 1 | Fresh Magic Link → `/dashboard` (browser-PKCE era) | **PASS** | Human 2026-10-07 | `66b7d9b` | `dpl_6qUh…` |
| 1′ | Magic Link after same-origin OTP route | **UNPROVEN** | Awaiting one fresh Magic Link on `dpl_GwHB…` | `aa4db3a` | `dpl_GwHB…` |
| 2a–2b | EXCO grant + same-session revoke denial | **PASS** | Human + DB 2026-10-07 | `66b7d9b` | `dpl_6qUh…` |
| 3 | Stale-session `/dashboard` denial | **PASS** | Probe before 200 / after 307; no 5xx | probe | `dpl_6qUh…` mw |
| 4 | POST sign-out → protected denial | **PASS** | Human + anon 307s | `66b7d9b` | `dpl_6qUh…` |
| 5 | New-sign-in denial while inactive | **PASS** | Human neutral OTP denial | `66b7d9b` | `dpl_6qUh…` |
| 6a–6c | Signup deny / helpers 404 / GET sign-out 405 | **PASS** | Probes 2026-10-07/08 | `66b7d9b` | Prod Auth + `dpl_6qUh…` |
| E-UI | TNCOD sign-in: neutral member/unknown app responses | **PASS (scoped)** | Same-origin identical JSON; no browser `signInWithOtp` | `aa4db3a` | `dpl_GwHB…` |
| E-API | Public Supabase `POST /auth/v1/otp` non-enumerating | **NOT PASS — known residual** | Member **200** vs unknown **422** remains. Enumeration **not** eliminated. | GoTrue hosted | Prod Auth |

## Decision — `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

**Decision:** Accept residual direct hosted-Supabase `/auth/v1/otp` membership enumeration **only for the restricted controlled pilot**.

| Field | Record |
| --- | --- |
| Decision id | `ACCEPT CONTROLLED-PILOT EXCEPTION` |
| Decision date | **2026-10-08** |
| Scope | Controlled pilot only (≈10–20 cohort; not unrestricted / public launch) |
| E-UI | Scoped **PASS** — TNCOD sign-in path neutral for member/unknown |
| E-API | **Known residual** — do not mark PASS; do not claim enumeration eliminated |
| Abuse controls verified (defense in depth, not an E-API fix) | `disable_signup=true`; direct signup **422**; app same-origin OTP neutralization; GET sign-out **405**; Production helpers **404**; registration Turnstile + DB rate limit (prior gate evidence); Auth OTP rate limits exist at provider (not a substitute for identical `/otp` responses) |
| Mandatory reassessment | **Before unrestricted launch** — re-open E-API; require upstream GoTrue obfuscation, self-hosted Auth patch, or an explicitly re-authorized alternative. Pilot exception **expires** at unrestricted launch authorization. |

**Automated (already recorded; do not rerun for docs-only):** disposable migrations **20/20** + seed + `vitest run` → **56 files / 252 tests PASS** (2026-10-08).

**Blocked before merge / controlled-pilot lock evidence:** (1′) Magic Link on `dpl_GwHB…` → then cleanup residue-zero → gate/PR sync → merge #3 → Git-linked `main` + azure verify → lock commit. **Phase 4 not PASS/LOCKED. No Phase 5.**

**Next:** wait for one fresh Magic Link result on azure / `dpl_GwHB…`.
