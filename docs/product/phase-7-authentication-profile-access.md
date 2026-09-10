# Phase 7 — Authentication & Profile Access

**Status:** PASS / COMPLETE / VERIFIED / LOCKED  
**Governance:** Phase 5 closed · Phase 6 locked · Phase 7 locked · Phase 8 locked · Phase 9+ not authorized.

## Purpose

Phase 6 created the person (Auth identity + `public.users` + profile + professional details) without establishing a browser session.

Phase 7 gives that person a reliable way back in:

> A registered TNCOD Professional can securely return later, authenticate without a password, obtain a valid session, access their own member area and profile, edit only what they are permitted to edit, and securely sign out.

This phase does **not** build the full member area, directory, opportunities, verification, or EXCO workflows.

## Authentication model

Passwordless **Supabase Auth** only:

```text
Email → signInWithOtp (shouldCreateUser: false) → email OTP and/or magic link
→ authenticated browser session (Supabase SSR cookies)
→ member routes
```

No passwords, password reset, social login, MFA, or custom JWT/session systems.

User-facing copy avoids technical jargon (JWT, PKCE, cookies, etc.).

### Registration → access (Option A)

```text
/join → registration → /join/success (not signed in)
                      ↓
                 later: /sign-in
                      ↓
                 OTP / magic link
                      ↓
                 session → /dashboard
```

Post-registration email may still be attempted by Phase 6 (best-effort). Phase 7 does not require immediate post-register authentication; `/sign-in` is the reliable return path.

## Lifecycle

```text
registration (Phase 6)
→ /sign-in
→ request OTP / magic link
→ verify code OR complete /auth/callback
→ session cookies
→ /dashboard
→ /profile
→ /profile/edit
→ /auth/sign-out
```

## Session behaviour

| Concern | Behaviour |
|--------|-----------|
| Create | `verifyOtp` (email type) or `/auth/callback` (`exchangeCodeForSession` / hash `setSession`) |
| Retrieve | `createServerSupabaseClient` + `auth.getUser()` via `getAuthenticatedUser` |
| Persist | Supabase SSR cookie refresh in middleware |
| Expire / invalid | Protected routes redirect to `/sign-in?next=…` (safe internal next only) |
| Logout | `POST/GET /auth/sign-out` → `auth.signOut()` → `/sign-in` |

Identity mapping:

```text
auth.users.id = public.users.id = profiles.user_id
```

Never trust browser-supplied email, profile ID, role, verification, or visibility for authorization.

## Authorization boundary

- Middleware gates `/dashboard`, `/profile`, `/profile/edit`, `/opportunities`, `/settings`.
- Pages also call `requireMemberPage`.
- Profile read/update uses the authenticated user id only (`loadOwnMemberProfile` / `updateOwnMemberProfile`).
- Optional `claimedUserId` / `?userId=` must match session or returns **403**.
- Privileged fields (`verification_status`, directory publication, roles) are never set by sign-in or member edit.
- Prisma remains privileged ORM access: domain ownership checks are mandatory (SEC-016).

## Security

- Existing Phase 2/3 RLS preserved; no DDL in Phase 7.
- Safe redirects via `sanitizeNextPath` (allowlist: dashboard/profile/opportunities/settings).
- Service role only on server (`createServiceRoleClient`); never `NEXT_PUBLIC_*` service role.
- Local-only `AUTH_E2E_HELPER=1` exposes `/api/test/auth-otp` for disposable OTP proof — disabled in production / when unset.
- Account enumeration: sign-in request responses stay neutral when user is missing.
- Account menu Sign out posts to `/auth/sign-out` (not a fake `/sign-in` link).

## UX

- `/sign-in` — email → “check your email” + enter code; calm errors; Phase 5 form primitives.
- `/dashboard` — welcome, independent status badges (profile / verification / directory), links to profile.
- `/profile` — own data from Phase 6 fields only.
- `/profile/edit` — own permitted content fields; email not edited here.
- `/opportunities`, `/settings` — auth-gated stubs (later phases).
- Member density via `ProductMemberShell` + locked Phase 5 tokens.

## Database

**No migrations.** Phase 2 schema already supports Phase 7.

Config-only (local): `supabase/config.toml` redirect allowlist + optional magic-link template including `{{ .Token }}` for OTP visibility in Mailpit.

## Testing

### Final closeout regression (2026-09-08)

| Check | Result |
|-------|--------|
| TypeScript (`npm run typecheck`) | PASS |
| ESLint (`npm run lint`) | PASS |
| Vitest (`npm test`) — 47 tests | PASS |
| Build (`npm run build`) | PASS (after clean `.next`; avoid concurrent build + e2e) |
| Phase 7 Auth e2e `--workers=1` | **12/12 PASS** |
| Phase 6 registration e2e `--workers=1` | **PASS** (12/12 in that suite) |

### Final lifecycle proven

```text
registration
→ /sign-in
→ OTP/magic link
→ authenticated session
→ /dashboard
→ /profile
→ /profile/edit
→ sign out
→ protected routes denied
```

### Resolved defects (documented)

1. **Pre-hydration sign-in interaction** — Filling the email before client hydration could leave RHF empty (`Email is required`) or allow unintended native navigation. Fix: disable controls until hydrated; `method="post"` + `preventDefault`; explicit `type="button"` handlers.
2. **Sign-out control unmount** — Closing Account menu unmounted the submitting control. Fix: Sign out uses `GET /auth/sign-out` (session cleared server-side via Supabase Auth cookies).

### Browser evidence command

```bash
npm run test:e2e -- e2e/phase-7-auth-browser-evidence.spec.ts --workers=1
```

Local stack note: disposable Supabase may use `--ignore-health-check` and exclude non-Auth services on constrained Docker hosts.

`AUTH_E2E_HELPER=1` enables `/api/test/auth-otp` (Playwright wrapper default; disabled in production / when unset).

### `/api/test/auth-otp` security check

| Guard | Status |
|-------|--------|
| Requires `AUTH_E2E_HELPER === "1"` | 404 otherwise |
| Blocked when `NODE_ENV === "production"` | 404 |
| Not used by normal sign-in UX | e2e-only |
| Returns short-lived `generateLink` email OTP | must stay local-only |

### Final acceptance matrix

| Acceptance Area | Result |
| --- | --- |
| Passwordless authentication | PASS |
| Session establishment | PASS |
| Callback / verification | PASS |
| Protected routes | PASS |
| Own profile access | PASS |
| Profile editing | PASS |
| Cross-user IDOR protection | PASS |
| Safe internal redirect | PASS |
| External redirect rejection | PASS |
| Logout | PASS |
| Refresh/session persistence | PASS |
| Responsive sign-in | PASS |
| Accessibility (practical patterns in suite/UI) | PASS (practical; not WCAG certification) |
| TypeScript | PASS |
| ESLint | PASS |
| Unit tests | PASS |
| Build | PASS |
| Phase 6 regression | PASS |
| Phase 5 regression (primitives/shell retained) | PASS (no redesign) |
| Service-role boundary | PASS |
| RLS preservation / no Phase 7 DDL | PASS |
| Test helper isolation | PASS |

## Limitations

- Distributed auth rate limiting is Supabase platform defaults only (not claimed as app-level WAF).
- Magic-link hash completion depends on client `setSession` when Auth returns fragment tokens.
- `/api/test/auth-otp` must never be enabled in production.
- Opportunities/settings are auth-gated stubs only.
- Profile completion beyond Phase 6 field edit is out of scope.
- Full Supabase stack health checks may need `--ignore-health-check` / service excludes on constrained Docker hosts.
- No WCAG certification, penetration-test certification, or production load claim.

## Deferred (Phase 9+)

- Directory search/filter and public projection polish
- Verification / EXCO workflows
- Opportunities marketplace
- Business create/link management UI
- Headshot upload UI through private storage
- Messaging / notifications

Phase 8 owns profile completion overview and derived percentage (see `docs/product/phase-8-profile-completion.md`).

## Source / dependency audit

- **Added dependencies:** none.
- **Auth stack:** existing `@supabase/ssr`, `@supabase/supabase-js`.
- **New app surfaces:** `/sign-in` (real), `/auth/callback`, `/auth/sign-out`, `/dashboard`, `/profile`, `/profile/edit`, stubs, `/api/member/profile`, optional `/api/test/auth-otp`.
- **No Phase 9+ product modules** in the Phase 7 surface (directory/EXCO/verification/messaging absent as features).

## KILLCRITIC final answers

1. Anonymous protected data? **No** — middleware + page gate → `/sign-in`.
2. Member A → B profile? **No** — `rejectClientIdentity` / 403 on `?userId=` mismatch (e2e).
3. Member A edit B? **No** — claimedUserId mismatch denied (e2e).
4. Client metadata privilege? **No** — roles not granted from metadata in Phase 7.
5. External `next`? **No** — `sanitizeNextPath` + e2e.
6. Real passwordless session? **Yes** — live Supabase + e2e.
7. Refresh preserves session? **Yes** — e2e.
8. Logout terminates access? **Yes** — GET `/auth/sign-out` + e2e.
9. Auth secrets in browser? **No** — anon/public only.
10. Service-role server-only? **Yes** — admin + test helper server routes; public env forbids `NEXT_PUBLIC_*SERVICE_ROLE*`.
11. Passwords? **No**.
12. Second auth architecture? **No** — Supabase Auth only.
13. Auth alters verification/visibility? **No** — edit path never touches those fields.
14. RLS weakened? **No**.
15. Undocumented DDL? **No** — zero Phase 7 migrations.
16. OTP helper in production? **No** — dual guard.
17. Suite without weakening assertions? **Yes** — 12/12 authoritative command.
18. “How do I come back later?” **Yes** — `/sign-in` passwordless path.

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 7 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 8 — NOT AUTHORIZED
HARD STOP
```

P0/P1/P2: **0**. P3: none blocking.