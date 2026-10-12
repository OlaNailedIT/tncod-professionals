# Backup / restore drill — Gate 6B evidence

**Date:** 2026-10-12  
**Result:** **OPS — BACKUP/RESTORE: PASS** (schema-only disposable drill)  
**Production mutated:** **NO**

---

## What was proven

| Step | Result |
| --- | --- |
| Obtain schema backup from Production | PASS — `pg_dump --schema-only` via read path (~269 KB SQL) |
| Restore target | Disposable DB `restore_drill_6b` on local `supabase_db_tncod-professional` container |
| Restore process | PASS — `psql -f` into disposable DB |
| Database queryable | PASS |
| Core schema | PASS — `public.users`, `public.profiles`, `legacy_import_rows` present; `supabase_migrations` schema present |
| Table count (`public`/`app` base tables) | **32** |

Non-fatal noise during restore: hosted dump attempted `SET log_min_messages` (permission denied on local role) — did not prevent schema materialization.

Dump artifact stored **outside the repo** under the operator TEMP restore-drill directory (not committed; may contain privileged DDL — treat as sensitive).

---

## What this does **not** prove

- Full data restore / PITR second-granularity recovery  
- Application-tier disaster recovery RTO/RPO SLA  
- That Supabase Dashboard daily/PITR class is enabled (owner must still confirm UI fields in `docs/release/ops-backup-class-owner-check.md`)

---

## Responsible operator

Product owner / platform operator for Dashboard backup class confirmation and any Production-affecting restore.
