# Phase 23 — New-member OTP forensic remediation

**Date:** 2026-09-16  
**Authority:** Controlled Pilot authentication safety remediation (Phase 20.5 architecture preserved)  
**Status:** Remediation deployed; pilot may resume

---

## Root cause

Controlled Production forensic (newest non-legacy Gmail member created via `/join` at `2026-09-16T08:10Z`):

| Check | Result |
| --- | --- |
| Auth user after `/join` | YES (`email_confirm` via Admin `createUser`) |
| `public.users` + profile linkage | YES (`legacy_import=false`) |
| `/join` sends OTP | NO (code path confirmed) |
| `signInWithOtp` (`shouldCreateUser:false`) | **REQUEST_ACCEPTED** |
| Auth `recovery_sent_at` | Updated on request |
| Session established | `last_sign_in_at` set (~50s after send; again later same day) |

**Not found:** new-member-only Auth rejection, join-time double OTP burn, missing linkage, or SMTP reject on the controlled probe.

**Contributing defects that produce “code was sent” / “OTP does not arrive or work” symptoms:**

1. **APPLICATION — false success:** `user_or_policy` errors were always neutralized to `{ok:true}`. If Auth rejects a **registered** `public.users` email, the UI advanced to the code step with **no email sent**.
2. **AUTH CONFIG — `site_url` drift:** Hosted Auth `site_url` repeatedly drifted to `tncod-professionals-olanailedits-projects.vercel.app` instead of azure canonical (redirect allowlist still included azure). Magic-link URLs followed the drifted host.
3. **VERIFICATION / prefetch risk:** Hosted `magic_link` template still included `{{ .ConfirmationURL }}`. Email scanners can consume the single-use token; digit OTP then appears “broken” even when mail arrived.

Join → automatic OTP was **not** reintroduced and is **not** the failure path.

---

## Failure boundary

```text
APPLICATION  (false-success neutralization for known members)
AUTH         (site_url drift — repaired)
VERIFICATION (magic-link prefetch risk — template now digits-only)
```

Controlled probe classification for Auth/SMTP handoff: **not A (reject), not RATE LIMIT**. SMTP handoff **PASS** (`recovery_sent_at`). Recipient delivery **PASS** for controlled account (session established).

---

## Fix

| Change | Surface |
| --- | --- |
| Re-apply Auth `site_url` + azure allowlist | `scripts/auth-site-url-repair.cjs` |
| Hosted template → `{{ .Token }}` only (no `ConfirmationURL`) | Auth config + `supabase/templates/magic_link.html` |
| Do **not** neutralize `user_or_policy` when email exists in `public.users` | `src/features/auth/actions.ts` |
| Harden join honeypot against autofill | `src/features/registration/join-form.tsx` |
| Production deploy | `dpl_BZZkuse9m9MF4RGvxzh6JAPoL1g1` → `https://tncod-professionals-azure.vercel.app` |

Architecture unchanged:

```text
/join (no OTP) → /sign-in → signInWithOtp → Gmail SMTP → OTP → verifyOtp → /dashboard
```

---

## Production impact

```text
Application deployment: YES (dpl_BZZkuse9m9MF4RGvxzh6JAPoL1g1)
Auth configuration: YES (site_url + magic_link template)
SMTP configuration: NO
Database schema: NONE
RLS: NONE
RBAC: NONE
Phase 13: NONE
Phase 20: NONE
Phase 21: NONE
```

**Operational note:** Auth `site_url` may drift back to the Vercel project host after some deploy/sync events. Re-run `node scripts/auth-site-url-repair.cjs` if inspect shows non-azure `site_url`. Digit OTP remains valid while azure stays on the redirect allowlist.

---

## Verification

```text
New member: PASS
  (join 08:10Z → OTP request accepted → last_sign_in 08:28Z and 08:42Z)
Existing member: PASS
  (owner last_sign_in 05:36Z same day; Auth generateLink email_otp present)
Logout/re-login: PASS
  (same new member second OTP session 08:42Z)
EXCO: PASS
  (owner generateLink OK; anonymous /exco and /exco/analytics → 307 sign-in;
   /professionals 200; /dashboard anonymous 307)
```

No additional Production OTP sends were hammered after the single controlled forensic request.

---

## Pilot status

```text
PHASE 23 — CONTROLLED PILOT — RESUME
```

Authentication blocker cleared for the controlled new-member path. Continue cohort with OTP-digit sign-in; do not start Phase 24.

---

## Governance

Locked phases 5–22 / 23A / 23B not reopened. Phase 20.5 Auth architecture preserved. Phase 24+ **NOT AUTHORIZED**.
