# Backup class — owner dashboard check (Gate 6B)

Engineering cannot assume the Production backup tier from Git alone.

**Project ref:** `brpppukzqgpzxjelwwrj` (us-west-2)  
**Responsible operator:** Product owner / platform operator (same as incident runbook)

## Exact UI path (Supabase)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → project **tncod-professionals** (`brpppukzqgpzxjelwwrj`).  
2. Go to **Database** → **Backups**.  
3. Record (non-secret):

```text
backup mechanism:        daily automatic / PITR / none visible
frequency/class:         e.g. daily
retention class:         e.g. 7 days (Pro)
point-in-time capability: YES/NO (PITR add-on)
manual backup/export:    YES/NO (dump / restore-to-new-project available)
```

4. Reply with those fields so the restore evidence record can be completed.

## Safe restore policy

- Prefer **Restore to a new project** for any full backup restore.  
- **Never** restore over live Production for a drill.  
- Gate 6B engineering may separately prove a **schema-only** dump→disposable Postgres drill without touching Production data plane writes.
