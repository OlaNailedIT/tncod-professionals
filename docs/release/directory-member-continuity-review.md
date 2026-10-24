# Directory member continuity — bounded finishing batch

23 October 2026. Owner approved only the two-item directory implementation and
review PR. No merge, release, Production data/configuration change or spending.
This is LC-B/E finishing work, not a new product phase or reopened historical audit.

## 24 October — local runtime gate completed

Application code tested: exact head `f16db14a2177c31a6cbc9610d7b52b89425f3571`.
No application change was needed in this continuation; this update is evidence only.
Local Docker/DB/Auth/Mailpit were healthy. Exact loopback targets: database 54322,
API 54321, mail catcher 54324. Database image matched the recorded installed image;
preferences, role catalogue and roster migration were checked before fixture writes.
No hosted configuration, Production credentials/data, external email, spending,
test-session cookie injection or `AUTH_E2E_HELPER` shortcut was used.

| Required boundary | Runtime evidence |
| --- | --- |
| Anonymous list/detail | Existing public shell; no own-status notice; restricted-field canaries excluded |
| Normal member / EXCO_VIEWER sessions | Actual sign-in form, local emailed code, server verification and Dashboard landing; no helper; role-appropriate member/EXCO navigation |
| Own listing state | Real Prisma reads: pending, verified/private, identity PRIVATE/MEMBERS, missing slug, missing-row PUBLIC default, published; no added completion/headshot prerequisite |
| Public equivalence | Same cards, totals, page and industry options across anonymous/member sessions; filtered-out own card and second-page results do not imply unpublished status |
| Isolation | Substituted user/profile query IDs do not select another person's notice; independent sessions have different correct own-state messages; another public detail has no own notice |
| Phone navigation | WebKit iPhone: directory drawer to Dashboard and public-detail drawer to Directory, retaining the real member session |
| Tablet navigation | Chromium iPad touch profile with a fresh normal sign-in: both drawer journeys pass; server session probe true before interaction |
| Inactive identity | Soft-deleted profile and suspended account cannot retain member/EXCO shell or private own-status notice |
| Helper boundary | Production-mode local `/api/test/auth-session` returns 404 |

Existing database privacy regression: **9 executed / 9 passed / 0 failed / 0
skipped**. It ran once; subsequent harness corrections reused that result because
the application was unchanged. The production-mode local optimized build also
passed once and was reused, without changing its loopback origin or application.
The prior 31/31 focused tests, typecheck and lint evidence below stands.

Runtime execution is a case ledger, not one retrospectively green run:

- `dir29-1792866937535-8fa585e9.json`: 53 completed runtime/safety assertions,
  including member/EXCO privacy/state cases and both phone journeys; the overall
  run FAILED when a tablet context using copied session state was redirected to
  sign-in. That failure is preserved, not counted as a tablet PASS.
- `dir29-1792867275379-ada7597d.json`: only the unfinished tablet/inactive/helper
  checks, with fresh normal sign-ins rather than copied state: **24 assertions
  passed / 0 failed / 0 skipped**. Required fresh-session tablet navigation passed.
  No claim that arbitrary cross-context session copying is supported or that its
  earlier rejection's refresh cause was conclusively diagnosed.
- Counts include repeated safety/notice assertions. Do not sum 53 + 24 into a
  distinct-test count. Prior failed setup attempts remain recorded: duplicate
  fictional phone, development-mode code-entry timeout, and a test expecting a
  directory redirect outside the existing safe-redirect allowlist. The normal
  application correctly lands on Dashboard; no Auth/redirect rule was changed.

Reports and synthetic-only phone/tablet screenshots are retained in the parent
execution workspace `operations/launch/`. Both screenshots were inspected; these
are emulation, not physical-device or ordinary-member pilot evidence. The local
runner is `verify-directory-runtime.mjs`; earlier attempts and the successful
focused follow-up are separately timestamped. No OTP, session cookie or key value
is retained in the reports.

Each attempt cleaned its exact fictional users/profiles/Auth identities and
captured local test emails, then stopped its own app server. Final readback:
zero fixture users/profiles; pre-existing users, profiles, visibility preferences,
professional details and role-assignment fingerprints unchanged. No real member,
Production resource, E: drive or retained backup was touched.

**Runtime gate: covered / ready for review.** Separate owner merge/release approval
and affected physical-device retest on the approved release are still required.
No merge, deployment, full-pilot PASS or public-launch GO is authorized here.

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

## Historical 23 October limitation and remaining release gates

At PR creation, local Docker engine was unavailable. A normal installed-app startup did not
produce a running engine; no reset, WSL repair or database fixture write followed.
No database-backed directory/authenticated-browser/physical-device execution is
claimed at that time. The 24 October runtime evidence above supersedes that blocker.
Static typechecking and mocked query-contract checks do
not replace a real Prisma/database/session run.

The separate approved recovery-format proof subsequently passed locally; it is
NOT part of this application PR. Its real-data/hosted-recovery limits remain.

Review can proceed on this diff; the bounded local database/session gate above
is complete, but merge/release approval is withheld. Obtain separate release
authorization and retest only affected
phone/tablet navigation on the approved released build. Do not rerun all phases.

Vercel previews intentionally have no Production database access. A green
build/Preview check alone is not a signed-in runtime PASS. No Production data,
preview-DB reattachment, live fixture or credential workaround is authorized.

Phase 23C/23D, pilot and public-launch approval remain open. No claim of a complete
visual refinement package, headshot workflow or full-platform recovery is made.
