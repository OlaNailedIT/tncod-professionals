# Operations — Backup / restore (Production)

**Gate 6B status:** **OPS — BACKUP/RESTORE: PASS** (schema-only disposable drill — see `backup-restore-drill-6b.md`)  
**Dashboard backup class confirmation:** still **AWAITING HUMAN** (`docs/release/ops-backup-class-owner-check.md`)  
**Date:** 2026-10-12  
**Production project ref (non-secret):** `brpppukzqgpzxjelwwrj` (us-west-2)  
**Application origin:** `https://tncod-professionals-azure.vercel.app`

---

## What is known without dashboard secrets

| Item | Evidence class | Notes |
| --- | --- | --- |
| Hosted Postgres on Supabase | LIVE / prior infrastructure reports | Production DB is hosted Supabase |
| Provider backup capability (paid plans) | PROVIDER DOCS | Supabase documents daily backups for Pro+ and optional PITR add-on; Free tier expects self-managed dumps |
| Restore-to-new-project / PITR restore | PROVIDER DOCS | Available on paid plans with physical backups; restores must not target live Production blindly |
| Gate 6B schema-only disposable restore drill | **PASS** | See `backup-restore-drill-6b.md` — proves schema materialization only |
| Protected production-data recovery drill (Dashboard backup → restore-to-new-project) | **NOT EXECUTED** | Requires owner-confirmed backup class + authorised disposable target |

Do **not** claim production-data disaster recovery is proven from the schema-only drill alone.

---

## Responsible operator

| Role | Responsibility |
| --- | --- |
| Product owner / platform operator | Confirms Supabase plan tier, opens Database → Backups, authorises any restore |
| Engineering executor | Documents procedure; never overwrites Production without explicit written authorization |

---

## Safe restore drill (when authorised)

1. Confirm Production backup class in Supabase Dashboard (daily backup list and/or PITR window).  
2. Prefer **Restore to a new project** (or equivalent disposable target) — **never** restore over Production for a drill.  
3. Record: backup timestamp/class, target project ref, start/end time, basic integrity checks (migration count / row sanity on non-PII tables).  
4. Decommission the disposable project after evidence is captured.

### Integrity checks (disposable only)

```text
- supabase migration history / applied migration count matches expectation
- public.users / profiles counts are non-zero if source had data
- no Production URL/credentials pointed at the disposable project for app traffic
```

---

## Remaining human item

```text
Owner confirms Supabase Dashboard backup class/PITR fields
(see docs/release/ops-backup-class-owner-check.md)
```

Engineering disposable schema restore drill: **PASS** (`backup-restore-drill-6b.md`).
