# AUTH-A Stage B — private configuration and recovery baseline

Updated: 2026-10-17. **DEPLOYED / CORE AUTHENTICATED CHECKS PASS / CONSUMER-RECOVERY DISPOSITION RECORDED. STAGE C NOT AUTHORIZED.**

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
or revoked. The configuration run itself changed no migrations, roles, business
data or registration fixtures. Later separately authorized fixture work is below.
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
| Fresh Production registration | PASS persistence readback after owner-operated normal-browser CAPTCHA; ACTIVE, MEMBER only, PRIVATE profile, no pending provisioning obligation |
| Synthetic MEMBER boundary/business | PASS; MEMBER denied EXCO; exactly one PRIVATE/DRAFT business created |
| Private document HTTP journey | PASS in focused 12-check run: hydrated server-action upload, exact 66-byte signed download, anonymous/public denial and nonexistent-ID denial |
| Normal synthetic-account logout | PASS via existing HTTP route; own-profile access becomes 401; database sessions read back zero |
| Exact approved fixture cleanup | PASS; Auth/application identity, profile, business, document, roles, sessions and Storage objects all zero; two audit entries preserved; real operator remains ACTIVE with unchanged roles |

Counts are separate overlapping observations, not an invented combined suite
total. The public artifact audit covers the five responses and their referenced
assets, **not every output-tree file** or every historical deployment.
Existing hosted/local proof is carried forward, not relabelled Production proof.

The earlier operator-only browser helpers did not change accounts or roles,
register users, upload documents, create businesses, enable test helpers or
capture auth state. Later synthetic fixture work has separate explicit approval.
Compensation fault injection, private-document HTTP access, remaining role actors
still require appropriate evidence. Do not manufacture these from
bucket metadata or unit tests. Existing global logout may affect other operator
devices; it was not invoked silently on the real operator account.

The owner separately approved exactly one clearly labelled synthetic MEMBER
registration using `olaoluface+tncodstageb20261017@gmail.com`, one PRIVATE test
business, one tiny non-sensitive document, and cleanup of only those fixtures.
No real account, unrelated role, migration, key retirement or spending is covered.
Read-only preflight found zero Auth/application matches for that alias and zero
application matches for the reserved fictional test phone. Cleanup foreign keys
were inspected first. Live CAPTCHA failed in the Playwright-controlled browser;
the owner reported it worked in a regular browser and submitted the exact test
registration there. Production readback confirms one ACTIVE Auth/application
identity `5d999e7e-bcd4-420b-857d-5f3fb28654ca`, MEMBER only, and PRIVATE,
REGISTERED, NOT_REVIEWED profile `e91fd971-2e36-4cc5-8278-b1f0937d329f`;
no pending provisioning obligation. This is owner-operated CAPTCHA plus persisted
registration evidence, not an automated CAPTCHA PASS or fault-injection proof.

The synthetic member then signed in using a genuine emailed code in the isolated
browser and was denied EXCO. The existing business API created exactly one
PRIVATE/DRAFT business `50d843ea-7e59-4c9a-bd19-d04499cb2399`, with its sole
OWNER association to that test profile. The upload attempt timed out waiting for
the success message; database readback found no document row. Navigation in the
test log suggests premature form interaction, but that is not a proved root
cause. That failed attempt is retained. The focused run reused the same business,
waited for the real React submit/change handlers, and recorded an actual upload
POST (200), persisted document, authorized signed redirect and exact-byte download.
Anonymous/public access and nonexistent-ID substitution were denied. Its initial
sign-in attempt also stopped with “Email is required”; readiness was corrected in
the harness without an application change. The final focused run passed all 12
checks, including real synthetic-account logout. These are not added to earlier
overlapping checks or used to erase failed attempts. One console error was counted
without its message; no uncaught page error, but no zero-console-error PASS.

Cleanup removed exactly that private object through Storage, the exact domain
fixture in a guarded atomic transaction, and the exact Auth identity through Auth
Admin. Final readback: zero fixture identities, profiles, businesses, documents,
roles, sessions and private objects. Both audit entries remain (the existing FK
nulls the deleted actor reference). The real operator remains ACTIVE with the
same EXCO_VIEWER/SUPER_ADMIN roles. No additional registration/business creation,
Production fault injection, global cleanup or application deployment was performed.
The stored phone differs from the proposed US fictional test number; no broad
international-phone acceptance is inferred, and cleanup was never phone-based.
Sanitized evidence: `evidence/auth-a/stage-b-private-fixture.json`.

## Actual consumer inventory

| Consumer | Observed state / disposition |
| --- | --- |
| Live SSR, OTP, active identity, middleware renewal | Stage B build and actual operator checks above |
| Registration and document signing/uploads | Fresh Production registration, exact document upload/download/denial and cleanup passed using the configured modern administrative consumer |
| Compensation and account-status controls | Same reviewed shared admin factory and modern config; actual local fault/status proofs carried forward. No Production fault injection or status toggle claimed |
| Vercel registration cleanup | Fresh project metadata: enabledAt present, disabledAt null, `/api/internal/registration-cleanup`, `0 3 * * *`; scheduler and Production target both point to current Stage B build. Source uses shared modern admin factory; no job invocation/success fabricated |
| Supabase Edge Functions | Native deployed-function list returned empty |
| Database scheduler | Read-only catalog query found no `pg_cron`/`pg_net` extensions or `cron.job` table |
| Repository GitHub secrets/variables | Both name inventories returned empty; CI uses reviewed loopback placeholders |
| Historical/manual scripts | Not approved for future Production use unless adapted/retired individually; no import/reclaim rerun |
| Old deployment artifacts | May retain historically exposed keys; not strict recovery candidates. Stage C retirement must account for these exposures |
| Current Preview Auth scope | Fresh environment metadata shows no Supabase Auth variable targeting Preview; no current preview Auth-key consumer. Historical artifacts remain covered by proposed old-key retirement |
| Other external integrations/tools | Owner explicitly confirmed “none” on 2026-10-17, including other apps, scripts, automations and integrations using Production API keys. This is owner confirmation, not an inference from source inspection, and is not key-deactivation authorization |

**Separate launch risk:** the same `DATABASE_URL` environment entry is scoped
to both Production and Preview. It was preserved under Stage B's explicit
database boundary; Preview credential segregation needs separate remediation
approval. No claim about its decrypted host or an actual data leak is made.

## Recovery and stop boundary

The Stage B READY artifact above is the **recorded modern-compatible application
recovery baseline**, paired with this exact private-key mapping and Production config.
The successful promotion demonstrates that the platform can select the artifact.
Core authenticated sign-in/renewal/role/registration/document/logout acceptance
has now passed. The subsequent deployed-consumer/exposure and recovery review is
recorded in `auth-a-stage-b-consumer-review.md`, with actual scheduler/target/scoping
metadata, owner-confirmed absence of external consumers, explicit evidence limits,
and exact proposed retirement/keep identifiers. No source-only absence or
Production fault/status proof is invented. The previously selected/tested artifact
and matching configuration are the modern-compatible application recovery baseline,
not a database/object restore proof.
Retain the fresh publishable and modern admin secret in their
providers, never in a plaintext recovery file. Future rollback must restore both
the tested artifact and matching private config; never blindly select the old
legacy-dependent Stage A build after key retirement.

AUTH-A and unrestricted launch remain OPEN. Stage C may now be proposed under the
recorded review but must not execute without separate explicit project/key and
restricted credential-use authorization. Recheck actual state before mutation;
stop on any new mismatch or unapproved consumer. No automatic re-enable, JWT
rotation, migration, new fixture or paid fallback.
