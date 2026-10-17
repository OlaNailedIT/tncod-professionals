# AUTH-A Stage B — private configuration and recovery baseline

Updated: 2026-10-17. **DEPLOYED / ACCEPTANCE INCOMPLETE. STAGE C NOT AUTHORIZED.**

The owner approved Stage B, then separately approved restricted in-memory
Supabase CLI credential reuse to create a fresh publishable key only on
Production `brpppukzqgpzxjelwwrj`, and use of the existing operator account
`olaoluface@gmail.com` with codes entered directly in an isolated browser.
No secret, code, cookie or signed URL is recorded here.

## Changes actually made

| Production setting | Result |
| --- | --- |
| `SUPABASE_URL` | Verified exact Production project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Fresh low-privilege key `e312b964-4eec-4d4d-90be-b2b5d67293c8`, named `auth_a_stage_b_server_20261017` |
| `SUPABASE_AUTH_SERVER_ONLY` | `1` |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing modern administrative secret `f5b854cd-dc0a-41d5-8881-4659fa8c3bbf`; never used for ordinary SSR |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production variable removed |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production variable removed |

All **16 unrelated environment entries** retained identical identity, target,
type, integration and update metadata across the successful configuration run.
Database, site URL, Turnstile, cron authorization, JWT signing configuration and
unrelated Supabase variables were not changed. No provider API key was disabled
or revoked. No migrations, roles, business data or registration fixtures changed.
No paid upgrade, add-on, project or resource was provisioned.

The integration-managed publishable variable remains **encrypted**, not the
Vercel Sensitive type: the platform explicitly rejects that type conversion.
Its name is server-only and it is absent from audited public artifacts. This
is not a paid-plan limitation or a downgrade of an existing Sensitive secret.
The administrative variable remains Sensitive. Treat future integration resync
as a reviewed operation; do not overwrite the private mapping with the old
default publishable key or regenerate key settings blindly.

## Source, deployment and actual alias

- Main/application commit remains `bcd113de137bde1216aa147fc9cc699b40156884`.
- Built from a separately prepared **clean checkout** of that reviewed commit,
  with verified existing project/team and Production settings. No source change.
- Deployment: `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC`, READY, target Production,
  source **CLI**, `meta.gitCommitSha` equals the reviewed commit. This is not
  labelled a fresh Git-webhook deployment or a `gitSource.sha` observation.
- Staged with `--skip-domain`; actual azure alias lookup still resolved to
  `dpl_E4iNVkhfeViyz3HEuTtHzwiUJoef` before promotion.
- After staged checks, normal `vercel promote` succeeded. A fresh alias lookup
  resolved `tncod-professionals-azure.vercel.app` to the Stage B deployment and
  project `prj_YL2rguqWGr4kSjJTQhuU7r8g6pce`.
- Team: `team_zvTxCHUqJDtCr1ezQWjg0LcR` / `olanailedits-projects`.

## Fresh acceptance evidence and limits

| Evidence | Result |
| --- | --- |
| Fresh publishable Auth health | PASS |
| Modern administrative Storage bucket read | PASS; `member-documents` remains private; no objects written/read |
| Staged public rendered responses | Five routes returned 200: home, sign-in, join, directory, privacy |
| Staged browser asset audit | 15 referenced JS/CSS assets; compared against all five known API-key values in memory; no matches or modern credential literals |
| Staged access/session/helper checks | Anonymous dashboard/profile/opportunities/EXCO denied; session configured without session; helper 404 |
| Promoted azure smoke | Home/sign-in/join/directory 200; dashboard/EXCO 307 to sign-in; anonymous session configured with no session |
| Runtime errors | Query for this deployment, 15-minute window, limit 20: zero returned entries; not continuous monitoring |
| Real emailed-code operator baseline | PASS; actual UI signed into exact approved operator; no session shortcut |
| Pre-cutover session on strict build | PASS |
| Direct identity substitution | PASS; synthetic nonexistent UUID denied, no unrelated member probed |
| Actual middleware renewal | PASS; this isolated session renewed and rotated its refresh token; tokens never recorded |
| Fresh code on strict live build | PASS in focused follow-up; actual operator identity confirmed |
| Member to EXCO and return | PASS on desktop: actual visible member EXCO link, exact `/exco` and Operational overview, then Member dashboard link, exact `/dashboard` and Welcome heading, without another sign-in |
| Additional strict boundaries | Helper remains 404; own-business loader remains authenticated |
| Earlier stopped browser runs | Retained: first stopped in navigation section without adequate exception detail; focused initial attempt timed out on `load` before requesting email, though sign-in main content was visible. Corrected harness uses DOM readiness plus exact URL/unique content, not weaker destination assertions. Neither initial stop is falsely counted as PASS |
| Normal operator logout | Awaiting operator; no silent global logout invoked |

Counts are separate overlapping observations, not an invented combined suite
total. The public artifact audit covers the five responses and their referenced
assets, **not every output-tree file** or every historical deployment.
Existing hosted/local proof is carried forward, not relabelled Production proof.

The isolated browser helper does not change accounts or roles, register users,
upload documents, create businesses, enable test helpers or capture auth state.
Actual Production registration/compensation, private document HTTP access,
remaining role actors and logout still require appropriate released-build
evidence. Do not manufacture these from bucket metadata or unit tests. Existing
global logout may affect other operator devices; it was not invoked silently.

The owner separately approved exactly one clearly labelled synthetic MEMBER
registration using `olaoluface+tncodstageb20261017@gmail.com`, one PRIVATE test
business, one tiny non-sensitive document, and cleanup of only those fixtures.
No real account, unrelated role, migration, key retirement or spending is covered.
Read-only preflight found zero Auth/application matches for that alias and zero
application matches for the reserved fictional test phone. Cleanup foreign keys
were inspected first. A separate isolated browser has filled the normal live
join form and is waiting for the genuine CAPTCHA. No fixture write or registration
PASS is claimed at this checkpoint. Any emailed code must be entered directly
in that browser, never chat. Production fault injection/global cleanup is excluded.

## Actual consumer inventory

| Consumer | Observed state / disposition |
| --- | --- |
| Live SSR, OTP, active identity, middleware renewal | Stage B build and actual operator checks above |
| Registration/compensation, account controls, document signing/uploads | Same reviewed shared admin factory now configured with modern secret; fresh bucket read passed; unexecuted functional rows remain explicit |
| Vercel registration cleanup | Actual project cron enabled: `/api/internal/registration-cleanup`, `0 3 * * *`; source uses shared admin factory. No global cleanup invocation or job success fabricated |
| Supabase Edge Functions | Native deployed-function list returned empty |
| Database scheduler | Read-only catalog query found no `pg_cron`/`pg_net` extensions or `cron.job` table |
| Repository GitHub secrets/variables | Both name inventories returned empty; CI uses reviewed loopback placeholders |
| Historical/manual scripts | Not approved for future Production use unless adapted/retired individually; no import/reclaim rerun |
| Old deployment artifacts | May retain historically exposed keys; not strict recovery candidates. Stage C retirement must account for these exposures |
| Other external integrations/tools | Not declared absent from repository/source inspection; owner/operator reconciliation remains open |

**Separate launch risk:** the same `DATABASE_URL` environment entry is scoped
to both Production and Preview. It was preserved under Stage B's explicit
database boundary; Preview credential segregation needs separate remediation
approval. No claim about its decrypted host or an actual data leak is made.

## Recovery and stop boundary

The Stage B READY artifact above is the **candidate modern-compatible recovery
baseline**, paired with this exact private-key mapping and Production config.
The successful promotion demonstrates that the platform can select the artifact.
Authenticated acceptance must finish before certifying the complete baseline or
proposing Stage C. Retain the fresh publishable and modern admin secret in their
providers, never in a plaintext recovery file. Future rollback must restore both
the tested artifact and matching private config; never blindly select the old
legacy-dependent Stage A build after key retirement.

AUTH-A and unrestricted launch remain OPEN. Do not request or execute Stage C
until the unresolved acceptance/consumer/recovery rows are dispositioned. Any
later legacy anon/service-role or exposed-modern-key retirement needs explicit
project/key authorization. No automatic re-enable, JWT rotation or paid fallback.
