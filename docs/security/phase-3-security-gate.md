# Phase 3 — Database, RLS and security gate

## Status

**PASS — COMPLETED — LOCKED**

**Closure date:** 2026-09-25

**Production Supabase project:** `brpppukzqgpzxjelwwrj`

**Authoritative source merge:** PR #1, commit `1645d5daea75c664cc3f15e281cf12f0b46b2df1`

This gate certifies the implemented database, RLS and database-security controls listed below. It is not legal-compliance certification. PIPEDA, GDPR, POPIA, NDPA, retention and consent wording still require legal review.

## Closure decision

Phase 3 passed because the required remediation is applied in Production, reconciled to authoritative source control and supported by repeatable negative tests. Phase 3 must not be reopened without a schema, RLS, database privilege or security-boundary change.

Phase 4 application/Auth closure remains a separate gate. This Phase 3 decision does not authorize Phase 5 by itself.

## Authoritative migration state

- Production and source control contain the same 18 migration versions.
- The previously missing Phase 21 migration is restored as `20260914180000_phase21_directory_postgrest_revoke.sql`.
- The remediation migration is aligned to the Production history as `20260925125131_phase3_phase4_security_remediation.sql`.
- A disposable local database rebuilt successfully from zero through all 18 migrations with exit code 0.
- Production contains all 18 migrations after the source merge and deployment.

## Implemented controls

### Function security

- All 21 `app` functions have an explicit empty `search_path`.
- No `app` function is executable by `PUBLIC` or `anon`.
- `authenticated` has exactly 10 explicit helper-function grants.
- The directory view and directory RPC remain revoked from PostgREST clients.
- Default function privileges revoke execution from `PUBLIC`.

### Identity and authorization

- Role and permission helpers require an active, non-deleted application identity.
- Suspended or deactivated identities lose database role and profile access.
- The members-only profile policy requires an active requester with a live profile.
- EXCO access is derived from server/database state, not client claims.
- Privileged Prisma operations remain behind application authorization guards; RLS is not treated as protection for a bypass-capable database role.

### Data boundaries

- Authenticated clients cannot directly insert businesses; the application transaction is the controlled creation boundary.
- Orphan-business insertion is denied by the executable RLS gate.
- Privileged profile, user, business and document columns remain trigger-protected.
- Anonymous access to private tables, storage objects, the directory view and the directory RPC is denied.

### Performance and policy remediation

- All nine foreign-key support indexes identified by the advisor are present.
- The recorded Auth/RLS initialization-plan findings are cleared.
- The recorded overlapping permissive-policy findings are cleared.
- Policies were consolidated without widening access.

## Verification evidence

| Gate | Result |
| --- | --- |
| Clean rebuild through 18 migrations | **PASS** |
| Phase 3/4 catalog assertion suite | **PASS** |
| RLS negative/runtime suite | **42/42 PASS** |
| Direct Supabase signup denial | **PASS** |
| Admin-created identity retained and defaults inactive | **PASS** |
| Existing-user OTP exchange | **PASS** |
| OTP replay denial | **PASS** |
| Distributed registration limiter | **PASS** — blocked attempt 9 |
| TypeScript type-check | **PASS** |
| ESLint | **PASS** — no errors |
| Prisma schema validation | **PASS** |
| Clean-checkout application tests | **224/224 PASS** |
| Full reconciled-workspace tests | **258/258 PASS** |
| Clean-checkout production build | **PASS** |
| Pull-request Vercel preview | **PASS** |
| Production Vercel deployment | **PASS** |
| Production health endpoint | **HTTP 200**, `databaseGate: PASS`, `rlsVerified: true` |

## Production post-merge audit

| Assertion | Result |
| --- | --- |
| Migration count | 18 |
| Mutable or unset `app` function paths | 0 |
| `PUBLIC` function execution grants | 0 |
| `anon` function execution grants | 0 |
| Explicit `authenticated` function grants | 10 |
| Required foreign-key indexes | 9/9 |
| Authenticated business INSERT policies | 0 |
| Tightened members-only profile policy | Present |
| Live application users without Auth identity | 0 |
| Auth identities without application user | 0 |
| Orphan profiles | 0 |
| Orphan businesses | 0 |

## Non-blocking observations

- Supabase still reports leaked-password protection as disabled. Enabling it was rejected by Supabase because the feature is not available on the current plan. This is an Auth/Phase 4 plan decision, not an unresolved Phase 3 database control.
- The performance advisor reports unused-index informational notices. Newly created or low-traffic indexes are expected to appear unused initially. No index should be removed without representative workload evidence.
- Eight historical application-user tombstones have no Auth identity; all are soft-deleted. There are zero live identity orphans.

## Lock rule

Any future change to migrations, RLS policies, database function ownership or grants, SECURITY DEFINER functions, privileged Prisma boundaries, Auth-to-application identity synchronization, or storage policies must rerun the migration rebuild, catalog assertions, RLS negative suite and Supabase advisors before this gate can remain locked.
