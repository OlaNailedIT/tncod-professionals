# Preview database target — narrow scope correction

Date: 2026-10-18. **Approved target-only change verified.**

Owner replied **“Approve Preview-target removal only”** to the exact proposal:
remove Preview from the existing shared DATABASE_URL entry; preserve its
Production value/target; no deployment, new resource, copied data or spending.

The environment-variable skill's narrow-scoping guidance and Vercel's documented
[optional-target-only PATCH](https://vercel.com/docs/rest-api/projects/edit-an-environment-variable)
guided execution. No value/key/type field was submitted and no decrypted-value
endpoint or environment pull was used.

## Guarded change and readback

| Control | Result at `2026-10-18T14:14:03.6213156Z` |
| --- | --- |
| Project | `prj_YL2rguqWGr4kSjJTQhuU7r8g6pce`, scope `olanailedits-projects` |
| Exact existing row | `rKp3qjB39yrPZ1D5`, key `DATABASE_URL` |
| Targets before | `production`, `preview` |
| Targets after | `production` only |
| Stored representation and other row fields | Unchanged, excluding intended target and update timestamp/actor metadata |
| All 19 unrelated environment rows | Unchanged, full in-memory response comparisons |
| Active Production alias | Unchanged: `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK` |
| Deployment requested | No |
| Decrypted values retrieved, database data copied, spending | None |

The precondition rejected unexpected row identity, targets, branch/custom scope,
public Auth variables or an unexpected active deployment. Only the exact target
array was changed. Secret/provider response bodies were not printed or persisted.

A subsequent independent metadata readback still showed DATABASE_URL scoped only
to Production and no public Auth key variable. Every existing key matching
DATABASE/POSTGRES/DIRECT_URL/SUPABASE was Production-only in that readback; no
other currently configured Preview database binding was found by that inventory.

## Exact limit — not retroactive credential revocation

Future Preview builds no longer receive DATABASE_URL from this row. Database-backed
previews may remain unavailable until separately configured; use the proven local
disposable test environment rather than copying Production credentials or data.
Do not widen the row again merely to make a preview green.

Existing immutable Preview deployments can retain their previously supplied
configuration. This operation did not delete/redeploy them, revoke credentials,
change protection or disconnect an integration. Their retention/access protection
and any other database bindings require a separate containment review. No actual
credential leak or unauthorized database access is asserted.

This is not permission to rotate Production database credentials, remove other
variables, create a hosted resource or run mutating Preview tests.
