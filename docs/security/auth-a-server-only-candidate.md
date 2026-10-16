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
criteria. Full authenticated application/DB, persisted registration,
browser PKCE and Storage acceptance are still pending; this candidate is
for draft review, not Production cutover.

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
3. Complete a full authenticated application journey, including persisted
   registration, PKCE callback, active-identity enforcement, refresh,
   sign-out and all role boundaries. Provider/fixture proof is not this gate.
4. Inventory every consumer of legacy anon **and service-role** credentials,
   including jobs, operational scripts, Storage uploads and signed URLs.
5. Obtain explicit owner approval for the exact Production environment/key
   changes. Existing approvals do not authorize that cutover.

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
