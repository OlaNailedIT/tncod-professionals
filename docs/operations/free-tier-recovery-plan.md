# Free-tier recovery — launch proposal, not executed evidence

**Constraint:** existing Free resources and owner-controlled storage only.
No upgrade, PITR add-on, third hosted project or paid backup service is
authorized. The owner confirmed Free; the earlier organization API check
also reported Free. That does not prove an export schedule already exists.

Supabase recommends self-managed exports/off-site copies for Free projects.
Database backups contain Storage metadata, not the object bytes. Sources:
[database backups](https://supabase.com/docs/guides/platform/backups),
[supported CLI backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Minimum operating proposal

- Primary operator: project owner, subject to acceptance; name a recovery
  contact. Proposed cadence: daily during pilot/launch and before releases
  or data maintenance. Proposed data-loss target: at most 24 hours; not an
  achieved SLA. Recovery time must be measured by the drill, not promised.
- Owner selects an existing protected local destination and an independent
  encrypted copy, with recoverable encryption-key custody. A copy on the
  same disk alone does not protect against loss of the machine. Do not invent
  a new account, spend money, email exports or place them in a synced public
  project/Drive folder. Encryption must use an established tool, not custom
  cryptography or a key stored alongside its only backup.
- No raw member export is authorized by this plan. Obtain approval naming
  Production source, protected destination, data scope and isolated restore
  target first. The AUTH-A hosted fixture project is not a member-data target.

## Completeness checks when export is approved

1. Capture supported roles/schema/data and migration history. Explicitly cover
   application records, authorization grants, Auth identities and Storage
   metadata; default dump scope is not assumed to cover managed schemas.
   Follow the provider's documented managed-schema handling, not blanket SQL.
2. Export the matching private Storage object bytes separately. Include
   bucket settings/policies and an object manifest/checksums. Detect missing
   or changed objects; metadata-only success is not a complete backup.
3. Preserve a protected configuration/consumer inventory and recovery procedure.
   Do not put live keys, tokens, password hashes, connection strings, document
   links or raw row data into Git, reports, logs or this plan.
4. Verify encrypted copies are readable by the authorized recovery operator;
   retain only non-secret timestamps, checksums, sizes and result status in
   the launch ledger. Record failed/missed backups visibly.

## Recovery proof, without affecting live service

Use an explicitly authorized isolated local restore database/directory, not
the live project and not a reset of the existing development stack. Keep
outbound email, scheduled jobs, notifications and external webhooks disabled.
Validate schema/migration agreement, Auth↔application identity links, role
grants, representative row integrity and private object byte checksums.
Measure time and data age, and document missing coverage honestly. Never
claim an app readback proves Auth delivery or Storage restoration by itself.

A protected Production-data drill and cleanup/retention instructions remain
pending separate authorization. The historical schema-only drill stays PASS
within its original scope; do not repeat it or relabel it full recovery.

## Current gate

**Free plan identified; recovery NOT proven.** Still required: operator/cadence
acceptance, protected destination and key custody, authorized export, and a
successful data-plus-objects restore drill. No paid feature is a prerequisite.
