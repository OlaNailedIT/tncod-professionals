# PR #21 — Production release packet (interest roster)

**As of:** 2026-10-18 — exact owner-approved migration and Git-linked release completed
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/21  
**Head (frozen for this packet):** `267fd3012b06c489b298581da0a59b1a9b59466c`
**Checks:** fresh `verify` PASS · Vercel preview PASS · MERGEABLE / CLEAN
**Status:** **MERGED / RELEASED.** Named migration committed and independently read back. Merge `ce2ebaaa8fa507b0669a7565b67bbadd6673aaeb`; Git-source Production READY `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK`, actual azure alias points to this deployment. See `pr-21-production-release-2026-10-18.md`. Real-content/operator acceptance remains separate.

Earlier head `4666248` had green old checks but conflicted with current main.
The refresh merged main `bcd113d` without rewriting history. Only the launch board
had a textual conflict; main's board was retained and superseded AUTH-A status
edits removed from this feature PR. Main's private-auth code and the previously
reviewed roster implementation/migration are unchanged. Local verification:
34 executed/passed, 0 failed/skipped; typecheck, changed-file lint and build PASS.
Eight selected installed dependency versions match the lockfile; no install/upgrade.
Remote verify: https://github.com/OlaNailedIT/tncod-professionals/actions/runs/39098227471
Preview build: https://vercel.com/olanailedits-projects/tncod-professionals/4M2HRKfYf55DfXyiieTEz3V7Ss3Z
See `docs/release/pr-21-refresh-2026-10-18.md` on the frozen PR head. Do not change
that head solely to copy these post-push check results into it.

## What ships

| Layer | Change |
| --- | --- |
| Application | EXCO_ADMIN / SUPER_ADMIN current-interest roster on `/opportunities/[id]` (no contact fields; distinct from potential matches) |
| Database | Narrow `opportunity_interests_select` from `is_exco_viewer()` to `is_exco_admin()` |
| Migration file (only) | `supabase/migrations/20261016120000_opportunity_interest_roster_select.sql` |
| Target project | `brpppukzqgpzxjelwwrj` |

## Preserved evidence (do not re-require for docs-only edits)

- Fail-closed disposable database gate (`assertDisposableDatabaseEnv`)
- Application loader integration tests (opt-in disposable)
- Direct RLS policy tests under anon / member / viewer / admin / super (+ forged claims)
- Unit projection/panel tests

## Authorization phrase required before Production mutation

Exact owner authorization must name:

```text
File: 20261016120000_opportunity_interest_roster_select.sql
Project: brpppukzqgpzxjelwwrj
```

This packet alone is **not** authorization.

## Release order

1. Confirm PR head remains `267fd30…` and its fresh checks still PASS (re-review if intervening commits appear). Verify the existing strict private Auth configuration/public-variable guard before any build/release; do not change keys.
2. Owner authorization naming the file and project above.
3. Apply the transactional procedure in `docs/product/opportunity-interest-roster-production-migration.md` (verify existing `is_exco_viewer()` policy → apply reviewed file → insert `schema_migrations` version `20261016120000` only). No `supabase db push`.
4. Read back policy `(owns_profile OR is_exco_admin())` and history row.
5. Merge PR #21 and allow Git-linked Production deploy of that merge SHA.
6. Verify Production app serves the roster for EXCO_ADMIN/SUPER_ADMIN only.

The owner explicitly approved the exact file/project, head `267fd30…`, and the
equivalent single guarded transaction through the existing Supabase connector
instead of the runbook's `psql` command: “Approve this exact roster release”.
That approved method was executed once and committed. Independent readback:
`(app.owns_profile(profile_id) OR app.is_exco_admin())`, RLS enabled,
exactly one history row for `20261016120000`; own-row insert/delete unchanged.
The reviewed file, exact project and single migration version remained fixed.
Do not retrieve unrelated credentials or use `apply_migration` to invent another
history version. No blanket migration push.

Historical read-only Production preflight on 2026-10-18, **before execution**:
RLS enabled, expected Viewer SELECT expression, version `20261016120000` absent.
This is no longer the current policy/history state; see committed readback above.
At inventory time there were
no opportunities or interests, so post-release nonempty roster acceptance needs
genuine operator content/participant activity. Do not invent Production fixtures
or claim an empty-list smoke proves the real-interest workflow.

## Recovery (default)

Roll back the **application** release. Keep the tighter SELECT policy and the history row. Restoring `is_exco_viewer()` or deleting the history row requires a **separate** reviewed recovery decision.

## Human acceptance after release

| Check | Who |
| --- | --- |
| Admin/Super sees current interest on the correct opportunity | Owner / EXCO operator |
| Viewer/Member cannot obtain another person’s roster | Owner / EXCO operator |
| Withdraw / empty / closed behaviours as specified | Owner / EXCO operator |
| Potential matches remain a separate panel; no contact on roster | Owner / EXCO operator |
| Operator cadence | **Accepted 2026-10-18:** project owner; interest review weekly and before opportunity closure. Real follow-up remains unproven |

## Out of scope

Messaging, notifications, exports, applications, introductions, blanket migration push, AUTH-A cutover, PR #22/#23 release actions.
