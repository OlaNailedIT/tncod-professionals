# Four approved launch corrections — review packet

20 October 2026. **Local verification passed; release not authorized by this PR.**

Owner approved only the four-item finishing batch. Clean worktree/branch
`fix/launch-four-corrections` starts at main
`9b3d37dda4acccad4022c573f4623e9747bc138b`; remote main was reconfirmed unchanged
before publication. Parked recovery/documentation work was not copied into it.

## Exact delivery

1. Standalone shared Containers now apply responsive gutters (phone minimum 20px,
   consistent with later Phase 23C). Containers inside an existing frame/container
   do not add gutters twice; full-width containers remain edge-to-edge. No brand,
   typography, form schema or validation changes.
2. Home explains one-time email codes rather than an email sign-in link. Actual
   authentication, callback/recovery wording and provider configuration are untouched.
3. Profile overview reuses existing independent status labels/intents and replaces
   engineering jargon with usable guidance. The complete-profile submission panel
   uses the human verification label too. No completion calculation, status writes,
   submission eligibility, verification or publication behavior changes. Headshot
   uploads remain unavailable and excluded from completion.
4. Product EXCO desktop logo is a real `/exco` link, including when a callback is
   supplied. Showcase button mode retains its callback. Member return links and
   all existing role/route checks are unchanged.

No branding assets, directory shell/query/privacy changes, authentication, keys,
roles, database, migration, dependency or workflow changes. No merge, Production
deployment, member-data mutation, account action or spending.

## Verification completed locally

| Check | Executed | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: | ---: |
| CI-equivalent unit/domain selection (66 files) | 356 | 356 | 0 | 0 |
| Focused Chromium browser suite | 21 | 21 | 0 | 0 |

The earlier focused 64-test unit selection is included in the full run, not
additional coverage. Full unit selection excludes existing database integration
and boundary suites, matching CI; none was needed for presentation-only changes.
The 21 new unit cases cover profile labels/guidance and EXCO logo modes.

Typecheck, changed-file lint (zero warnings), optimized Next build and whitespace
check passed. Existing dependencies were reused locally; Next/React/Vitest/
Playwright/TypeScript/Prisma versions match the committed lockfile. No install or
dependency update. Build also ran its standard lint/type validation.

Browser suite: home/Join/Sign in at 320, 834 and 1280px; heading and control gutters,
zero horizontal overflow, real Join/Sign in destinations, keyboard home-link focus
and navigation, frame/nested/full-width spacing. EXCO showcase callback checks use
an explicit desktop viewport on each project; these are not three physical-device
claims. Product wrapper unit tests verify the real `/exco` anchor and member return.

Nine optimized-build screenshots were separately captured and the phone Join and
desktop home inspected. All nine anonymous loads returned 200 with zero overflow;
phone headings start at 20px. Local CAPTCHA configuration is deliberately absent
and remote requests/form submissions are blocked: the visible local security
unavailable message is not a Production registration result.

## Failed attempts preserved, not hidden

- Initial sandboxed compiler could not read the worktree; permitted native test
  execution then reached the tests.
- Two new logo assertions initially assumed HTML attribute order; corrected to
  assert the same anchor's href and accessible name independently. Product code
  did not change to satisfy that correction.
- Initial full unit run: 354 passed / 2 failed / 0 skipped. Existing Windows ACL
  tests could not load a built-in module because the local child process inherited
  the parent PowerShell module path. Removing that inherited path only in the
  local runner made all four ACL tests pass; the entire selection then passed
  356/356. No ACL application/test logic or real backup permissions were changed.

## Reproduction and review boundaries

Use existing dependencies, a clean local-only environment, loopback placeholders
and no Production credentials. On Windows, let child Windows PowerShell discover
its own module path rather than inheriting PowerShell 7's path.

- Unit selection: same `vitest run` exclusions as `.github/workflows/ci.yml`.
- Browser: `npx playwright test --config playwright.launch-corrections.config.ts`.
  Configuration starts a fresh local dev server on `127.0.0.1:3116`; no reused server.
- Standard typecheck, changed-file lint and build.

React quality review: no new hooks, effects, fetches, providers or dependency;
existing status helpers reused; accessible named real link in product mode;
focus styles and native button semantics preserved. No authorization check moved
into presentation code.

Local-only JSON/screenshots are under `operations/launch/` in the parent execution
workspace, not committed. This packet records the results; remote CI/check status
must be read from the actual PR head, not inferred from these local runs.

Fresh signed-in EXCO logo/profile acceptance and physical-device acceptance remain
release gates. No claim of authenticated E2E, CAPTCHA/registration, database/RLS or
complete Phase 23C/23D acceptance from this suite. Preserve unaffected earlier PASS.
Branding and directory continuity require their own bounded approval. Combined
recovery, AUTH-B, Privacy-L1 and genuine-member/pilot gates remain open; this PR
does not grant public-launch PASS.
