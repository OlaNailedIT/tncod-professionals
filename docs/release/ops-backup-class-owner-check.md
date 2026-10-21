# Backup class — owner dashboard check (Gate 6B)

The owner has confirmed **Free**, and the earlier organization API check also
reported Free. Do not keep asking the owner to confirm a paid backup/PITR
class or suggest an upgrade. Existing manual exports are still unverified.

**Current action:** select/accept the protected destination, recoverable key
custody and operating cadence in `docs/operations/free-tier-recovery-plan.md`,
then separately authorize a protected export and isolated data/object restore
drill. No Production export or restore is authorized by this checklist.

**Project ref:** `brpppukzqgpzxjelwwrj` (us-west-2)  
**Responsible operator:** Product owner / platform operator (same as incident runbook)

## Historical UI checklist (reference only, not the current blocker)

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

- Use the explicitly authorized isolated local restore target in the Free-tier
  plan; do not create another hosted project or require paid backup features.
- **Never** restore over live Production for a drill.  
- Gate 6B engineering may separately prove a **schema-only** dump→disposable Postgres drill without touching Production data plane writes.
