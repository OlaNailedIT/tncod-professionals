# AUTH-B — Identifier collision confirmation packet (Gate 6A)

**Inventory date (Production read-only):** 2026-10-12  
**Tool:** `scripts/phase4-soft-deleted-inventory.ts`  
**Procedure:** `docs/security/phase-4-remaining-identifier-recovery.md` / `docs/security/phase-4-identifier-reclaim.md`  
**Mutations this gate:** **0**

---

## Summary

```text
candidates before (prior ledger, 2026-10-08): 8 reclaim + 2 tombstone
Production soft-deleted total now:            10
already_reclaimed (tombstone.invalid):        2
reclaim_candidate still open:                 8
reclaimed this gate:                          0
owner confirmations required:                 8
```

No per-record owner confirmation for the remaining UUIDs is present in repository evidence for Gate 6A. Therefore **no reclaim applies** were executed.

```text
AUTH-B: OWNER CONFIRMATIONS REQUIRED
```

---

## Already resolved (do not reclaim again)

| Label | userId (internal) | Status |
| --- | --- | --- |
| RESOLVED-01 | `df709e23-1a55-4ba4-bfac-dde6740512ff` | `already_reclaimed` — prior owner-confirmed apply (2026-10-08) |
| RESOLVED-02 | `54d01a92-8599-43c7-baf5-f50dbaecec41` | `already_reclaimed` — tombstone; Auth absent |

---

## Remaining candidates — owner confirmation required

Confirm **one UUID at a time** before `--write-snapshot` / `--apply`. Do not bulk SQL.

| Label | userId | Masked email | Phone retained | Account status (row) | Auth | Note |
| --- | --- | --- | --- | --- | --- | --- |
| COLLISION-01 | `7df3c2b4-bdb9-4773-b081-0c10d8fd9fdc` | `p***@example.invalid` | no | ACTIVE* | absent | Soft-deleted 2026-09-11 (historical orphan disposition class) |
| COLLISION-02 | `90b737ad-b92c-4e1a-a3d0-96126c32b7b0` | `o***@gmail.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-03 | `c2cfe0b3-6ae6-4194-9264-e008a3faa8ac` | `t***@example.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-04 | `6b21f037-ee98-41de-af20-61f71bc6ea2e` | `o***@gmail.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-05 | `5e3b47ab-cbd3-4b79-8dee-d7d717f00098` | `s***@gmail.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-06 | `6ceef204-fc19-4e83-8dcb-973ad869da36` | `o***@gmail.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-07 | `efb97eeb-387a-4bb9-8d3b-9a5f013033be` | `t***@example.com` | no | ACTIVE* | absent | Soft-deleted 2026-09-16 |
| COLLISION-08 | `8bedfed5-bd7b-43f3-b5f6-3d8435c91542` | `h***@gmail.com` | yes | ACTIVE* | absent | Soft-deleted 2026-09-16 |

\*Soft-delete (`deleted_at`) is authoritative; reclaim apply normalizes `account_status` → `DEACTIVATED`.

---

## Owner reply format (copy/paste)

For each UUID the owner authorises:

```text
AUTHORIZE RECLAIM COLLISION-0N
userId: <uuid>
I confirm this soft-deleted Auth-absent identity may release email/phone under the Phase 4 reclaim procedure.
```

Then operators run the documented one-id dry-run → snapshot → `PHASE4_RECLAIM_AUTHORIZED=YES` apply path.

**AUTH-C:** designated working test account remains retained through controlled-pilot closeout (not listed for reclaim here).
