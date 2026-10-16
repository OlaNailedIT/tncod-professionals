# AUTH-A — E-API enumeration residual (Gate 6A)

**Date:** 2026-10-12  
**Result:** **PROVIDER-LEVEL RESIDUAL — UNRESTRICTED LAUNCH BLOCKED**  
**Controlled pilot:** remains allowed under existing exception (E-UI neutralized)

---

## Problem (unchanged)

Public Supabase GoTrue `POST /auth/v1/otp` with the publishable (anon) credential and `create_user` / `shouldCreateUser: false` returns membership-differentiating status:

| Identifier | Typical provider outcome |
| --- | --- |
| Existing Auth user | HTTP **200** (OTP/magic path proceeds) |
| Unknown identifier | HTTP **422** (`otp_disabled` / “Signups not allowed for otp”) |

Anyone with the public Supabase URL + anon key can call the endpoint directly. Application E-UI already neutralizes website responses via same-origin `POST /api/auth/request-otp` (identical JSON for member / unknown / inactive). That does **not** remove the provider oracle.

Evidence class: documented GoTrue behaviour (open Auth issue class; reproducible on hosted GoTrue). See also `docs/security/phase-4-evidence-ledger.md` (E-API residual).

---

## Invariants that must not be broken

```text
existing members can request OTP
shouldCreateUser:false remains authoritative
unknown/non-member cannot create Auth identity
inactive/deleted identity remains denied
no real-member probing
no weaker signup policy
no orphan-creation regression
no client-controlled authorization
```

---

## Options examined (bounded)

| Option | Why rejected / insufficient |
| --- | --- |
| Enable unrestricted signup / `shouldCreateUser: true` to equalize codes | Violates non-member Auth creation; creates junk Auth identities and email-send abuse surface |
| Hide Supabase URL or anon key from the browser | Security-through-obscurity; keys remain public for legitimate clients; endpoint still reachable |
| Server-only OTP proxy | Already done for UI; **does not** close direct `/auth/v1/otp` enumeration |
| CAPTCHA on Auth | May slow abuse; **does not** equalize member vs unknown responses |
| Custom Auth provider rewrite | Out of scope; would reopen locked Auth architecture |

No supported Supabase configuration was found that keeps `shouldCreateUser: false` (or equivalent signup deny) **and** returns non-differentiating `/otp` responses for unknown identifiers. Upstream GoTrue would need `/recover`-style obfuscation on `/otp` when user creation is disallowed.

---

## Decision

```text
AUTH-A RESULT:
PROVIDER-LEVEL RESIDUAL — UNRESTRICTED LAUNCH BLOCKED
```

Do **not** accept this residual for unrestricted/public launch without a new explicit owner decision.  
Do **not** burn further engineering cycles on speculative rewrites in Gate 6A.

Controlled pilot may continue with E-UI neutralization + restricted cohort.

---

## Exact dependency (2026-10-16)

The application same-origin route already returns one success JSON body. The remaining difference is upstream.

Hosted GoTrue `POST /auth/v1/otp` with `create_user: false` calls `shouldCreateUser` in `internal/api/otp.go`. A missing account returns HTTP 422 `otp_disabled` / “Signups not allowed for otp”. An existing account continues and returns 200. `/recover` already returns one success response for an unknown address. That `/otp` branch does not.

Tracked as [supabase/auth#1547](https://github.com/supabase/auth/issues/1547). Current `master` still has the differentiating branch. This project cannot close it by changing `shouldCreateUser: false` or by hiding the public anon key.

**Dependency:** a hosted Auth release that makes `/otp` non-differentiating when user creation is not allowed, matching `/recover`, without enabling open signup. Until that release is on this project’s Auth instance, unrestricted launch stays blocked here and no further application rewrite is authorized.
