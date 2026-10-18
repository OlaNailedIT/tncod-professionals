# AUTH-A Stage C — named Production key retirement

Executed: 2026-10-18. **STAGE C PASS / AUTH-A PRODUCTION CUTOVER CLOSED.**
Public-launch PASS remains withheld for other LC gates. Do not repeat retirement
or Stage B. The drift initially blocked closeout, then the owner separately
approved its exact cleanup; final verification passed as recorded below.

## Authorization and actual changes

The owner explicitly authorized “Stage C within that scope”: Production project
`brpppukzqgpzxjelwwrj`, legacy anon/service_role retirement and deletion of the
exact old default publishable key, restricted in-memory CLI credential use, and
normal operator sign-in/session verification. Codes were entered by the owner
directly in isolated browser windows, not supplied in chat or retrieved by an agent.

| Named key/control | Actual result |
| --- | --- |
| Legacy `anon` and `service_role` | Disabled together through the legacy API-key control; disabled state read back twice |
| Old publishable `1ea4c8c4-27ee-4375-8283-e410e1269c96` | Deleted; absence verified in subsequent inventories |
| Private publishable `e312b964-4eec-4d4d-90be-b2b5d67293c8` | Preserved unchanged; gateway and genuine application sign-in/refresh work |
| Modern admin `f5b854cd-dc0a-41d5-8881-4659fa8c3bbf` | Preserved unchanged; existing private-bucket metadata read succeeds |

Retirement occurred at approximately 03:50 UTC. No JWT signing-key rotation,
Auth/signup/CAPTCHA policy change, migration, new account/fixture, role change,
merge, deployment, global logout or spending was performed. No exposed key was
automatically re-enabled. Provider Auth configuration compared unchanged across
the mutation. Later Vercel metadata updates are a separate observation below,
not evidence that provider signing keys were rotated.

## Actual acceptance and evidence limits

- Five credential classes—missing, invalid, legacy anon, legacy service_role,
  deleted old publishable—each returned 401 for a known operator and an unknown
  previously deleted synthetic alias: **10 denial requests**. Within each class,
  known/unknown response bodies were identical. `create_user:false` throughout.
- The genuine pre-retirement operator session survived. Actual middleware refresh
  renewed expiry and rotated its refresh token. Its JWT role was `authenticated`,
  not `service_role`, with the same operator subject.
- Actual user-scoped REST returned the targeted own profile. Anonymous access to
  that same profile was denied/empty. This operator is SUPER_ADMIN: this does not
  claim a fresh MEMBER-versus-other-member RLS matrix; prior disposable evidence
  remains separate. No other real member was probed.
- Fresh genuine post-retirement sign-in passed. Hydrated desktop Member → EXCO
  → Member navigation passed; substituted identity was denied, anonymous member
  API/EXCO were denied/redirected, and the Production helper remained 404.
- Initial run: **40 checks passed**, no failed assertion, then a subsequent browser
  navigation timed out before its EXCO assertion. The last-stage label still said
  renewal, but recorded renewal and identity checks had already passed. The exact
  timed-out navigation sub-step was not captured; do not invent a root cause.
- Focused follow-up: **10 checks passed**, no failed assertion/skip. It adds explicit
  hydration/step markers; no product change. The initial timeout remains recorded.
  One browser console error was counted without its message; zero page errors.
  Do not claim a zero-console-error run or retrospectively classify that message.
- Initial final read-only provider/release check: **6 passed, 1 failed**. The failure
  was configuration drift, not key retirement, session renewal or sign-in. After
  separately approved cleanup, the final check passed **7/7**, no failed assertion/skip.
  Runs overlap; do not sum check totals as unique acceptance criteria. The earlier
  project-output capture failure stopped before credential access/key mutation.
- No fresh post-retirement document upload, registration, fault injection, account
  suspension or global operator logout was performed. Actual Stage B evidence for
  those approved fixtures/controls is carried forward with its original limits.

## Final configuration drift — found, approved cleanup, resolved

Final Vercel metadata found **one newly recreated Production variable**:
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, id `tX0USW87AdVSwyRX`, associated with
existing integration configuration `icfg_4ZAv3ps9iSGFdX4E4Bblx7Co`. An in-memory
decrypted comparison matched it to preserved key
`e312b964-4eec-4d4d-90be-b2b5d67293c8`; no value was logged or saved.

It was created around the retirement, with update times matching several other
integration-associated Supabase env rows. This supports integration resynchronization;
the exact provider event/trigger has not been independently captured. The private
publishable row, JWT-secret row and integration secret row also have new update
metadata. Their changed metadata alone does not establish changed secret values.

The live azure alias still points to READY modern-compatible artifact
`dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC`, CLI source from clean
`bcd113de137bde1216aa147fc9cc699b40156884`. No deployment was performed here.
This configuration drift is a future-build exposure risk; it does **not** prove
that the unchanged live build published this newly restored variable's value.
That initial drifted configuration was not eligible for a deploy/rebuild or closeout.

The owner separately replied **“Approve this exact variable cleanup.”** Only
Production `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` entry `tX0USW87AdVSwyRX` was
removed with the normal project-scoped environment command. All **20 other
provider rows** remained identical in in-memory full-row comparisons across three
readbacks: 04:01:44, 04:02:21 and 04:02:59 UTC. No plaintext values/fingerprints were
written to evidence. No integration disconnection, key rotation or deploy occurred.

The project-scoped latest-20 deployment listing at 04:02:17 UTC had newest
creation time `1792263458357`, older than drift creation `1792295446075`: no deployment
was created during this drift window. The CLI's id/uid projection returned null;
do not use those null fields as deployment identity proof. Independent actual
alias/deployment readback confirms the unchanged READY Stage B artifact.
The final provider/release check at 04:03:19 UTC passed all seven checks, including
public-variable absence, disabled legacy control, absent old key, both current
modern keys accepted, and the exact live artifact/private mapping identities.

**Continuing operating guard:** after any provider-key change or integration
resync, recheck all relevant public Auth variable scopes before a build/release.
If restored, stop and remove only under the applicable approval; never deploy it,
automatically re-enable retired keys or assume an old recovery build is safe.
This cleanup does not claim that future integration resync is disabled permanently.
The selected server-only-key mitigation closes this Production AUTH-A cutover;
it does not claim that upstream GoTrue's response behavior has been fixed.

## Evidence and recovery

Sanitized reports: `evidence/auth-a/stage-c-retirement.json`. No credentials, OTPs,
cookies, session state, signed URLs or raw response bodies are retained there.
The Stage B artifact AND its tested private configuration remain the recovery
baseline; the current drift must not silently become the new recovery config.
Never return to the legacy-dependent Stage A artifact or re-enable retired keys.
Data/object restore, AUTH-B, Privacy-L1, remaining device/comprehension/pilot gates,
Preview database isolation, #21 and operating ownership remain separate work.
