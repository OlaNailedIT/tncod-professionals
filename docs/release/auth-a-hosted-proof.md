# AUTH-A — Hosted non-Production proof (LC-C)

**Updated:** 2026-10-16

**Status:** **PROVIDER AND LOCAL KEY-ISOLATION PROOF PASS / AUTHENTICATED ACCEPTANCE PENDING** — not a Production remediation PASS.

**Production project:** `brpppukzqgpzxjelwwrj` — **EXCLUDED**

**Disposable project:** `hyzkearnbhxznkeokacj` / `tncod-auth-a-disposable` / `us-east-1`

**Organization:** `qrctrhdndbuypymdxzkr` / `OlaNailedIT`

## Resource/cost gate — resolved

The owner confirmed Free and explicitly approved **$0 only**. The Supabase
organization API independently returned `plan: free`; its project-cost
tool quoted `amount: 0, recurrence: monthly`. One project was created on
2026-10-16. No upgrade, subscription, paid add-on, or paid fallback is authorized.
Do not ask for the already-confirmed plan again.

Production remains the original, separate project. No Production keys,
settings, schema, accounts, or deployment were changed by this experiment.

## Access and isolation

The owner separately authorized reuse of the CLI's saved credential, locally
and without display/logging, for this test project's Auth/key controls only.
The harness allowlists the exact test reference, checks its organization and
name, and rejects the Production reference. Credentials remain in memory,
travel over HTTPS, and are omitted from reports and commits.

Synthetic Auth identities and an owner-controlled test mailbox are used.
The secret key is used only for administrative fixture provisioning and token
retrieval; ordinary verification/session/RLS checks use the low-privilege
publishable key. No Production data was copied.

## Fresh evidence

- Test project is `ACTIVE_HEALTHY`.
- Modern publishable/secret and legacy anon/service-role keys are available.
- First provider run: **21 checks executed, 19 passed, 2 failed**.
- Passed checks included existing-user OTP, unknown-user denial with no new
  account, SSR OTP verification/cookies, session refresh, anonymous fixture
  row denial, and authenticated own-row-only access.
- The two failures were immediate legacy-setting readback and immediate
  recovery readback. Do not label that run PASS or erase it.
- A separate bounded recovery readback subsequently confirmed
  `enabled: true`; initial signup setting was also restored.
- The revised run used bounded propagation waits: **32 executed, 32 passed,
  0 failed**. Old anon/service-role keys returned 401 after deactivation;
  missing/invalid credentials, user-JWT-as-key and bearer-only requests
  returned the same 401 for known/unknown identifiers. Publishable-key
  session refresh, sign-out and fixture RLS continued to work.
- Both original settings were restored. The actual app's server-only
  configuration candidate passes **43 targeted tests**, typecheck and lint.
- The real-key production build and local checks passed **12/12**. A scan
  of **141** public browser/prerendered artifacts found no private test key,
  administrative secret or Management credential.
- The actual local app was then tested with hosted legacy keys disabled:
  **15/15** checks passed, including old-key rejection, neutral OTP responses,
  private-configuration health, anonymous route denial, disabled test helper
  and safe sign-out redirect. The initial hosted legacy setting was restored.
- These are separate, overlapping runs, not a unique acceptance-test total.
- Candidate branch: `test/auth-a-hosted-proof`, head
  `a5ae4e46a938e2eb3795c304264f52a8a3949d03`. Evidence and proposed
  cutover/recovery boundaries are committed in [draft PR #25](https://github.com/OlaNailedIT/tncod-professionals/pull/25).

These are fixture/provider and SSR-SDK checks, **not** full deployed-application
acceptance or proof that the actual app no longer exposes its key.

## Nine-item acceptance map

| # | Proof item | Current evidence |
| --- | --- | --- |
| 1 | Registration, existing OTP, verify, refresh, sign-out with server-held publishable | Hosted fixture provisioning/OTP/SSR verify/refresh passed initially; full app path not yet verified |
| 2 | Unknown sign-in creates no account | Passed hosted fixture check |
| 3 | Legacy works before deactivation and fails afterward | PASS on hosted Auth; no Production change |
| 4 | Missing/invalid credentials cannot recover enumeration | PASS; known/unknown both 401, including user-JWT-as-key and bearer-only variants |
| 5 | Anonymous/authenticated RLS stays enforced | Passed hosted sentinel table before deactivation; this is not the full application schema |
| 6 | Replacement key absent from browser bundles/public artifacts | PASS on actual local production-build candidate; 141 artifacts scanned |
| 7 | Pre-deactivation tokens/sessions evaluated | PASS with the private publishable key after legacy deactivation |
| 8 | Neutral application responses and alternate-oracle exclusion | Actual OTP HTTP response neutral with legacy keys disabled; tested missing/invalid/JWT-as-key/bearer-only provider variants denied. Full authenticated application acceptance remains pending |
| 9 | Hosted recovery | PASS: original legacy-key and signup settings restored after revised run; not a Production rollback drill |

## Next gate

Complete persisted registration, browser PKCE and full authenticated
application/DB, role and Storage journeys; inventory legacy credential
consumers; then review the candidate before any Production proposal. Do not repeat
the completed hosted-provider proof or irrelevant local Kong probes without
a concrete regression reason. Do not restore resource/cost as a blocker.

Production cutover and public-launch PASS remain unapproved. #21's named
migration approval, signed-in #22 acceptance, and human privacy/pilot gates
remain separate.
