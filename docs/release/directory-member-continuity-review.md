# Directory member continuity — bounded finishing batch

23 October 2026. Owner approved only the two-item directory implementation and
review PR. No merge, release, Production data/configuration change or spending.
This is LC-B/E finishing work, not a new product phase or reopened historical audit.

## Baseline and scope

Fresh GitHub main and fetched `origin/main`:
`9ed925cba1f5e1d2d821eadc18f11de14d4092a8`.
Started from the clean reviewed application checkout; new branch
`fix/directory-member-continuity` fast-forwarded to that exact main before edits.
Only open PR at preflight was documentation #24; no duplicate directory PR.

1. Reuse existing public/member shells on `/professionals` and
   `/professionals/[slug]`. Server-authenticated active readers retain member
   navigation; anonymous readers retain public navigation. Existing member shell
   still performs the existing server EXCO-access check.
2. On the directory list only, explain the current member's own listing state.
   No explanation of another person's private state on detail pages.

## Own-state boundary and copy

`loadDirectoryMemberContext` accepts no caller ID. Existing
`getAuthenticatedUser` remains the source of identity and centrally rejects
inactive/deleted identities. One additional read selects only the session owner's
verification, publication, public-slug presence and identity preference, with
active-user/nondeleted-profile predicates. It returns human-readable guidance,
not IDs, slug, contact data, notes, documents or the raw database row.

| State | Guidance / existing destination |
| --- | --- |
| Anonymous/inactive identity | No own-profile query or status notice; public shell |
| Profile unavailable | Cannot confirm status; open `/profile` |
| Not verified | Check review status/next steps on `/profile`; completion is not verification |
| Verified but not DIRECTORY | Separate EXCO publication required; privacy does not self-publish |
| Identity PRIVATE/MEMBERS | Public identity needed; review privacy and ask EXCO if setting locked |
| Missing/empty public slug | Public link not ready; ask EXCO, no implicit repair/publication |
| Published, verified, identity PUBLIC, slug present | Meets listing requirements; filters/pagination may hide it on this page |

Missing identity-preference rows use the existing locked PUBLIC default. Do not
add completion or headshot requirements to directory eligibility. No inference
from a single results page and no claim that all profile fields become public.

## Preserved boundaries

- Public `list.ts`, query parsing, projections, preference defaults, search/filter
  predicates, counts, facets, pagination and slug lookup are unchanged.
- List/facet/slug loaders receive exactly their previous arguments, never a member
  ID or privileged projection. Detail still returns not-found for unavailable IDs.
- Existing Auth/session/roles, EXCO gates, publication/verification mutations,
  schema, migrations, Storage, keys, environment and dependencies are unchanged.
- Both routes retain `force-dynamic`; own state has no cross-user shared cache.
- Existing design system/links/spacing/brand are reused. No new navigation system,
  redesign, photo/headshot upload or deferred feature is included.

## Verification

Focused unit/composition selection: **31 executed / 31 passed / 0 failed / 0
skipped** (six files). Includes 23 new tests plus existing query, member-entry and
active-identity regressions. Database and session outputs are test doubles; tests
assert the exact new read predicate/select and actual page query arguments.
Existing member/public shell components are rendered in shell tests; the page
composition test substitutes a synchronous member wrapper, not browser Auth.

Initial selected run: 30 passed / 1 failed because the new page-test router mock
omitted `useRouter`. Corrected that test-only mock; the same full selection then
passed. Initial sandbox process-start failure is not product evidence.

Typecheck: PASS. Changed-file lint: PASS, zero warnings.
Optimized build: PASS using fictional loopback-only database/Auth configuration,
not Production credentials. Both directory routes remain dynamic. Compiler emitted
two webpack cache-serialization performance warnings, not build errors. No skipped
test is converted into a PASS.

React review: server-only own-state loader, minimal serialized guidance, no new
hooks/effects/dependencies, existing semantic links/status notice, parallel
independent public queries and member-context lookup. No raw private profile is
passed to a client component.

## Explicit evidence limits and review/release gates

Local Docker engine is unavailable. A normal installed-app startup did not
produce a running engine; no reset, WSL repair or database fixture write followed.
No database-backed directory/authenticated-browser/physical-device execution is
claimed for this branch. Static typechecking and mocked query-contract checks do
not replace a real Prisma/database/session run.

The separate approved recovery-format proof is pending that same local
dependency; it is NOT part of this application PR. Existing recovery results stand.

Review can proceed on this diff, but merge/release approval is withheld. Before
release, use a proven disposable database and normal authenticated session to
check anonymous vs signed-in list/detail navigation, own-only notice, missing/
unpublished profiles, filtered/paginated results and unchanged private-field
exclusion. Then obtain separate release authorization and retest only affected
phone/tablet navigation on the approved released build. Do not rerun all phases.

Vercel previews intentionally have no Production database access. A green
build/Preview check alone is not a signed-in runtime PASS. No Production data,
preview-DB reattachment, live fixture or credential workaround is authorized.

Phase 23C/23D, pilot and public-launch approval remain open. No claim of a complete
visual refinement package, headshot workflow or full-platform recovery is made.
