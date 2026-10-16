# PR #21 — Production release packet (interest roster)

**As of:** 2026-10-16  
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/21  
**Head (frozen for this packet):** `46662488976e51942841dfd5c0abcbd681bd5430`  
**Checks:** `verify` PASS · Vercel preview PASS · MERGEABLE  
**Status:** ready for owner release approval. **Not merged. Migration not applied.**

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

1. Confirm PR head remains `4666248…` and checks still PASS (re-check if intervening commits appear).
2. Owner authorization naming the file and project above.
3. Apply the transactional procedure in `docs/product/opportunity-interest-roster-production-migration.md` (verify existing `is_exco_viewer()` policy → apply reviewed file → insert `schema_migrations` version `20261016120000` only). No `supabase db push`.
4. Read back policy `(owns_profile OR is_exco_admin())` and history row.
5. Merge PR #21 and allow Git-linked Production deploy of that merge SHA.
6. Verify Production app serves the roster for EXCO_ADMIN/SUPER_ADMIN only.

## Recovery (default)

Roll back the **application** release. Keep the tighter SELECT policy and the history row. Restoring `is_exco_viewer()` or deleting the history row requires a **separate** reviewed recovery decision.

## Human acceptance after release

| Check | Who |
| --- | --- |
| Admin/Super sees current interest on the correct opportunity | Owner / EXCO operator |
| Viewer/Member cannot obtain another person’s roster | Owner / EXCO operator |
| Withdraw / empty / closed behaviours as specified | Owner / EXCO operator |
| Potential matches remain a separate panel; no contact on roster | Owner / EXCO operator |
| Operator cadence | Proposed only until owner accepts |

## Out of scope

Messaging, notifications, exports, applications, introductions, blanket migration push, AUTH-A cutover, PR #22/#23 release actions.
