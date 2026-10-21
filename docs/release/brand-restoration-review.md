# Approved brand-only restoration — review packet

21 October 2026 (implementation began 20 October). Owner approved implementation
and a reviewable PR only. **No
merge or Production deployment is authorized by this packet.**

Clean branch `fix/restore-professionals-brand` starts at freshly confirmed main
`0244b6f12cb38f0b2b782fef01e3cde2606a9caa` (released PR #27). Parked recovery,
documentation and historical dirty application changes were not copied wholesale.

## Scope and source integrity

- Later locked Phase 23B governs: owner-supplied Professionals JPG, not Phase 23A's
  superseded pathways SVG. `public/brand/professionals-mark.jpg` and `src/app/icon.jpg`
  are exactly the approved 5940-byte asset, SHA256
  `eaded3ebaa8dcff17ce00df0227bda3cd32183b92a729161742962dc52324b05`.
  No recolouring, redrawing, crop or square stretching; original 204:192 ratio.
- Shared pure Professionals mark/lockup in the three existing shell logo slots.
  Compact EXCO slot allows 160px for legibility. Existing mobile workspace titles,
  menus, controls and breakpoints remain unchanged; no new mobile navigation layout.
- Parent church image remains unchanged for attribution. Its metadata now declares
  its actual 194×148 dimensions rather than the old incorrect 640×240 dimensions.
  `BrandLogo` remains a compatibility alias for existing laboratory specimens.
- Homepage duplicate parent hero image removed. All current homepage copy/CTAs,
  metadata and PR #27's one-time-code instruction are retained. Modest parent
  attribution added to the existing public footer; privacy link/caveat retained.
- Only three colour values changed: background `#FAF9F6`, muted surface `#F3F0EA`,
  subtle surface `#EBE7DF`. Navy/sky/gold/white, Inter, status, text, border, input
  and focus values remain untouched. No new theme implementation.
- Public/member/EXCO home destinations, link/button mode and callbacks, EXCO access
  entry, member return, drawers, current gutters and server authorization preserved.

No photos/SVG, historical theme/Auth wiring, directory shell/query, profile editing,
completion, verification/publication logic, RLS, migrations, keys, roles, private
configuration, package/lockfile or CI workflow changes. No headshot feature or spend.

## Verification

Local checks use sanitized process settings and loopback placeholders only,
never Production.
Unit selection matches CI's non-database exclusions. Windows child PowerShell
discovers its own module path, carrying forward the previously diagnosed harness fix.

Browser configuration runs the optimized local build, not a reused dev server:
eight Chromium widths 320/375/390/430/768/834/1024/1280; separate native WebKit phone
profile; desktop Member/EXCO button-mode laboratory checks; and PR #27's existing
21 regression cases. Each required case executes rather than becoming a skip.

Checks cover official mark bytes/dimensions/visible ratio, icon metadata/bytes,
human/decorative accessible names, no parent image in primary chrome, parent footer,
no hero duplicate, warm background, gutters/overflow, actual menu/header destinations,
keyboard home link and original showcase logo callbacks. Screenshots are local-only
under ignored test outputs; no private account/session fixture is used.

The first unit run had 365 passes and one new assertion failure: Next/Image adds
its automatic `color:transparent` style before the explicit size styles. The test
was corrected to assert height and automatic width independently, retaining both
checks. Application code was not changed to satisfy it. The original report is
preserved outside Git alongside subsequent reports.

Final local results:

| Check | Result |
| --- | --- |
| CI-equivalent non-database unit selection, 67 files | 366 passed, 0 failed, 0 skipped |
| Optimized-build browser matrix, retries disabled | 41 passed, 0 failed, 0 skipped |
| Typecheck, changed-file lint (zero warnings), optimized Next build | PASS |
| Diff whitespace; approved mark/icon SHA256; unchanged parent-image SHA256 | PASS |
| Screenshot inspection: 320px and 1280px home | No clipped chrome, stretched mark, duplicate hero image or footer overflow observed |

Browser cases include 18 brand/public-navigation cases, two desktop showcase
callback cases and the 21 existing PR #27 cases. Do not describe the latter
showcases as authenticated product journeys. No database suites were required
for this presentation-only change.

The initial browser run remains recorded: 31 passed, 10 failed, 0 skipped.
Nine failures were an ambiguous new selector matching both the wordmark and the
directory link; it now scopes the wordmark inside the named home link. The tenth
was native WebKit Sign in exceeding the default five-second URL assertion.
Its trace shows a non-prefetch navigation request returning 200 before the URL
committed. A bounded comparison against the optimized released-tree baseline
(same source tree as `0244b6f`) produced successful single taps in all four cases:
baseline 9713/7801ms; brand 2826/898ms. Each required the Sign in heading and a
closed drawer. This supports an existing local emulation timing issue, not an
introduced brand regression; it is not a public performance benchmark or physical
device acceptance. Touch cases now use native tap and a 20-second bounded URL
wait, while desktop cases retain click/keyboard and the five-second wait. URL
and unique content assertions remain mandatory; no retry or skip hides a miss.

Sanitized original/final reports, matched-probe timing and screenshots are in
the parent execution workspace under `operations/launch/brand-restoration/`
and the ignored `test-results/` directory. No session/member evidence is included.
Remote head/check identities must be read back after PR creation; local PASS is
not a claim that remote CI has completed.

React quality checklist: existing components and typography; no new hooks,
effects, providers, requests or runtime dependencies. Native named home links and
buttons preserved; artwork inside labelled links is decorative to avoid repeated
accessible names. Source artwork is served unchanged as a tiny unoptimized JPG.

## Acceptance and stop boundary

Emulated public browser tests and desktop laboratory callbacks are not physical
phone/tablet or authenticated member/EXCO Production acceptance. Existing completed
checks remain valid within scope; only affected acceptance rows need follow-up
after a separately approved release. Do not call Phase 23C/23D or public launch PASS.

AUTH-A is closed and not reopened. PR #21 migration is not replayed. Combined
recovery, AUTH-B, Privacy-L1, genuine content/operating/cohort evidence and final
launch decision remain separate. Photo provenance review is deferred from this PR.
