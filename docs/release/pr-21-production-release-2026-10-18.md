# PR #21 — Production release evidence

Date: 2026-10-18. **MERGED / RELEASED. Public launch still withheld.**

## Exact authority and source

Owner answered **“Approve this exact roster release”** to a request naming head
`267fd3012b06c489b298581da0a59b1a9b59466c`, only
`20261016120000_opportunity_interest_roster_select.sql`, Production project
`brpppukzqgpzxjelwwrj`, and the equivalent guarded Supabase-connector transaction
instead of the packet's `psql` command, followed by merge/deployment verification.
No other migrations, Auth/role changes, synthetic Production fixtures or spending.

The old head conflicted with main. A normal current-main integration refresh
retained private-auth implementation and the reviewed roster SQL/code unchanged.
Only the release-board text conflicted; current main's board was retained.
Fresh verification: **34 passed, 0 failed, 0 skipped** across seven local suites;
typecheck, changed-file lint and build PASS. Dependency versions checked against
the lockfile; no install or upgrade. Cases overlap; not 34 distinct journeys.

Fresh verify and Vercel checks passed on the approved head:
https://github.com/OlaNailedIT/tncod-professionals/actions/runs/39098227471

Post-merge main verify also passed on exact `ce2ebaa`:
https://github.com/OlaNailedIT/tncod-professionals/actions/runs/39134057412

## Database execution — committed once

Project identity and exact old policy/history/RLS preconditions were checked.
One guarded transaction applied the reviewed migration body and inserted only
history version `20261016120000`; timeout/precondition/postcondition failures
would roll back. The same wrapper passed a local PostgreSQL rollback dry run
before Production, leaving local policy/history unchanged.

Independent Production readback after commit:

| Control | Observed |
| --- | --- |
| RLS | Enabled |
| SELECT, authenticated | `(app.owns_profile(profile_id) OR app.is_exco_admin())` |
| History version `20261016120000` | Exactly one row |
| DELETE own-row policy | Unchanged: `app.owns_profile(profile_id)` |
| INSERT own-row check | Unchanged: `app.owns_profile(profile_id) AND app.account_is_active()` |
| Additional SELECT/ALL policies | None |

No real member data, roles, Auth policy or private objects were changed.
**Do not replay this migration.** Recovery defaults to application rollback while
keeping the tighter SELECT policy and history. Never restore Viewer access,
delete history or re-enable retired keys without separate reviewed authority.

## Normal release identity

| Fact | Observed |
| --- | --- |
| PR | https://github.com/OlaNailedIT/tncod-professionals/pull/21 |
| Approved head | `267fd3012b06c489b298581da0a59b1a9b59466c` |
| Merge time | `2026-10-18T14:00:36Z` |
| Merge/main SHA | `ce2ebaaa8fa507b0669a7565b67bbadd6673aaeb` |
| Production deployment | `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK` |
| Source / state / target | `git` / `READY` / `production` |
| Project | `prj_YL2rguqWGr4kSjJTQhuU7r8g6pce` |
| `gitSource.sha`, `meta.githubCommitSha` | Both equal merge/main SHA |
| Actual azure alias | Points to this exact deployment |

Normal guarded merge required unchanged approved head, green checks and clean
merge state. No bypass, force push, manual deployment or Preview promotion.
This automatic deployment succeeded; it does not explain the historical missing
#22 webhook. Header/chunk similarity was not used as sole identity evidence.

Read-only live smoke: **8 passed, 0 failed**. `/`, `/sign-in`, `/privacy`, and
`/professionals` returned 200; `/opportunities`, `/exco`, and `/dashboard` returned
307 to sign-in with matching `next` destinations; `/design-system` returned 404.
No form submitted. This is public/access smoke, not a signed-in roster UI test.

## Preserved authentication boundary

Fresh metadata-only checks found **zero public Supabase Auth variables** before
release and again on the released deployment. The three private Production Auth
variable IDs/targets remain unchanged; no values printed or persisted. AUTH-A
Stage C evidence stands. Do not repeat registration, CAPTCHA, OTP or private-doc
fixtures merely because this unrelated roster feature shipped.

## Evidence limits / remaining acceptance

Read-only aggregate inventory before release found **zero opportunities and zero
interest rows**, and zero verified active profiles among 23 active profile records.
These are not 23 confirmed participants. No synthetic Production content was
created. Local disposable loader/RLS assertions prove the tested role behavior;
an empty Production site cannot prove the genuine nonempty roster workflow.

Named EXCO operators must supply genuine opportunities and willing-member review
through existing workflows, then complete real-interest acceptance and accept a
follow-up cadence. Physical-device, comprehension/pilot, Privacy-L1, AUTH-B,
protected recovery and other recorded launch gates remain open. No launch PASS.
