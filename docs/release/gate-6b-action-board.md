# Gate 6B — Consolidated human action board

**Opened:** 2026-10-12  
**Updated:** 2026-10-12 (closeout board)  
**Gate 6A:** PASS — do not reopen without a new reproducible regression  
**AUTH-A:** PROVIDER-LEVEL residual — **unrestricted launch blocked**; controlled pilot exception remains (not an item for risk-acceptance solicitation here)

**Live identity (verified this closeout):**

| Fact | Value |
| --- | --- |
| `origin/main` | `6618ac87c806e1a58cd027c34c08783bb7ed6567` |
| GitHub Production deployment | id `7021555704` · sha `6618ac8` · 2026-10-12T19:10:33Z |
| Azure origin | `https://tncod-professionals-azure.vercel.app` |
| CI on tip | `verify` **success** |

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
| D | Phase 23C real-device acceptance | **AWAITING HUMAN** |
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

**Next single action:** Start Phase 23C Task 1 on a physical phone at the azure origin and fill the packet row-by-row.
