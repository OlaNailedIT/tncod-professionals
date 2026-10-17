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

---

## Feasibility — server-only Auth with genuine key revocation (2026-10-16)

**Status:** unproven candidate. **Not authorized** for Production keys, rotation, cutover, or architecture implementation.  
**Question:** can previously exposed public credentials be revoked so only a server-held key reaches GoTrue, without merely hiding the key or proxying the website?

### Official provider position

From current Supabase docs ([API keys](https://supabase.com/docs/guides/getting-started/api-keys), [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys), [rotating legacy keys](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd)):

| Fact | Implication |
| --- | --- |
| Publishable / legacy `anon` are low-privilege and designed to be public | Shipping them keeps `/auth/v1/otp` reachable to anyone who holds them |
| Creating publishable/secret keys does **not** revoke legacy `anon` | Old JWTs keep working until Dashboard deactivation |
| Legacy `anon` / `service_role` can be deactivated after clients move | That is genuine access revocation of previously exposed credentials |
| Secret keys map to `service_role` and **bypass RLS** | Unsuitable as the general SSR Auth + Data API client |
| Hosted secret keys refuse browser `User-Agent` | Still not a substitute for never shipping a low-privilege key |

### Application dependency map (this repo)

| Path | Key today | Notes |
| --- | --- | --- |
| `src/lib/supabase/browser.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **No importers** outside its own file |
| `src/middleware.ts`, `src/lib/supabase/server.ts`, `request-otp`, verify OTP, sign-out | same public anon | Live session refresh and OTP use the anon key on the server |
| Registration / privileged Auth Admin | `SUPABASE_SERVICE_ROLE_KEY` | Already server-only; must stay that way |

So the browser helper is unused, but the public anon credential is still the Auth client credential and has already been shipped in Production bundles. Hiding it from future bundles is not revocation.

### Disposable local evidence (isolated stack only)

| Check | Result |
| --- | --- |
| Server secret → `/auth/v1/otp` for an existing disposable member | **200** |
| Same path for unknown email with `create_user: false` | **422** `otp_disabled`; `auth.users` count for that email **0** |
| Member OTP verify via admin `generate_link` + `/verify` with secret | **200**, access token issued for the same user |
| Publishable vs secret `GET /rest/v1/users` | publishable **0** rows; secret **357** rows — secret **bypasses RLS** |
| Local Kong rewrite to “revoke” public Auth keys | **Not a clean proof** — public keys still reached Auth via gateway fall-through; `pre-function` plugin is not enabled on this local Kong |
| Production keys | **Untouched** |

Conclusion of the probe: Auth can run with a server-held elevated key, and registration controls (`create_user: false`) still hold. Using the **secret** key for ordinary SSR is unsafe because it bypasses RLS. Local gateway surgery did not prove public-key rejection the way hosted Dashboard deactivation is documented to.

### Original remediation proposal (now implemented as a draft candidate)

Current implementation/evidence: [draft PR #25](https://github.com/OlaNailedIT/tncod-professionals/pull/25),
head `a5ae4e46a938e2eb3795c304264f52a8a3949d03`. The proposal below is historical
context, not Production execution authorization. The candidate's cutover and
recovery requirements supersede this abbreviated sequence.

```text
1. Mint a NEW publishable key (low privilege, RLS intact).
2. Hold it only as a server env (no NEXT_PUBLIC_ / no browser shipping).
3. Point middleware, request-otp, verifyOtp, session refresh, and sign-out at that server key.
4. Keep registration on the service-role / secret path with existing app authorization.
5. After every runtime has replacements, deactivate legacy API keys (anon AND service_role).
   Privileged consumers must already use a modern secret. Any other previously exposed,
   still-active publishable key must also be retired through its appropriate control.
6. Prove previously exposed credentials fail against /auth/v1/otp; prove member OTP,
   shouldCreateUser:false, and authorization still pass on disposable then Production.
```

**Effort (estimate):** medium — env/client wiring, Vercel secret layout, disposable proof of old-key deny + member sign-in, then a separately authorized Production cutover.  
**Risks:** Auth outage if legacy anon is deactivated before every server path is switched; any future leak of the new publishable re-opens the oracle; middleware must not be pointed at a secret/service_role key; PKCE/cookie paths must be re-verified; this does **not** change GoTrue’s 200 vs 422 response shape for a caller who still has a valid low-privilege key.

### Decision for AUTH-A

```text
CANDIDATE: server-held publishable + Dashboard deactivation of previously exposed anon
NOT PROVEN on hosted Production (key changes unauthorized)
SECRET-KEY SSR: rejected (RLS bypass)
HIDE / PROXY ONLY: still insufficient
PUBLIC LAUNCH PASS: withheld until an accepted Auth requirement is satisfied
```

**Hosted proof (2026-10-16):** The resource/cost gate is resolved: verified Free,
provider quote $0, explicit owner approval, and isolated project
`hyzkearnbhxznkeokacj`. Hosted provider/SSR checks **32/32** passed; actual
application unit/domain checks **43/43**, strict build/local checks **12/12**,
and legacy-disabled runtime checks **15/15** passed (overlapping runs).
The key scan found no private credentials in 141 public artifacts. Test settings
were restored. Production `brpppukzqgpzxjelwwrj` was not changed.
See `docs/release/auth-a-hosted-proof.md`; do not repeat the resolved cost gate.

**Next action:**

Local PKCE/profile/role, Storage/account-control and focused real numeric
OTP/renewal/document-HTTP checks are now passing (19, 16 and 13 checks in
separate overlapping runs). Carry forward unchanged historical CAPTCHA proof.
Review the draft candidate/staged cutover packet and confirm actual deployed
credential consumers/recovery baseline under explicit Production approval.
Do not repeat completed local evidence. Public-launch PASS remains
withheld. No spending, upstream wait, or residual acceptance is the default path.
