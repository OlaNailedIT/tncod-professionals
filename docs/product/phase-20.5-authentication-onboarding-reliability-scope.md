# Phase 20.5 — Authentication & Onboarding Reliability

**Status:** `PASS` / `COMPLETE` / `VERIFIED` / **LOCKED** (2026-09-14)

**Authorized:** 2026-09-14  
**Predecessor:** Phase 20 — PASS / COMPLETE / VERIFIED / LOCKED  
**Successor:** Phase 21+ — **NOT AUTHORIZED**

---

## Purpose

Make the existing TNCOD Professionals Join → Email → Sign-in → Session → Dashboard journey reliably work end-to-end in Production under the locked passwordless architecture (Supabase Auth; no passwords; no second Auth provider).

Success is **not** “email received.” Success is:

```text
authentication request → message received → user completes auth
→ valid browser session → auth identity → public.users → member route
```

---

## Observed failures (production human tests)

### Test A — existing / migrated user

```text
/sign-in → email → message arrives → click sign-in link
→ “That sign-in link is invalid or has expired.” → NO SESSION
```

### Test B — brand-new user

```text
/join succeeds → /sign-in → email submit
→ “We could not send a sign-in code right now.” → NO AUTHENTICATION
```

Do not treat A and B as the same defect class.

---

## Architecture (unchanged product contract)

```text
Email
 → Supabase passwordless (signInWithOtp)
 → Email OTP digits (primary UX) + optional confirm link
 → verifyOtp (code) OR /auth/confirm explicit click (token_hash)
 → Supabase session cookies
 → middleware refresh
 → application identity (auth.users.id = public.users.id)
 → /dashboard | /exco
```

Canonical Production origin: `https://tncod-professionals-azure.vercel.app`  
Supabase project: `brpppukzqgpzxjelwwrj`

---

## Dependency map (auth lifecycle)

| Transition | Implementation | Configuration | Failure mode | Verification |
| --- | --- | --- | --- | --- |
| Join → Auth user | `register.ts` Admin `createUser` | service role (server only) | create fail | join success + Auth user |
| Join → profile | Prisma profile create | `DATABASE_URL` | DB fail | profile row |
| Join → OTP email | **removed** (was auto `signInWithOtp`) | — | burned mail quota | no join-time send |
| Sign-in request | `requestSignInOtpAction` | `NEXT_PUBLIC_SITE_URL`, anon, Auth | rate limit / provider | UI + Auth API class |
| Email delivery | Hosted Auth + **Gmail custom SMTP** | Owner-configured SMTP; template with `{{ .Token }}` | spam / rate limit | Human Production inbox |
| Link click | Optional secondary (`ConfirmationURL`) | site_url + redirect allowlist | **single-use; scanner prefetch** | Prefer OTP digits; known limitation |
| Scanner-resistant confirm | `/auth/confirm` + `token_hash` (app) | TokenHash in template optional | free-tier blocked until SMTP | Available when template uses TokenHash |
| OTP verify | `verifySignInOtpAction` | anon/server client | invalid/expired | UI + human Production |
| Callback | `/auth/callback` | same project credentials | wrong key / missing params | Phase 20 + 20.5 |
| Session | `@supabase/ssr` cookies | anon JWT (not publishable-only) | 401 setSession | Phase 20 env repair |
| Member routes | middleware + require-member | session | redirect `/sign-in` | Playwright / human |

---

## Root causes (evidence-backed)

| Failure | Root cause | Evidence | Fix | Verification |
| --- | --- | --- | --- | --- |
| Existing link invalid (Test A) | Magic-link `/auth/v1/verify` is **single-use**. Email security / prefetch can consume the link before the member clicks. Default hosted template still uses `ConfirmationURL` (auto-verify). | `scripts/phase205-prove-single-use.cjs`: first GET gets access_token; second fails. Template push PATCH → **HTTP 400** “Email template modification is not available for free tier projects using the default email provider.” | App: `/auth/confirm` + TokenHash template prepared; UI emphasizes **OTP code**. Hosted template **cannot** be updated without custom SMTP or plan upgrade. | Template push DENIED. Confirm route unit/e2e for non-consumption on GET. **Production link path NOT fully remediated until SMTP/template.** |
| New-user send fails (Test B) | Built-in Auth email: `SMTP_HOST` **UNSET**, `rate_limit_email_sent = 2` / hour. Join previously also called `signInWithOtp`, burning quota before intentional sign-in. Raising rate limit via API requires custom SMTP. | `scripts/auth-email-config-inspect.cjs`; rate-limit PATCH → **401** “Custom SMTP required…”. Join-time OTP removed from `register.ts`. | Stop join-time OTP; clearer rate-limit UI mapping. | App fix ready for deploy. Full Production send reliability still constrained by built-in mailer limits until SMTP. |
| Prior session 401 (Phase 20) | Browser used incompatible public credential type | Phase 20 closeout | Production `NEXT_PUBLIC_SUPABASE_ANON_KEY` = legacy anon JWT; SITE_URL azure | Phase 20 locked evidence |

---

## Remediations shipped in application code

1. **No auto OTP on join** (`src/features/registration/register.ts`) — preserves built-in email budget for intentional `/sign-in`.
2. **Error classification** (`src/lib/auth/classify-auth-error.ts`) — rate_limit vs consumed vs generic; no secret logging.
3. **Scanner-resistant confirm page** (`/auth/confirm`) — `token_hash` verified only on explicit button click.
4. **Callback hardening** — hash `error=` → consumed messaging; `token_hash` query → redirect to confirm; keep PKCE `code` + hash session paths.
5. **`emailRedirectTo`** → `${origin}${next}` (destination allowlisted path).
6. **Local + repo magic_link template** uses `TokenHash` → `/auth/confirm` (not `ConfirmationURL`).
7. **Sign-in / join success copy** — OTP code primary; join does not send email.
8. **Safe redirect** — absolute `RedirectTo` URLs reduced to allowlisted pathname.
9. **Tests** — classify-auth-error, safe-redirect absolute URLs, e2e confirm non-auto-consume.

---

## Production Auth configuration (historical → resolved)

| Change | Intermediate result | Final result |
| --- | --- | --- |
| Hosted magic_link `{{ .Token }}` | Blocked on free tier + default mailer | **PASS** after Gmail custom SMTP |
| `rate_limit_email_sent` | Blocked without SMTP | Raised under custom SMTP (30) |
| `site_url` / redirect allowlist / public anon JWT / `NEXT_PUBLIC_SITE_URL` | Corrected in Phase 20; re-repaired on drift | azure canonical |

### External dependency — resolved for OTP lock

```text
Gmail custom SMTP configured by owner
→ hosted template includes {{ .Token }}
→ human existing + new member OTP verified in Production
```

Magic-link `ConfirmationURL` remains optional/secondary and may still be prefetch-vulnerable; **canonical auth is OTP digits**, not the link. SMTP App Password is never stored in source control.

---

## Flows (intended)

### New user

```text
/join → Auth+profile created (no email) → /join/success
 → /sign-in → request OTP → email (if provider allows)
 → enter code (preferred) OR /auth/confirm after template deploy
 → session → /dashboard
```

### Existing / migrated

```text
/sign-in → OTP request → email → code or confirm → session → /dashboard
legacy_import=true must not block Auth
```

### EXCO

```text
Same passwordless path → session → /exco → /exco/analytics
(EXCO_VIEWER already assigned; no synthetic users)
```

---

## Security model

- No passwords; no Auth bypass; no service_role in `NEXT_PUBLIC_*`
- `sanitizeNextPath` allowlist only
- Confirm page does not verify on GET
- Logs: error **class** only — never OTP, tokens, emails, auth IDs
- Authorization remains server-enforced and separate from authentication

---

## Testing

| Suite | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | PASS |
| Vitest auth helpers | PASS (`classify-auth-error`, `safe-redirect`, ownership) |
| Playwright `/auth/confirm` | Added (`e2e/phase-20.5-auth-confirm.spec.ts`) — run on deploy gate |
| Production human E2E matrix | **NOT COMPLETE** — blocked on SMTP/template + inbox journey |
| Phase 13 / 18 / 20 regression | Not re-run in this closeout slice; no analytics/schema mutations intended |

---

## Gmail SMTP unlock (2026-09-14)

```text
Authentication mechanism: Supabase passwordless OTP (signInWithOtp → verifyOtp)
Email transport: Gmail SMTP (custom SMTP on Supabase Auth)
Sender: cityofdavidprofessionals@gmail.com
Sender display: TNCOD Professionals
App Password / SMTP secrets: NEVER recorded in repo/logs/docs
```

| Check | Result |
| --- | --- |
| Custom SMTP configured | PASS |
| Auth `site_url` | azure canonical (repaired when drift detected) |
| Hosted magic_link includes `{{ .Token }}` | PASS (after SMTP unlock) |
| ConfirmationURL (optional secondary) | Present — non-canonical; scanner/prefetch risk remains |
| Human existing-member OTP | **PASS** |
| Human new-member OTP + `/dashboard` | **PASS** |

Deploys (application): `dpl_JAiWZ1qqN9goi8r5imrKGt1jQMrp`, `dpl_C1arUK6X6Ze2qtK5P7VVmJ183MK3`, `dpl_6FVkVTzuFx1YQjfgwHJqmSTjLvE8`

### Canonical authentication UX (locked)

```text
/join
  → Auth user + public.users + profile (NO OTP send)
  → “Your account is ready” → Sign in

/sign-in
  → Enter email
  → Send sign-in code  (shouldCreateUser: false)
  → Sending…
  → Enter code (OTP field always present in this state)
  → verifyOtp → SSR session cookies → middleware → /dashboard | /exco
```

Join-time automatic OTP must **not** return. Magic link remains optional/secondary only.

### Forensic note: `@example.com`

Agent disposable `@example.com` identities cannot receive mail. They are **not** Production delivery failures. Real Gmail new-member human verification supersedes that finding.

---

## Final closeout acceptance (2026-09-14)

### Human Production verification

```text
Existing member OTP: PASS
New member OTP: PASS
New member dashboard authentication: PASS
```

Evidence class: **MANUAL PRODUCTION** (real inbox + real OTP entry).

### Full matrix (reconciled)

| Journey | Result | Evidence class |
| --- | --- | --- |
| New member joins | PASS | MANUAL PRODUCTION |
| New member receives OTP | PASS | MANUAL PRODUCTION |
| New member verifies OTP | PASS | MANUAL PRODUCTION |
| New member → `/dashboard` | PASS | MANUAL PRODUCTION |
| Existing member OTP → destination | PASS | MANUAL PRODUCTION |
| Migrated member auth (`legacy_import` does not block) | PASS | PRODUCTION AUTOMATED (OTP verify + session) |
| EXCO auth → `/exco` → `/exco/analytics` | PASS | MANUAL (EXCO identity OTP) + PRODUCTION AUTOMATED (analytics UI) |
| Session refresh / navigation | PASS | PRODUCTION AUTOMATED |
| Logout / re-login | PASS | PRODUCTION AUTOMATED |
| Invalid / reused OTP | PASS | PRODUCTION AUTOMATED |
| Anonymous protected deny | PASS | PRODUCTION AUTOMATED |
| Member → EXCO deny | PASS | PRODUCTION AUTOMATED |
| No service-role in public env | PASS | CODE + prior Production scans |
| Safe redirects | PASS | Vitest |
| Phase 13 `/professionals` | PASS | PRODUCTION AUTOMATED |
| Phase 18 integrity 18 / NOT_REVIEWED / PRIVATE | PASS | PRODUCTION AUTOMATED |
| Phase 20 analytics intact | PASS | PRODUCTION AUTOMATED |
| Automated unit (auth helpers) | PASS | Vitest |

### Known non-blocking limitation

```text
Magic-link ConfirmationURL remains single-use / prefetch-vulnerable.
Canonical path = OTP digits in email. Do not treat magic-link as primary.
```

---

## Production impact accounting (final)

```text
Production application deployment: YES
  dpl_JAiWZ1qqN9goi8r5imrKGt1jQMrp
  dpl_C1arUK6X6Ze2qtK5P7VVmJ183MK3
  dpl_6FVkVTzuFx1YQjfgwHJqmSTjLvE8
Production Auth configuration changes: YES
  site_url → https://tncod-professionals-azure.vercel.app/
  magic_link template includes {{ .Token }}
Production email/Auth provider configuration changes: YES
  Custom SMTP = Gmail
  Sender = cityofdavidprofessionals@gmail.com (display: TNCOD Professionals)
  (credentials never in source control)
Production RBAC data changes: NONE (Phase 20 EXCO_VIEWER assignment unchanged this phase)
Production application data changes: YES
  disposable @example.com test identities during investigation
  genuine new member(s) created during human Production testing
  Phase 18 historical rows: untouched (18 / NOT_REVIEWED / PRIVATE)
Production database schema changes: NO
Production RLS changes: NO
```

Phase 20.5 did **not** alter Phase 13 directory architecture, Phase 18 migration design, Phase 19 DB architecture, Phase 20 analytics definitions, RBAC model, or RLS.

---

## Governance

```text
PHASE 18 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 19 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 20 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 20.5 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 21+ — NOT AUTHORIZED

HARD STOP
```

### Deferred (optional hardening — not lock blockers)

- Prefer TokenHash `/auth/confirm` in hosted template over ConfirmationURL  
- Further reduce magic-link prominence in email copy  
- Monitor Gmail SMTP reputation / spam placement for new recipients
