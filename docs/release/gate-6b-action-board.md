# Gate 6B — Consolidated human action board

**Opened:** 2026-10-12  
**Updated:** 2026-10-16 (PR #18 released; physical retest still open)  
**Gate 6A:** PASS — do not reopen without a new reproducible regression  
**AUTH-A:** PROVIDER-LEVEL residual — **unrestricted launch blocked**; controlled pilot exception remains (not an item for risk-acceptance solicitation here)

**Live identity:**

| Fact | Value |
| --- | --- |
| `origin/main` | `19b214a2ee10cdeb124538a7467b9a75894c032d` (PR #18 merge, 2026-10-16T04:51:16Z) |
| GitHub Production deployment | id `7111227913` · environment Production · sha `19b214a2ee10cdeb124538a7467b9a75894c032d` · status success · 2026-10-16T04:52:17Z |
| Azure origin | `https://tncod-professionals-azure.vercel.app` serves that deployment (page chunk `app/page-107fab8bbc877f06.js`, not the previous Production chunk) |
| PR #18 | **MERGED** · head `bcc42d1` · https://github.com/OlaNailedIT/tncod-professionals/pull/18 |
| Phase 23C | **NOT LOCKED** |
| Public launch | **BLOCKED** — AUTH-A remains an unrestricted-launch blocker |

Status vocabulary: `NOT STARTED` · `AWAITING HUMAN` · `AUTHORIZED` · `IN PROGRESS` · `PASS` · `FAIL` · `BLOCKED`

Update this board only from real owner/legal/tester evidence — never from automation alone.  
Do **not** fabricate devices, participants, legal sign-off, reclaim evidence, or pilot PASS.

---

## Status roll-up

| ID | Action | Status |
| --- | --- | --- |
| A | AUTH-B owner confirmations (COLLISION-01…08) | **AWAITING HUMAN** |
| B | Privacy Notice legal/privacy sign-off | **AWAITING HUMAN** |
| C | Backup class (Dashboard) + production-data recovery posture | **AWAITING HUMAN** (schema-only disposable restore drill **PASS**) |
| D | Phase 23C real-device acceptance | **AWAITING HUMAN** — **NOT LOCKED**. DEF-23C-01 released, physical retest pending. DEF-23C-02 artificial-profile test corrected; real-device header responsiveness awaiting verification |
| E | Phase 23D participant comprehension | **AWAITING HUMAN** |
| F | Controlled-pilot closeout | **AWAITING HUMAN** (depends on D/E + owner judgment on A/B/C) |

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

## Priority order for the project owner (now)

1. **Execute Phase 23C** on a real phone + tablet using the 23C packet (unblocks visual/UX acceptance).  
2. **Execute Phase 23D** with real participants using the 23D packet (unblocks comprehension evidence).  
3. **Privacy-L1** — choose one of the three legal reply lines after reviewing `/privacy`.  
4. **AUTH-B** — authorise or explicitly defer each COLLISION-0N UUID (no bulk reclaim).  
5. **Backup class** — fill Dashboard fields in `ops-backup-class-owner-check.md`.  
6. **Pilot closeout** — complete `pilot-closeout-packet.md` only after real cohort evidence exists.

**Next single action:** On the released azure origin, run the DEF-23C-02 physical tap on a real iPad and a landscape iPhone, and redo the phone menu task (DEF-23C-01) on the iPhone 12 Pro Max. Phase 23C is **NOT LOCKED**. AUTH-A still blocks unrestricted public launch. Privacy-L1, backup class, AUTH-B, Phase 23D, and pilot closeout stay open and independent of that tap.
