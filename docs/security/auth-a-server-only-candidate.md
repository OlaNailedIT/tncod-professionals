# AUTH-A — server-only key candidate (not a Production closeout)

## Scope and evidence

The isolated hosted Free project `hyzkearnbhxznkeokacj` is the only project
mutated by the proof harness. Production `brpppukzqgpzxjelwwrj` is excluded.
The owner approved $0-only provisioning and in-memory CLI credential reuse
only for the disposable project's Auth settings and keys.

The hosted provider/SSR-SDK proof passed **32 checks, 0 failed** after adding
bounded readback waits. The initial **19 passed / 2 failed** run remains in
the redacted evidence; it is not silently replaced with PASS. Fixture OTP,
verification, refresh, sign-out and own-row RLS worked with the publishable
key. Deactivated legacy keys, missing/invalid keys, user JWT-as-key and
bearer-only requests could not expose different known/unknown OTP responses.
Initial legacy-key and signup settings were restored. The secret key was
used only for administrative fixture provisioning, never ordinary SSR.

Evidence: `docs/release/evidence/auth-a/hosted-provider-proof.json`.
This is **not** the full application schema, real-participant acceptance,
or evidence that Production keys are disabled.

### Fresh application checks

- Targeted unit/domain tests: **43 passed, 0 failed, 0 skipped**.
- Typecheck and changed-file lint: PASS.
- Actual strict-mode Next build and local checks: **12/12 passed**.
- Actual app runtime with hosted legacy keys disabled: **15/15 passed**,
  including uniform OTP responses, anonymous route gates, disabled test
  helper and safe sign-out redirect. The hosted setting was restored.
- **141** public bundle/prerendered files scanned: none contained the live
  private publishable key, administrative secret or Management credential.

The two application reports are in the same evidence directory. Counts are
separate runs with overlapping checks, not a count of unique acceptance
criteria.

The first full local application journey subsequently passed **1 test / 19
boundary checks**: real browser email/PKCE sign-in, persisted registration,
profile save/readback, session reload, identity-substitution denial, MEMBER
denial and all three EXCO roles, suspended-session rejection and sign-out.
Registration used the existing test CAPTCHA verifier, not real UI CAPTCHA
acceptance. The Next production-mode build used local modern private keys
with session helpers disabled. Synthetic local fixtures were retained.

An expanded follow-up **failed** before the new email arrived: **1 test
executed, 0 passed, 1 failed, 0 skipped**, with seven preceding boundary
checks completed. Auth logs showed HTTP 429; the local stack is configured
for two emails/hour. The exact provider error code was not established, so
the quota explanation remains a diagnosis, not a claimed definitive cause.
Numeric-code UI, renewed application session and Storage checks were **not
reached**. No retries or service/config changes were used to manufacture PASS.
Both outcomes are retained in `docs/release/evidence/auth-a/local-application.json`.

This candidate remains draft, not ready for Production cutover. Outstanding
browser acceptance includes numeric OTP, actual session renewal and the
signed-document HTTP route, plus real registration CAPTCHA and a compatible
rollback artifact.

An independent application-component run bypassed the email dependency, not
authorization: actual document upload, private/public denial, owner download,
unrelated MEMBER/Viewer denial, Admin/Super Admin review and canonical Auth
ban/application-status suspension/reactivation passed **1 test / 16 checks**
with the modern administrative secret. This does not claim browser-session
acceptance for the document route. Its initial attempt failed after 12 checks
with an unclassified cause; the follow-up added read-only role-grant preflight
and redacted failure-stage diagnostics, not an application/permission change.
Both outcomes are in `docs/release/evidence/auth-a/local-consumers.json`.

## Application candidate

All session-bearing server paths share `getSessionSupabaseConfig`: SSR,
middleware, OTP request, sign-out, runtime session probe and the existing
non-Production test-session helper. The latter remains 404 in production.
The privileged fixture/registration client remains separate.

| Variable | Intended use |
| --- | --- |
| `SUPABASE_URL` | Server/Edge provider URL; public URL fallback remains compatible |
| `SUPABASE_PUBLISHABLE_KEY` | Low-privilege key used only by the server/Edge |
| `SUPABASE_AUTH_SERVER_ONLY=1` | Require private configuration and reject browser-exposed Auth keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing privileged administration variable; a cutover must replace its legacy value with a modern secret key |

Without strict mode/private configuration, legacy operation is retained so
merging code cannot itself deactivate keys. **A merge alone does not close
AUTH-A.** Secret/service-role keys and user JWTs are forbidden for session
Auth. The browser helper remains unused; strict configuration supplies it
with no public API key.

## Required before proposing Production cutover

1. Review the candidate and exact-head CI/build evidence.
2. Verify the actual build's browser/prerendered artifacts contain none of
   the live private test credentials. Keep production-style test helpers off.
3. Carry forward the completed local PKCE/registration/profile/role evidence;
   finish numerical-code UI, application refresh and signed-document HTTP
   acceptance once local email delivery is available. Carry forward the 16
   passing Storage/account-status component checks; verify real CAPTCHA
   separately. Provider/fixture proof is not a substitute for application
   consumer acceptance.
4. Inventory every consumer of legacy anon **and service-role** credentials,
   including jobs, operational scripts, Storage uploads and signed URLs.
5. Obtain explicit owner approval for the exact Production environment/key
   changes. Existing approvals do not authorize that cutover.

Repository credential consumers and historical script limitations are listed
in `docs/security/auth-a-key-consumers.md`. This is not proof of the actual
Production environment or external scheduler/tool configuration.

## Proposed sequence — NOT execution authorization

- Release compatible code under the normal reviewed Git-linked process.
- Configure private publishable Auth and modern administrative secret on
  the server, remove public Auth-key variables, and enable strict mode in a
  reviewed Production-targeted build. Do not rotate JWT signing keys.
- Verify legitimate flows on that build before disabling legacy API keys.
- Explicitly disable legacy anon/service-role API keys only after all their
  consumers have replacements. Re-test old-key denial and legitimate flows.
- Keep AUTH-A open until the actual active Production alias and evidence
  meet all gates; do not infer closure from a preview or provider fixture.

## Recovery constraint

After deactivation, do not blindly roll back to code requiring the exposed
legacy key. Preserve a tested, modern-key-compatible rollback artifact and
its matching environment. Restoring publicly known legacy credentials
reopens the residual and requires a separate recovery/risk decision.
The hosted fixture recovery exercise is not a Production rollback drill.

No Production migration, key change, deployment or account mutation is
authorized by this document. No paid resource is required or approved.
