# AUTH-A — Stage B consumer and recovery disposition

Historical review: 2026-10-17. **STAGE B READINESS RECORDED.** Subsequent explicit
owner authorization covered Stage C; retirement and authenticated acceptance ran
2026-10-18. Configuration drift was cleaned under separate exact approval and
final verification passed; AUTH-A Production cutover is closed. Current evidence:
`auth-a-stage-c-retirement.md`. The proposal/stop boundaries below describe the
earlier pre-approval review; they are not the current retirement state.
Read-only review following the owner's explicit confirmation
that no other app, script, automation or integration uses Production API keys.
This confirmation does not authorize key deactivation or a public launch.

## Deployed consumers

| Consumer | Disposition and evidence |
| --- | --- |
| Application session, OTP, active identity, renewal, logout | MIGRATED: reviewed low-privilege private configuration on deployed `bcd113d`; real Production session/renewal/operator checks and synthetic-member logout passed |
| Registration and private documents | MIGRATED: actual Production registration and hydrated document POST, exact-byte signed download and access-denial checks passed; exact fixture cleanup verified |
| Registration compensation and account-status controls | MIGRATED credential route: same reviewed shared administrative factory and modern Production secret. Existing actual local fault/status proofs carried forward; no new Production fault injection/status toggle claimed |
| Registration cleanup scheduler | MIGRATED deployment/configuration: enabledAt present, disabledAt null; `/api/internal/registration-cleanup`, `0 3 * * *`; scheduler deployment and Production target both `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC`. Source uses the same modern administrative factory. No global job invocation or scheduled-run success claimed |
| Supabase Edge Functions / database scheduler | Previous actual function inventory empty; database catalog had no pg_cron/pg_net or cron.job. Carried evidence, not a source-only absence claim |
| GitHub CI | Actual repository secret/variable name inventories empty; reviewed workflow uses loopback/placeholders, not Production Auth credentials |
| Current Preview scope | Fresh actual environment metadata contains no Supabase Auth variable targeting Preview. It is not an Auth-key consumer in the current configuration. Historical preview artifacts may retain old values |
| Historical/manual scripts | INACTIVE NON-CONSUMERS under owner's confirmation; not approved for Production execution after retirement unless individually adapted/reviewed. No import/reclaim rerun and no files deleted |
| Other external consumers | NONE OWNER-REPORTED; recorded directly, not inferred from a repository search |
| Historical deployments | Superseded, not recovery candidates. Their old embedded public keys are covered by the proposed exact retirement set; deployments have not been deleted or disabled by this review |

The same DATABASE_URL record still targets Production and Preview. This existing
database-isolation risk remains a separate LC-F action; it is not resolved by
Auth API-key retirement. No decrypted connection string/host is logged and no
mutating Preview test was run. Other settings and integration mappings remain
unchanged. Future integration resync must not restore old browser key variables.

## Exact key inventory and proposed disposition

The native provider inventory lists exactly these five identifiers. Its projected
disabled field is absent/null, which alone does not establish active/disabled state.
No key value is recorded. A subsequent read-only GET `/auth/v1/settings` confirmed
missing/invalid controls return 401 and the legacy anon, default publishable and
fresh private publishable each return 200. This proves gateway acceptance on that
endpoint, not a fresh OTP enumeration test. No emails/accounts were queried or
changed. An initial PowerShell check failed without a usable diagnostic and is
not counted PASS; the bounded Node follow-up produced the recorded statuses.

| Identifier | Proposed disposition |
| --- | --- |
| `anon` | Retire with the legacy API-key control, only under separate Stage C authorization |
| `service_role` | Retire with the same legacy control; this is not JWT signing-key rotation |
| `1ea4c8c4-27ee-4375-8283-e410e1269c96` (default publishable) | Conservatively retire under specifically named authorization; exposure provenance is uncertain, not asserted proven |
| `e312b964-4eec-4d4d-90be-b2b5d67293c8` | KEEP: fresh private low-privilege Production session key |
| `f5b854cd-dc0a-41d5-8881-4659fa8c3bbf` | KEEP: modern server-only administrative secret; never an ordinary session credential |

## Recovery baseline

READY Production artifact `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC`, source CLI from
clean reviewed `bcd113de137bde1216aa147fc9cc699b40156884`, is the recorded
modern-compatible baseline. Actual promotion and subsequent live alias readback
proved the platform can select it; authenticated acceptance then passed. Fresh
project metadata now also matches the scheduler and Production target to it.

Recovery must pair that artifact with its tested private key mapping, strict flag
and existing configuration. Do not select an older legacy-dependent artifact,
re-enable exposed keys, rotate JWT signing keys, change signup/CAPTCHA policy,
undo migrations or alter roles as automatic recovery. This application rollback
baseline is not a data/object backup-and-restore proof; the separate free-tier
recovery gate stays open.

## Stop boundary

No keys were changed, no jobs were invoked and no deployment occurred in this
review. Stage C requires separate explicit approval naming Production project
`brpppukzqgpzxjelwwrj`, the legacy anon/service_role control and the exact old
publishable UUID above. Preserve both current modern keys. Verification must
use normal genuine sign-in/session flows and suppress all raw credentials.
No new fixture, migration, account/role mutation or spending is implicitly approved.
At this historical review, AUTH-A/public-launch PASS was withheld pending actual
post-retirement evidence. Stage C subsequently supplied that evidence and the exact
cleanup; AUTH-A Production cutover is now closed. Public-launch gates remain separate.

### Proposed Stage C approval scope — not execution authorization

Approval must name the project and three retirement entries above; retain the two
current modern keys. Because the native CLI has no applicable key-state mutation
command, the proposed scope also needs restricted use of its saved credential in
memory solely for those named Production key controls. Never display/store it.
This is a new scope beyond the earlier fresh-key-creation permission.

Verification may use the existing approved operator account via genuine emailed
code in the browser, with no administrative account/role change. Preserve an
authenticated pre-change session for continuity/renewal checks. Use old/missing/
invalid credentials only for bounded denial checks; no new synthetic registration,
private business/document, policy/JWT change, migration, deployment, paid resource
or full-suite rerun is implicitly authorized. Stop on identity/state mismatch,
provider denial, paid requirement or failed recovery prerequisite. Never automatically
re-enable an exposed key. If a necessary verification would exceed this scope,
report that specific missing authority before mutation rather than weakening it.
