# Gate 6B — Consolidated human action board

**Opened:** 2026-10-12  
**Updated:** 2026-10-17 (AUTH-A local browser gaps passed; staged release proposal prepared; Free-tier recovery plan, no paid dependency)
**Gate 6A:** PASS — do not reopen without a new reproducible regression  
**Delivery frame:** Launch Completion stages **LC-A → LC-G** (not a replacement for historical phase contracts). Strategy: external Launch Completion Plan 2026-10-16.  
**AUTH-A:** **unrestricted launch still blocked / Production remediation unproven**. Free hosted provider and actual local build/browser/Storage/account-control evidence is passing, including the formerly missing numerical-code, session-renewal and signed-document HTTP checks. Candidate remains draft; actual deployed consumer inventory, compatible recovery deployment and exact release/key-change approvals remain open. See `docs/release/auth-a-hosted-proof.md`. Production cutover **not** approved. Pilot exception ≠ public-launch acceptance. No paid fallback is authorized.

## Launch Completion overview

| Stage | Focus | Status (2026-10-16) |
| --- | --- | --- |
| **LC-A** Control the release | One accurate backlog + identities | **IN PROGRESS** — this board reconciliation |
| **LC-B** Finish existing delivery | #22 Production + acceptance; #21 release; #23 review/release | **IN PROGRESS** — #22 Production **recovered**; signed-in acceptance pending; auto-deploy trigger **OPEN** (unexplained); #21/#23 open |
| **LC-C** Trust and access | AUTH-A proof/decision; AUTH-B; named security residuals | **IN PROGRESS** — AUTH-A non-Production core acceptance passed; staged deployment/recovery/consumer verification and exact approvals still required. AUTH-B awaiting human |
| **LC-D** Operating promise | Guidance, verification policy, follow-up ownership, support, genuine content | **NOT STARTED** as a gate (dashboard clarity is only a partial LC-D input via #23) |
| **LC-E** Acceptance | Devices, journeys, comprehension, pilot | **AWAITING HUMAN** — carry forward owner-reported checks; do not restart them |
| **LC-F** Privacy and operations | Privacy-L1, backup class/recovery, monitoring, operators | **AWAITING HUMAN** |
| **LC-G** Freeze and launch | Frozen candidate + GO/NO-GO | **NOT STARTED** — 23 Oct target contingent on AUTH-A |

**Critical path to 23 October:** AUTH-A non-Production core proof is achieved; next is reviewed staged Production preparation/recovery, consumer verification and explicitly approved key deactivation. Keep the **19 Oct** readiness decision. #22 recovery is recorded; signed-in acceptance remains human. If AUTH-A remains unresolved at that checkpoint, reassess the public-launch date; controlled pilot may continue only under its existing exception.

**Live identity:**

| Fact | Value |
| --- | --- |
| `origin/main` | `1a699153cb6259628c9dc1372051aec5f1bf4b04` (PR #22 merge) |
| Ready Production (Vercel / azure) | `dpl_DTe6dmsQ51fckqdYPtQmhZZEzJRX` · deployment URL `…-9g33jg1dl-…` · **aliased to azure** (LC-B recovery 2026-10-16). Application tree = reviewed `b80bc5d` |
| Prior Ready Production (superseded) | `dpl_BdtPVaT…` / GitHub `7115716634` · sha `71b5570` (PR #20) |
| Azure origin | `https://tncod-professionals-azure.vercel.app` · homepage chunk `app/page-0853a8d8daaf56e6.js` · “Member dashboard” **present** in deployed JS |
| PR #22 | **MERGED** · head `b80bc5d` · merge `1a69915` · https://github.com/OlaNailedIT/tncod-professionals/pull/22 — **Production recovered** (`dpl_DTe6dmsQ…`); signed-in acceptance **pending**. **OPEN:** Git→Vercel automatic Production deploy for `1a69915` never fired (“deployment absent” = symptom; root cause unexplained) |
| PR #21 | **OPEN** · head `4666248` · checks PASS · https://github.com/OlaNailedIT/tncod-professionals/pull/21 — packet `docs/release/pr-21-release-packet.md` |
| PR #23 | **OPEN** · head `7f517fb` · CI/preview PASS · directory-publication wording corrected without promising effective listing · https://github.com/OlaNailedIT/tncod-professionals/pull/23 — review `docs/release/pr-23-review.md` |
| PR #25 | **DRAFT** · head `ab9080b` · https://github.com/OlaNailedIT/tncod-professionals/pull/25 — local PKCE/profile/roles 19 checks, components 16 checks and focused numeric OTP/renewal/document HTTP 13 checks passed (overlapping runs). Failed attempts retained. Staged release/recovery proposal prepared; Production actions unapproved |
| Phase 23C | **NOT LOCKED** |
| Public launch | **BLOCKED** — AUTH-A |

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
| E | Phase 23D participant comprehension | **AWAITING HUMAN** — dashboard clarity in **#23** (reviewed; not merged). Full comprehension still needs real participants (LC-E) |
| F | Controlled-pilot closeout | **AWAITING HUMAN** (LC-E) |
| G | EXCO surface / Member↔EXCO return | **AWAITING HUMAN** — Production azure serves #22 (`dpl_DTe6dmsQ…`). Signed-in Member↔EXCO↔Member on desktop/phone/tablet. Checklist: `docs/release/pr-22-signed-in-acceptance.md` (LC-B). Auto-deploy reliability remains **OPEN** (does not block this test) |
| H | Current interest roster | **IN REVIEW** — #21 head `4666248`; migration **not** applied; cadence **NOT ACCEPTED**. Packet: `docs/release/pr-21-release-packet.md` (LC-B) |
| J | Dashboard clarity (#23) | **REVIEWED** — no hard dependency on #21. Do **not** merge under AUTH-A auth. Review: `docs/release/pr-23-review.md` (LC-B). Do **not** re-implement |
| K | AUTH-A release preparation | **IN PROGRESS** — non-Production core proof passed; focused remaining browser test 1 passed / 13 checks / 0 failed / 0 skipped. Initial failed runs retained; earlier email-quota theory unproven. Historical CAPTCHA evidence carried forward without redoing that phase. Actual deployed consumers/recovery baseline and exact Production approvals pending. Evidence: `docs/release/auth-a-hosted-proof.md` (LC-C) |
| L | Git→Vercel Production auto-deploy | **OPEN** — merge `1a69915` produced no automatic Production deployment; recovered via authorized CLI. Targeted diagnosis continues; does not block #22 signed-in acceptance |
| I | Optional headshot | **DEFERRED** post-launch / proposal only — not a launch dependency |

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

**DEF-23C-01 — released; physical retest pending.** The phone menu closed and the page stayed put because `NavLink` rendered a button whenever `onNavigate` was set. The released fix keeps `mode` as the element choice, so link mode stays a real link and the drawer still closes. Read-only Production checks on `19b214a` passed for Professionals, Join, and Sign in through the phone drawer (WebKit iPhone and narrow Chromium): exact URL and unique `#main-content`. **Baseline preserved:** a local run reached `/professionals` and closed the drawer, then missed the heading because disposable Postgres at `127.0.0.1:54322` was down. The iPhone 12 Pro Max, Chrome, portrait retest on this release is still required.

**DEF-23C-02 — artificial-profile test corrected; real-device header responsiveness awaiting verification.** Header Sign in stayed on `/` under a resized iPhone 12 Pro profile (scale 3) on both Production `1c50836` and the PR preview. That profile is not a physical tap. No header code change. Native iPad, landscape 844×390, Chromium iPad, and desktop header checks for Professionals, Join, and Sign in passed on Production `19b214a` (tap on touch projects, click on desktop, exact URL and unique main content). A physical iPad and landscape iPhone tap is still required. Phase 23C stays **NOT LOCKED**.

Click versus `locator.tap()` on the same Sign in anchor, from `/`, expecting `/sign-in`:

| Profile | click | tap |
| --- | --- | --- |
| Native iPad Pro 11 | Starts a non-prefetch navigation RSC. In the Join sequence the URL was still `/` at 8s, then the in-flight navigation to `/join` interrupted the next `goto`. A separate Sign in click committed to `/sign-in` in under 1.5s, as did keyboard Enter. | Same late non-prefetch navigation as click. |
| iPhone landscape context at 844×390 | Same: navigation RSC starts; the URL is still `/` inside 8s; the commit then interrupts the next load. | Same, with the navigation RSC about 5s after tap. |
| iPhone 12 Pro resized with `setViewportSize` to 834×1194 (scale 3) | Click can return with only prefetch requests and no navigation. This was the original failing test. It is not a tablet tap. | `tap()` timed out in scroll-into-view and did not navigate. |

The `/sign-in?_rsc=` request after the interaction is a click-triggered navigation (`next-router-prefetch` absent, distinct `_rsc` from the viewport prefetch of Professionals, Join, and Sign in). A 200 on that request is not a completed navigation: history did not `pushState` until later, and the heading stayed “TNCOD Professionals” through the assertion window. Viewport prefetches are the separate `next-router-prefetch: 1` requests.

Preview matrix before release (application code identical to `bcc42d1`; the later commit changed tests and this board only): **20 passed, 22 skipped, 0 failed**. Skips were phone-drawer tests on header projects, header tests on phone projects, and the design-system specimen on header projects. Production matrix on the azure origin after `19b214a`: **18 passed, 24 skipped, 0 failed**. The extra two skips are the design-system specimen, which is 404 in Production. Every required Professionals, Join, and Sign in case ran.

**Physical check still required before Phase 23C lock.** Emulator commit time varied from under 1.5s to more than 8s, so this does not prove a real device fails or that it is fast.

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

DEF-23C-01 still needs the released build on the iPhone 12 Pro Max, Chrome, portrait: open the menu and tap Professionals, Join, and Sign in. Each tap must change the page, not only close the menu.

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

**Implemented portion (in review, not accepted):** member **dashboard clarity** — human status labels via `present*`, one state-derived next-step (`resolveMemberNextAction` with PENDING ≠ UNDER_REVIEW), `PageIntro`, secondary links to existing `/opportunities` · `/profile` · `/settings/privacy`. Not the full Phase 23D surface set. Full acceptance remains **AWAITING HUMAN**.

---

## Controlled pilot readiness matrix

| Requirement | For **limited controlled pilot** | For **unrestricted / public launch** |
| --- | --- | --- |
| Gate 4–6A technical closeouts | Required (already **PASS**) | Required |
| AUTH-A provider E-API residual | Acceptable under existing pilot exception (E-UI neutralized) | **Unconditional blocker** until residual removed or new explicit owner decision |
| AUTH-B reclaim confirmations | Prefer resolve before wide cohort; not every collision blocks a tiny invited pilot | **Required** before unrestricted launch |
| PRIVACY-L1 legal sign-off | Strongly preferred; factual notice already live | **Required** |
| Dashboard backup class confirm | Preferred ops hygiene | Required for launch ops claim |
| Production-data restore drill | Not required to *start* limited pilot | Required before claiming full DR |
| Phase 23C phone + tablet | **Required** before claiming UX-ready pilot surfaces | **Required** |
| Phase 23D comprehension | **Required** for pilot closeout quality | **Required** |
| Pilot closeout packet | Required to close Phase 23 pilot | N/A (separate unrestricted gate) |
| Phase 24+ features | Not authorised | Not authorised |

**Pilot activation (invite restricted cohort) may proceed when:** owner accepts AUTH-A residual for this limited cohort **and** 23C/23D execution is scheduled with real humans.  
**Pilot closeout PASS** still needs filled 23C + 23D + `docs/release/pilot-closeout-packet.md`.  
**Unrestricted launch PASS:** withheld (AUTH-A at minimum).

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

**Signed-in retest, not yet done:** the owner should see EXCO in member navigation, open it, and follow Opportunities. Profile and the other member destinations should still be there.

**Interest roster:** PR #21 is open and is not Production. Its migration has not been applied. The operator procedure names the project owner. The proposed weekly review, and a review before closing an opportunity, is **not accepted**.

**Optional headshot:** proposal only, in `docs/product/optional-headshot-proposal.md`. Not implemented.

## Priority order for the project owner (now)

1. **Signed-in EXCO retest** on the azure origin: EXCO in member navigation, open EXCO, then Opportunities. Confirm profile and member navigation remain.
2. **Finish Phase 23C** rows that are not in the owner-reported table above. Phase 23C stays **NOT LOCKED**.
3. **Execute Phase 23D** with real participants.
4. **Privacy-L1** — choose one of the three legal reply lines after reviewing `/privacy`.
5. **AUTH-B** — authorise or explicitly defer each COLLISION-0N UUID (no bulk reclaim).
6. **Backup class** — fill Dashboard fields in `ops-backup-class-owner-check.md`.
7. **Pilot closeout** — complete `pilot-closeout-packet.md` only after real cohort evidence exists.

**AUTH-A dependency:** the hosted provider differential remains on Production. Upstream [supabase/auth#1547](https://github.com/supabase/auth/issues/1547) is an alternative path, not the only remediation: the approved non-Production server-only publishable/deactivated-legacy candidate is in draft #25. Its completed hosted/local evidence does not authorize Production cutover or close AUTH-A.

**Next single action:** On the azure origin, sign in and confirm EXCO appears in member navigation, opens, and reaches Opportunities, with profile still available.
