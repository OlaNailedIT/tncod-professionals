# AUTH-A Stage A — compatible code release

Date: 2026-10-17. Owner explicitly authorized Stage A of PR #25 at reviewed
head `ab9080b4b77aa595442a9a847f41598c86d048f2`. This authorization excludes
Production environment/key changes, legacy-key deactivation, PR #21's
migration, account changes, paid resources and public-launch approval.

Status: **STAGE A RELEASED / VERIFIED WITHIN ITS LIMITED ACCEPTANCE SCOPE**.
AUTH-A itself remains OPEN; no authenticated Production journey is claimed.

## Review and source identity

- [PR #25](https://github.com/OlaNailedIT/tncod-professionals/pull/25) was taken
  out of draft and merged normally at `2026-10-17T05:55:30Z`, without bypass,
  as `bcd113de137bde1216aa147fc9cc699b40156884`. Main matches that SHA.
- Exact-head pre-merge CI verify and preview passed. Review covered the eight
  runtime files, test guards, scripts and evidence. No schema, dependency,
  authorization-role or signup/CAPTCHA policy change.
- Local merge-tree against previous main `52f3d8c` was conflict-free. Its
  incremental diff contains the same 26 PR files and passes whitespace checks;
  PR #23 dashboard changes are retained, not reverted.
- Fresh targeted configuration/OTP/redirect/error/authorization tests:
  **29 passed, 0 failed, 0 skipped**. Fresh typecheck and changed-file lint pass.
  Earlier disposable hosted/local acceptance is carried forward, not rerun or
  counted as fresh Production acceptance.
- Compatibility mode retains the existing public anon configuration unless
  strict/private settings are separately configured. User sessions use a
  low-privilege client; privileged administration remains separate.

## Production identity and read-only acceptance

Deployment `dpl_E4iNVkhfeViyz3HEuTtHzwiUJoef` is READY, target Production,
source Git. `gitSource.sha` and `meta.githubCommitSha` both equal the merge
SHA. Project `prj_YL2rguqWGr4kSjJTQhuU7r8g6pce`, team
`team_zvTxCHUqJDtCr1ezQWjg0LcR`; azure alias is assigned without error.

| Check on azure | Result |
| --- | --- |
| `/`, `/sign-in`, `/join`, `/professionals` | 200 on all four |
| `/dashboard`, `/profile`, `/opportunities`, `/exco` anonymous | 307 to sign-in with correct `next` on all four |
| `/api/runtime/session` anonymous | `supabaseConfigured: true`, `sessionPresent: false`, matching pre-release baseline |
| POST `/api/test/auth-session` with empty JSON and no cookies | 404 `DISABLED`; no session created |

Ten smoke checks passed. No emails, registrations, signed-in sessions or
member-data writes were initiated. No key/configuration/migration/role change.
Runtime error query for this deployment: last 15 minutes, limit 20,
zero returned error entries. This bounded sample is not continuous monitoring;
drains and monitoring coverage were not audited in this release.

## CI discrepancy retained

[Main run 39008021795](https://github.com/OlaNailedIT/tncod-professionals/actions/runs/39008021795)
attempt 1 failed in Build, after typecheck, lint and unit/domain tests passed.
The existing `next/font/google` loader raised a null-match TypeError while
extracting the font-file extension in `src/lib/fonts.ts` (Inter). The font
source and dependencies are unchanged by #25. Vercel built the same merge
successfully. Exact upstream font response/cause was not captured; do not
claim a proven network outage or a permanent fix. The single failed-job retry,
attempt 2, **passed** at `2026-10-17T06:33:16Z`, including typecheck, lint,
unit/domain tests and build. Both outcomes are retained; no font/dependency
change or additional retry was made.

## Remaining boundary

AUTH-A stays OPEN. This release alone neither removes public keys nor denies
their direct provider access. Stage B private configuration, deployed-consumer
inventory and modern-compatible recovery deployment require separate approval;
Stage C exact key deactivation requires another explicit approval. The existing
Production configuration is not certified as a strict recovery baseline.
Signed-in released-build and participant/device acceptance remain pending.
No paid workaround, retrospective PASS or automatic key re-enable is permitted.
