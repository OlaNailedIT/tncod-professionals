# Gate 6B — Consolidated human action board

**Opened:** 2026-10-12  
**Updated:** 2026-10-18 (AUTH-A Stage C PASS/CLOSED; separately approved exact public-variable cleanup verified; no paid dependency)

**Current release:** PR #21 merged at `2026-10-18T14:00:36Z` as `ce2ebaaa8fa507b0669a7565b67bbadd6673aaeb`. Git-source Production `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK` is READY and the actual azure alias points to it. The exact owner-approved migration committed once; independent readback confirms Admin-only roster SELECT, RLS enabled and one history row. Eight read-only public/access checks passed; public Auth variables absent, private Auth row IDs/targets preserved. Real-interest acceptance is unproven because inventory contains no opportunities/interests. See `pr-21-production-release-2026-10-18.md`.

**Latest release evidence:** Stage C completed on unchanged READY artifact `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC`, CLI source clean `bcd113d`; actual alias/deployment identity reconfirmed. Explicitly approved legacy anon/service_role retirement and exact old publishable deletion verified; modern keys unchanged. Ten known/unknown denial requests returned 401, genuine pre-change session/refresh and fresh sign-in/desktop Member↔EXCO passed. Integration-associated public-variable drift was found, then separately approved exact cleanup passed three readbacks with all 20 other env rows unchanged. No deploy was created during that drift window; no spending, policy/JWT change, fixture, migration or role change. Initial navigation timeout, first failed drift gate and evidence limits are retained. Evidence: `docs/release/auth-a-stage-c-retirement.md` and its sanitized JSON. Stage B fixture evidence stands; do not repeat it.
**Gate 6A:** PASS — do not reopen without a new reproducible regression  
**Delivery frame:** Launch Completion stages **LC-A → LC-G** (not a replacement for historical phase contracts). Strategy: external Launch Completion Plan 2026-10-16.  
**AUTH-A:** **PRODUCTION CUTOVER PASS/CLOSED** on the recorded strict server-only baseline. Retired-key gateway denial, legitimate continuity/renewal, fresh sign-in and final key/configuration readback verified. This is the selected private-key mitigation, not an upstream GoTrue response fix. After any provider-key/integration resync, recheck public Auth variables before a build; no automatic key re-enable or old-build recovery. Other LC gates still withhold public-launch PASS. No paid fallback is authorized.

## Launch Completion overview

| Stage | Focus | Status (2026-10-18) |
| --- | --- | --- |
| **LC-A** Control the release | One accurate backlog + identities | **IN PROGRESS** — this board reconciliation |
| **LC-B** Finish existing delivery | #22/#23 signed-in acceptance; #21 release | **IN PROGRESS** — #21/#22/#23 released; #21 named migration verified. Desktop return already passed; remaining physical-device/CTA and genuine-interest acceptance open. Historical #22 auto-deploy omission unexplained |
| **LC-C** Trust and access | AUTH-A proof/decision; AUTH-B; named security residuals | **IN PROGRESS** — AUTH-A Production cutover PASS/CLOSED; AUTH-B awaiting human. Do not repeat Stage B/C |
| **LC-D** Operating promise | Guidance, verification policy, follow-up ownership, support, genuine content | **NOT READY** — actual aggregate inventory: 23 active profile records, 0 verified active profiles, 0 opportunities/interest. Not 23 confirmed participants. Owner/cohort operating inputs needed; see `launch-operating-readiness.md` |
| **LC-E** Acceptance | Devices, journeys, comprehension, pilot | **AWAITING HUMAN** — carry forward owner-reported checks; do not restart them |
| **LC-F** Privacy and operations | Privacy-L1, backup class/recovery, monitoring, operators | **AWAITING HUMAN** |
| **LC-G** Freeze and launch | Frozen candidate + GO/NO-GO | **NOT STARTED** — 23 Oct target contingent on remaining LC gates, not completed AUTH-A |

**Critical path to 23 October:** AUTH-A Production cutover and exact #21 release closed 18 Oct, ahead of the **19 Oct** readiness checkpoint. Do not rerun Stage B/C, replay the migration or repeat the already-passing desktop return journey. Focus remaining work on AUTH-B, Privacy-L1, actual free-tier data/object recovery, operator/cadence/content ownership, physical-device/comprehension/pilot acceptance and Preview database isolation. No date or pilot exception overrides these public-launch gates.

**Live identity:**

| Fact | Value |
| --- | --- |
| `origin/main` | `ce2ebaaa8fa507b0669a7565b67bbadd6673aaeb` (PR #21 merge) |
| Ready Production (Vercel / azure) | `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK` · source git; Git source/commit metadata match main; actual azure alias pointer verified |
| Modern strict application recovery baseline | `dpl_BxLFz9gBDNvE1uTqN7Avpd9eMHRC` · reviewed `bcd113d`, matching private configuration; keep tighter roster policy/history on app rollback |
| Prior Ready Production (superseded) | `dpl_E4iNVkhfeViyz3HEuTtHzwiUJoef` · sha `bcd113d`, Stage A legacy-compatible config; NOT strict post-retirement recovery |
| Azure origin | `https://tncod-professionals-azure.vercel.app` · current alias confirmed in deployment metadata; public smoke 4 routes 200, dashboard/EXCO 307 to sign-in |
| PR #22 | **MERGED / RELEASED** · head `b80bc5d`, merge `1a69915`, included in current modern baseline · https://github.com/OlaNailedIT/tncod-professionals/pull/22 — desktop return verified Stage B/C; physical phone/tablet checks remain. Historical auto-deploy omission remains unexplained; do not select its superseded recovery artifact |
| PR #21 | **MERGED / RELEASED** · approved head `267fd3012b06c489b298581da0a59b1a9b59466c`, merge `ce2ebaa` · fresh checks PASS; exact named migration committed and independently read back · https://github.com/OlaNailedIT/tncod-professionals/pull/21 — 34 local tests passed, 0 failed/skipped; typecheck/lint/build PASS. Real-content acceptance separate; see `pr-21-production-release-2026-10-18.md` |
| PR #23 | **MERGED / RELEASED** · head `7f517fb`, merge `52f3d8c` · CI/preview PASS · https://github.com/OlaNailedIT/tncod-professionals/pull/23 — `docs/release/pr-23-review.md`; signed-in acceptance pending |
| PR #25 | **MERGED / STAGES A–C COMPLETE** · head `ab9080b`, merge `bcd113d` · https://github.com/OlaNailedIT/tncod-professionals/pull/25 — AUTH-A Production cutover PASS/CLOSED. Evidence: `docs/release/auth-a-stage-c-retirement.md` |
| Phase 23C | **NOT LOCKED** |
| Public launch | **WITHHELD** — remaining AUTH-B, privacy, recovery, operations and human acceptance gates; AUTH-A closed |

Status vocabulary: `NOT STARTED` · `AWAITING HUMAN` · `AUTHORIZED` · `IN PROGRESS` · `PASS` · `FAIL` · `BLOCKED`

Update this board only from real owner/legal/tester evidence — never from automation alone.  
Do **not** fabricate devices, participants, legal sign-off, reclaim evidence, or pilot PASS.  
Carry forward completed owner-reported checks; missing device/browser metadata is a small evidence note, not a reason to restart PASS rows.

---

## Status roll-up

| ID | Action | Status |
| --- | --- | --- |
| A | AUTH-B owner confirmations (COLLISION-01…08) | **AWAITING HUMAN** (LC-C) |
| B | Privacy Notice legal/privacy sign-off | **AWAITING HUMAN** (LC-F) |
| C | Free-tier protected data/object recovery | **AWAITING HUMAN** — Free plan identified; no paid backup/PITR dependency. Protected destination/key custody, cadence and export/drill approval pending. Plan: `docs/operations/free-tier-recovery-plan.md`; historical schema-only drill PASS (LC-F) |
| D | Phase 23C real-device acceptance | **AWAITING HUMAN** — **NOT LOCKED**. Owner-reported phone/tablet navigation + join/sign-in/dashboard + profile/privacy save **carry forward**; device/browser models **not recorded**. Remaining packet rows stay open (LC-E) |
| E | Phase 23D participant comprehension | **AWAITING HUMAN** — dashboard clarity in **#23** is released. Full comprehension still needs real participants (LC-E) |
| F | Controlled-pilot closeout | **AWAITING HUMAN** (LC-E) |
| G | EXCO surface / Member↔EXCO return | **PARTIAL ACCEPTANCE** — actual signed-in desktop Member↔EXCO↔Member passed on current Stage B azure release; physical phone/tablet checks remain. Checklist: `docs/release/pr-22-signed-in-acceptance.md` (LC-B). Historical auto-deploy reliability finding remains **OPEN** |
| H | Current interest roster | **RELEASED / REAL-CONTENT ACCEPTANCE OPEN** — exact owner-approved transaction/migration verified, #21 merged as `ce2ebaa`, matching Git-linked Production READY. No synthetic content. Cadence **NOT ACCEPTED**; real-interest acceptance needs genuine content. Evidence: `docs/release/pr-21-production-release-2026-10-18.md` (LC-B/D) |
| J | Dashboard clarity (#23) | **RELEASED** under separate #23-only owner approval; signed-in CTA acceptance pending. No hard dependency on #21. Evidence: `docs/release/pr-23-review.md` (LC-B). Do **not** re-implement |
| K | AUTH-A release preparation | **PASS/CLOSED** — exact Stage C retirement, genuine prior-session refresh/fresh sign-in and final readback verified; integration public-variable drift separately approved for exact cleanup and resolved. Recorded strict artifact/private config remains recovery baseline. Future provider/integration changes require a public-variable pre-build guard. Evidence: `docs/release/auth-a-stage-c-retirement.md` (LC-C) |
| N | Preview database credential segregation | **PROSPECTIVE SCOPE FIX VERIFIED / RETAINED PREVIEWS OPEN** — owner-approved Preview-target-only removal from exact DATABASE_URL row; Production and 19 unrelated rows unchanged, no deployment/spending. Existing deployments can retain old configuration; containment/other bindings require separate review. No actual leak claimed; no mutating Preview tests. See `preview-database-scope-2026-10-18.md` (LC-F) |
| L | Git→Vercel Production auto-deploy | **OPEN** — merge `1a69915` produced no automatic Production deployment; recovered via authorized CLI. Targeted diagnosis continues; does not block #22 signed-in acceptance |
| M | Free hosting plan / permitted-use fit | **PLAN VERIFIED** — existing Vercel project is active Hobby; no purchase/upgrade. Exact nonprofit professional/service-directory fit needs provider clarification before unrestricted launch, not an assumed violation or paid dependency. Current usage headroom not measured. See `docs/release/hosting-free-plan-check.md` (LC-F) |
| I | Optional headshot | **DEFERRED** post-launch / proposal only — not a launch dependency |
| O | Real launch content and operating ownership | **NOT READY** — aggregate Production readback: 0 verified active profiles, 0 opportunities. No bulk approval/fake listings. Use existing verification/publication/create workflows with real willing members and named operators; see `launch-operating-readiness.md` (LC-D) |

---

## A. AUTH-B — collisions (no mutation without UUID authorisation)

**Packet:** `docs/release/auth-b-collision-confirmation-packet.md`  
**Procedure:** `docs/security/phase-4-identifier-reclaim.md`  
**Reclaims this gate:** **0** (no UUID-level authorisation present)

| Label | userId | Eligibility | Approval required |
| --- | --- | --- | --- |
| COLLISION-01 | `7df3c2b4-bdb9-4773-b081-0c10d8fd9fdc` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-01` + this UUID |
| COLLISION-02 | `90b737ad-b92c-4e1a-a3d0-96126c32b7b0` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-02` + this UUID |
| COLLISION-03 | `c2cfe0b3-6ae6-4194-9264-e008a3faa8ac` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-03` + this UUID |
| COLLISION-04 | `6b21f037-ee98-41de-af20-61f71bc6ea2e` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-04` + this UUID |
| COLLISION-05 | `5e3b47ab-cbd3-4b79-8dee-d7d717f00098` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-05` + this UUID |
| COLLISION-06 | `6ceef204-fc19-4e83-8dcb-973ad869da36` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-06` + this UUID |
| COLLISION-07 | `efb97eeb-387a-4bb9-8d3b-9a5f013033be` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-07` + this UUID |
| COLLISION-08 | `8bedfed5-bd7b-43f3-b5f6-3d8435c91542` | reclaim_candidate · Auth absent | Exact `AUTHORIZE RECLAIM COLLISION-08` + this UUID |

Already resolved (do **not** reclaim again): RESOLVED-01 `df709e23-…`, RESOLVED-02 `54d01a92-…`.

**Owner reply (one UUID at a time):**

```text
AUTHORIZE RECLAIM COLLISION-0N
userId: <uuid>
I confirm this soft-deleted Auth-absent identity may release email/phone under the Phase 4 reclaim procedure.
```

---

## B. Privacy-L1 — legal sign-off

**Review location (live):** https://tncod-professionals-azure.vercel.app/privacy  
**Candidate / source of truth for wording:** `docs/legal/privacy-notice-candidate.md`  
**Sign-off packet:** `docs/release/privacy-l1-legal-signoff-packet.md`  
**Engineering claim:** factual notice is **deployed** (HTTP 200; join / sign-in / footer link to `/privacy`).  
**Legal claim:** **PENDING** — do not treat as signed-off.

Owner update 2026-10-18: “use this mailto:cityofdavidprofessionals@gmail.com”.
This confirms the requested contact address, already linked by the current privacy
page. It does not confirm legal operator/country, monitoring or legal sign-off.

**Approval options (reply with exactly one):**

```text
LEGAL SIGN-OFF: APPROVED AS WRITTEN
```

```text
LEGAL SIGN-OFF: APPROVED WITH CHANGES
```

(then paste exact replacement wording per section)

```text
LEGAL SIGN-OFF: NOT APPROVED
```

**Outstanding legal questions (not asserted in public text):** controller identity/address · legal bases · retention schedules · international transfer wording · cookie/tracking table · change-notification wording.

---

## C. Backup / restore distinction (ops)

| Proven by engineering | Still human |
| --- | --- |
| Schema-only `pg_dump` → disposable local restore (**32** tables) — `docs/operations/backup-restore-drill-6b.md` | Supabase Dashboard backup **class** / PITR fields — `docs/release/ops-backup-class-owner-check.md` |
| Incident + rollback **procedures** actionable — `docs/operations/incident-rollback.md` + closeout | Protected **production-data** recovery drill (restore-to-new-project with real backup) — **not** proven |
| Monitoring checklist — `docs/operations/monitoring.md` | External paging optional |

**Do not** equate schema-restore PASS with production-data disaster recovery PASS.

---

## Navigation defects (automation, not Phase 23C lock)

**DEF-23C-01 — released; owner-reported phone navigation PASS carried forward.** The phone menu closed and the page stayed put because `NavLink` rendered a button whenever `onNavigate` was set. The fix keeps link mode as a real link. Historical automated evidence on `19b214a` remains; the earlier local Professionals heading failure caused by unavailable Postgres is not erased. The owner subsequently reported navigation working. Exact physical model/browser/date were not confirmed; do not request another passing navigation retest merely to fill that metadata.

**DEF-23C-02 — artificial-profile test corrected; owner-reported tablet/landscape navigation PASS carried forward.** Header Sign in stayed on `/` under a resized iPhone profile on main and preview. No header code change. Native-profile automated checks passed on `19b214a`; the owner subsequently reported all three destinations working. Exact device/browser/date and a measured latency were not supplied. Do not invent them or rerun passing rows. Phase 23C stays **NOT LOCKED** for its other remaining criteria.

Click versus `locator.tap()` on the same Sign in anchor, from `/`, expecting `/sign-in`:

| Profile | click | tap |
| --- | --- | --- |
| Native iPad Pro 11 | Starts a non-prefetch navigation RSC. In the Join sequence the URL was still `/` at 8s, then the in-flight navigation to `/join` interrupted the next `goto`. A separate Sign in click committed to `/sign-in` in under 1.5s, as did keyboard Enter. | Same late non-prefetch navigation as click. |
| iPhone landscape context at 844×390 | Same: navigation RSC starts; the URL is still `/` inside 8s; the commit then interrupts the next load. | Same, with the navigation RSC about 5s after tap. |
| iPhone 12 Pro resized with `setViewportSize` to 834×1194 (scale 3) | Click can return with only prefetch requests and no navigation. This was the original failing test. It is not a tablet tap. | `tap()` timed out in scroll-into-view and did not navigate. |

The `/sign-in?_rsc=` request after the interaction is a click-triggered navigation (`next-router-prefetch` absent, distinct `_rsc` from the viewport prefetch of Professionals, Join, and Sign in). A 200 on that request is not a completed navigation: history did not `pushState` until later, and the heading stayed “TNCOD Professionals” through the assertion window. Viewport prefetches are the separate `next-router-prefetch: 1` requests.

Preview matrix before release (application code identical to `bcc42d1`; the later commit changed tests and this board only): **20 passed, 22 skipped, 0 failed**. Skips were phone-drawer tests on header projects, header tests on phone projects, and the design-system specimen on header projects. Production matrix on the azure origin after `19b214a`: **18 passed, 24 skipped, 0 failed**. The extra two skips are the design-system specimen, which is 404 in Production. Every required Professionals, Join, and Sign in case ran.

**Historical instruction below — already followed by owner-reported navigation PASS.** Emulator timing did not prove physical latency. Preserve this diagnostic procedure, but do not treat it as a new pending retest or a reason to restart passing rows.

```text
DEF-23C-02 physical retest — Production release 19b214a is ready. Use the azure origin, not a preview.

Device: a real iPad, portrait, Safari or Chrome. Then the same iPhone in landscape.
Open https://tncod-professionals-azure.vercel.app/
Do not open the menu. Professionals, Join, and Sign in must be visible in the header.
Tap Sign in once.

PASS: the address ends in /sign-in, the heading is "Sign in", and an Email address field is visible.
FAIL: the address stays on the home page, or the heading stays "TNCOD Professionals".

Write the result in your own words. One tap. Do not tap again to turn a failure into a pass.
```

DEF-23C-01's subsequent owner-reported navigation PASS carries forward. The specific proposed device label above was not confirmed as the device actually used.

## D. Phase 23C — device acceptance

**Packet (fill this):** `docs/release/phase-23c-human-acceptance-packet.md`  
**Devices required:** real phone **and** tablet/iPad-class (not desktop emulation).  
**Origin:** https://tncod-professionals-azure.vercel.app  

How to record: mark each task **PASS** or **FAIL**; if FAIL add severity S0–S3, short note, and optional screenshot path. Full step list and scoring rules are in the packet.

---

## E. Phase 23D — comprehension

**Packet (fill this):** `docs/release/phase-23d-comprehension-packet.md`  
**Participants:** real controlled-pilot cohort members (non-PII labels only).  
Facilitator records verbatim understanding vs the “understanding looks like” column. Do not coach mid-task. Do not fabricate participants.

**Implemented portion (released in #23; participant acceptance still pending):** member **dashboard clarity** — human status labels via `present*`, one state-derived next-step (`resolveMemberNextAction` with PENDING ≠ UNDER_REVIEW), `PageIntro`, secondary links to existing `/opportunities` · `/profile` · `/settings/privacy`. Not the full Phase 23D surface set. Full acceptance remains **AWAITING HUMAN**.

---

## Controlled pilot readiness matrix

| Requirement | For **limited controlled pilot** | For **unrestricted / public launch** |
| --- | --- | --- |
| Gate 4–6A technical closeouts | Required (already **PASS**) | Required |
| AUTH-A provider E-API exposure | **PASS/CLOSED** for current recorded private-key baseline | **PASS/CLOSED** via approved Stage C; maintain public-variable/pre-build guard, not an upstream fix |
| AUTH-B reclaim confirmations | Prefer resolve before wide cohort; not every collision blocks a tiny invited pilot | **Required** before unrestricted launch |
| PRIVACY-L1 legal sign-off | Strongly preferred; factual notice already live | **Required** |
| Free-tier recovery arrangement | Protected destination/custody strongly preferred | Required; no paid backup/PITR dependency |
| Protected data-plus-objects restore drill | Not required to *start* limited pilot | Required before claiming launch recovery readiness |
| Phase 23C phone + tablet | **Required** before claiming UX-ready pilot surfaces | **Required** |
| Phase 23D comprehension | **Required** for pilot closeout quality | **Required** |
| Pilot closeout packet | Required to close Phase 23 pilot | N/A (separate unrestricted gate) |
| Phase 24+ features | Not authorised | Not authorised |

**Pilot activation:** AUTH-A now passes on the recorded private-key baseline; its prior limited-cohort exception is not needed for that resolved exposure. Preserve other existing pilot conditions and schedule 23C/23D with real humans; this is not an unrestricted-launch GO.
**Pilot closeout PASS** still needs filled 23C + 23D + `docs/release/pilot-closeout-packet.md`.  
**Unrestricted launch PASS:** withheld for remaining AUTH-B, privacy, recovery, operations and human acceptance gates; AUTH-A is closed.

---

---

## Owner-reported device results (2026-10-16)

These are the project owner’s reports from this conversation. Device model and browser were not stated, so they are not filled in. This does not lock Phase 23C.

| Check | Phone | Tablet |
| --- | --- | --- |
| Portrait menu: Professionals, Join, Sign in | **PASS** (owner-reported) | not reported in this set |
| Landscape header: Professionals, Join, Sign in | **PASS** (owner-reported) | not reported |
| Portrait header: Professionals, Join, Sign in | not reported | **PASS** (owner-reported) |
| Join, email sign-in, and dashboard | **PASS** (owner-reported) | **PASS** (owner-reported) |
| Profile overview, edit/save persistence, privacy/save persistence | **PASS** (owner-reported) | **PASS** (owner-reported) |

Still open on the 23C packet: home scroll, verification presentation, directory eligibility, directory detail, businesses, opportunities, EXCO surfaces, accessibility/errors, privacy notice, and Production `/design-system` 404. Phase 23D and pilot closeout stay open.

## EXCO discoverability and opportunities

PR #20 is merged as `71b5570aaf5b1dd950001662f8bf16e3a0d5fde3` and the Git-linked Production deployment `7115716634` is success. Azure serves page chunk `app/page-2194e43327d5ea22.js`.

`/exco` still redirects members without EXCO_VIEWER, EXCO_ADMIN, or SUPER_ADMIN to `/dashboard`, and anonymous users to sign-in. The member shell now asks `hasExcoDashboardAccess` before showing EXCO in the desktop sidebar, the phone/tablet drawer, and the account menu. Dashboard, Directory, Profile, Businesses, Opportunities, and Settings stay in member navigation.

EXCO navigation includes the existing `/opportunities` page. Creating an opportunity still requires `opportunity.manage`.

**Signed-in acceptance:** desktop Member↔EXCO passed in Stage B/C. Remaining phone/tablet EXCO surfaces/return and real opportunity acceptance remain open. Do not restart the desktop sign-in test.

**Interest roster:** PR #21 is merged and on Git-linked Production; named migration verified. The operator procedure names the project owner, but proposed weekly/before-close review cadence is **not accepted**. Real-content/interest acceptance remains open; inventory currently has no opportunities or interests.

**Optional headshot:** proposal only, in `docs/product/optional-headshot-proposal.md`. Not implemented.

## Priority order for the project owner (now)

1. **Operating inputs** — name actual verification/publication/opportunity/follow-up operators; use genuine willing-member content through existing workflows. Complete remaining phone/tablet EXCO acceptance, not a duplicate desktop sign-in test.
2. **Finish Phase 23C** rows that are not in the owner-reported table above. Phase 23C stays **NOT LOCKED**.
3. **Execute Phase 23D** with real participants.
4. **Privacy-L1** — choose one of the three legal reply lines after reviewing `/privacy`.
5. **AUTH-B** — authorise or explicitly defer each COLLISION-0N UUID (no bulk reclaim).
6. **Free-tier recovery** — accept protected destination/key custody and operator/cadence, authorize the protected export/isolated data-plus-objects drill; no paid backup/PITR requirement.
7. **Pilot closeout** — complete `pilot-closeout-packet.md` only after real cohort evidence exists.

**AUTH-A disposition:** the separately authorized Stage C private-key/deactivated-legacy cutover is PASS/CLOSED on actual Production evidence. Upstream [supabase/auth#1547](https://github.com/supabase/auth/issues/1547) remains an upstream behavior issue; this mitigation does not claim to fix it. Future integration/key resync must not restore public Auth variables before a build. See `auth-a-stage-c-retirement.md`.

**Next bounded actions:** finish remaining AUTH-B/Privacy-L1/free-tier recovery and operating inputs. Separately approved Preview-target-only DATABASE_URL removal is verified; retained Preview containment/other bindings remain a separate review, not authority to delete deployments or rotate credentials. Do not request another generic sign-in/desktop EXCO retest, replay #21's migration or rerun Stage B/C.
