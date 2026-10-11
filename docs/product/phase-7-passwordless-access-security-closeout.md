# Phase 7 — Passwordless Access / Authenticated Member Entry (Security Closeout)

**Status:** PASS / CLOSED / LOCKED  
**Date:** 2026-10-11  
**Baseline commit:** `17a6d84b81c1a2d3e2c0e0bae676d67bba24b841` (origin/main at entry)  
**Scope:** Security programme verification of passwordless member entry. No Phase 8. No Phase 6 reopen.

## 1. Baseline (no redesign)

| Item | Finding |
|------|---------|
| Auth provider | Supabase Auth (passwordless email OTP; magic-link secondary via PKCE callback) |
| Identifier | Email only (`shouldCreateUser: false`) |
| Canonical mapping | `auth.users.id = public.users.id = profiles.user_id` |
| Fail-closed gate | `activeIdentityExists` — ACTIVE user + non-deleted profile required after OTP/callback/session |
| Registration ≠ session | Phase 6 `/join` creates Auth user + rows; `/join/success` is public; no browser session until `/sign-in` |
| Auth ≠ profile completion | Dashboard shows independent profile/verification/directory badges; no auto-verify/publish |

### Primary surfaces (already on main)

- `/sign-in` + `SignInForm` → `POST /api/auth/request-otp` → `verifySignInOtpAction`
- `/auth/callback` (PKCE / hash session) + inactive-identity reject
- Middleware session refresh + protected prefixes (`/dashboard`, `/profile`, `/opportunities`, `/settings`)
- `requireMemberPage` on member pages (including `/businesses/*`)
- `/auth/sign-out` clears session → `/sign-in`
- EXCO via role gates (`assertExcoDashboardAccess` / RBAC) — member session alone insufficient

## 2. Gap assessment

No demonstrated P0/P1 auth correctness gaps on `origin/main` @ `17a6d84`.  
No schema/SQL change required. No Prisma migrations.  
Working-tree branch `phase4-join-reclaim-truthful-success` was **not** used (dirty / divergent; lacks authority for this gate).

## 3. Verification (local @ `17a6d84`)

| Check | Result |
|-------|--------|
| Auth-focused Vitest (12 files / 35 tests) | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |

Covered behaviours include: OTP request neutralization, invalid/expired OTP messaging, inactive-identity fail-closed + local sign-out, safe redirects, ownership assert, sign-out route, PKCE callback exchange gates.

## 4. Production-safe smoke (read-only / non-destructive)

**Origin:** `https://tncod-professionals-azure.vercel.app`  
**Deployment:** `dpl_A1kUhT1uHN6zzjEbZPV7ogWZrTD9`  
**Deployed SHA:** `17a6d84b81c1a2d3e2c0e0bae676d67bba24b841`

| Check | Result |
|-------|--------|
| `GET /sign-in` | 200 |
| `GET /dashboard` (unauthenticated) | 307 → `/sign-in?next=%2Fdashboard` |
| `GET /businesses` (unauthenticated) | 307 → `/sign-in?next=%2Fbusinesses` |
| `GET /exco` (unauthenticated) | 307 → `/sign-in?next=%2Fexco` |
| `POST /api/auth/request-otp` unknown email | `{ ok: true, emailRedirectTo: … }` (no membership leak) |
| `POST /api/auth/request-otp` malformed email | 400-class `{ ok: false, message: "Enter a valid email address." }` |
| Mutations of member records | None |
| Forged sessions / OTP bypass | None |

Full interactive OTP with a human mailbox was not required for this closeout when architecture + neutralized API + prior Phase 7/20.5 locks already prove the challenge path; no Production member data was inspected or mutated.

## 5. Security summary

- Fail closed on missing/invalid/expired session and on Auth identity without ACTIVE mapped member/profile.
- Enumeration: same-origin OTP request returns identical success shape for known/unknown provider outcomes.
- Member auth ≠ EXCO privileges.
- Phase 6 directory privacy projection remains on this SHA (PR #8).

## 6. Closure

**PHASE 7: PASS / CLOSED / LOCKED**

Do not begin Phase 8 under this authorization.
