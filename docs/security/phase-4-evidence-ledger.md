# Phase 4 — Production evidence ledger (one page)

**Branch:** `phase4-auth-security-lock` → merge target `main`  
**Auth code on Production (pre-merge):** `aa4db3a` on `dpl_GwHBNdLQBUArEnNaNCk3KS7roriZ` → `https://tncod-professionals-azure.vercel.app`  
**Phase 4 status:** **NOT PASS / NOT LOCKED** (controlled-pilot lock pending post-merge sequence)

| # | Control / exact assertion | Result | Evidence | SHA | Deploy |
| --- | --- | --- | --- | --- | --- |
| 1 | Fresh Magic Link → `/dashboard` (browser-PKCE era) | **PASS** | Human 2026-10-07 | `66b7d9b` | `dpl_6qUh…` |
| 1′ | Magic Link after same-origin OTP on `dpl_GwHB…` | **PASS** | Human: member dashboard. Auth logs UTC 2026-10-08: `/otp` **200** 05:24:56; `/verify` **303** 05:25:30; `/token` **200** 05:25:34 | `aa4db3a` | `dpl_GwHB…` |
| 2a–2b | EXCO grant + same-session revoke denial | **PASS** | Human + DB 2026-10-07 | `66b7d9b` | `dpl_6qUh…` |
| 3 | Stale-session `/dashboard` denial | **PASS** | Probe before 200 / after 307; no 5xx | probe | `dpl_6qUh…` mw |
| 4 | POST sign-out → protected denial | **PASS** | Human + anon 307s | `66b7d9b` | `dpl_6qUh…` |
| 5 | New-sign-in denial while inactive | **PASS** | Human neutral OTP denial | `66b7d9b` | `dpl_6qUh…` |
| 6a–6c | Signup deny / helpers 404 / GET sign-out 405 | **PASS** | Probes 2026-10-07/08 | `66b7d9b` | Prod Auth + `dpl_6qUh…` |
| E-UI | TNCOD sign-in: neutral member/unknown app responses | **PASS (scoped)** | Same-origin identical JSON; no browser `signInWithOtp` | `aa4db3a` | `dpl_GwHB…` |
| E-API | Public Supabase `POST /auth/v1/otp` non-enumerating | **NOT PASS — known residual** | Member **200** vs unknown **422** remains. Enumeration **not** eliminated / **not** “fixed.” | GoTrue hosted | Prod Auth |

## Decision — `ACCEPT CONTROLLED-PILOT EXCEPTION` (2026-10-08)

Accept residual direct hosted-Supabase `/auth/v1/otp` membership enumeration **only for the restricted controlled pilot**.

| Field | Record |
| --- | --- |
| Decision id | `ACCEPT CONTROLLED-PILOT EXCEPTION` |
| Decision date | **2026-10-08** |
| Scope | Controlled pilot only (≈10–20 cohort; **not** unrestricted / public launch) |
| E-UI | Scoped **PASS** |
| E-API | **Known residual** — do not mark PASS; do not claim provider endpoint fixed or enumeration eliminated |
| Abuse controls verified (depth, not E-API fix) | `disable_signup=true`; signup **422**; same-origin OTP neutralization; GET sign-out **405**; helpers **404**; registration Turnstile + DB rate limit (prior); provider OTP rate limits exist |
| Mandatory reassessment | **Before unrestricted launch** |

**Automated (do not rerun for docs):** migrations **20/20** + `vitest` **56/252 PASS** (2026-10-08).

## Sequencing adjustment — controlled identity retention

Pinned identity `df709e23-…` (`smiley7605+tncodphase4oct03@…`) is the **only approved Production test identity** for this gate.

| Step | Action |
| --- | --- |
| 1 | Pre-merge assertions complete (incl. 1′ PASS + exception recorded) |
| 2 | Merge PR #3 → verify **Git-linked** `main` Production deploy + azure alias |
| 3 | **Retain** identity; prove sign-in/session acceptance on that merged deploy (admin OTP → session cookies → `/dashboard` **200**, or equivalent human Magic Link — no new account; no real member) |
| 4 | Then hard-clean pinned identity only; prove **residue-zero** |
| 5 | Commit controlled-pilot lock evidence (**not** Phase 4 unrestricted PASS/LOCKED; **no Phase 5**) |

**Next:** merge → Git-linked Production verify → post-merge sign-in on retained identity → cleanup residue-zero → lock commit.
