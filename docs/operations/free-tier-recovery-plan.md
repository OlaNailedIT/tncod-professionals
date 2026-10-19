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

## Preparation evidence — 2026-10-18

Owner answered “okay” to preparing `C:\Users\O\TNCOD-Private-Backups` and a
question about a second copy. This authorizes the empty local folder preparation,
not an unspecified second destination, member-data export or restore.

- Exact folder created outside the repository/synced ChatGPT project. Permission
  readback: inheritance disabled; owner matches the executing Windows user; exactly
  two allow rules (that owner and Windows SYSTEM), no unexpected or inherited rules.
  Folder is empty. No backup, member export or private document was created there.
- Existing Git-distributed GnuPG **2.4.9** is available; version only was inspected.
  No keyring/credential store was opened, and no encryption/recovery key generated.
  No new software, paid resource or provider setting change.
- Existing disposable database container is healthy. Docker named-pipe endpoint
  confirmed local; `pg_dump --version` in that container reports **17.11**. This is
  tool availability only, not a successful connection/export/restore proof.
- No second independent copy location or encryption-key custody was supplied.
  Those decisions remain open. A restricted folder is not itself an encrypted
  backup, an off-machine copy or a tested recovery arrangement.

Owner subsequently answered **“no independent storage available yet”**. This is
a real recovery dependency, not authority to purchase storage or choose a personal
cloud account. [Google documents free shared account storage of up to 15 GB](https://support.google.com/mail/answer/9312312)
as a possible existing-account option; this is not verified available capacity.
The Drive connector profile was read only (no file content/search/write): it is
connected to a different account from the known operator email and exposes no
storage-quota field. No ownership, Free-plan/headroom or backup destination inferred.
Using the existing church inbox's Drive was proposed for separate direction/access
confirmation. No folder was created there and no data uploaded or new account made.

### Church-Drive direction — owner reply and verification, 19 Oct

Owner answered **“Yes—church Google Drive, $0 only”** for the existing Drive of
`cityofdavidprofessionals@gmail.com`, explicitly direction-only: no export/upload.
Owner reports **25.1 MB used out of 15 GB**; quota is owner-reported, not exposed
or independently verified by the connector. No subscription or new account needed
is assumed; no spending is authorized.

After the owner reported “Church Drive connected”, one fresh read-only profile
check still returned a different Gmail profile. This does not prove the church
account was not added; it means the selected connection available to this call
does not match the approved destination. No account-selection override is exposed
by this tool. A screenshot of the connected-account list was requested rather
than guessing, revoking accounts or trying writes against the wrong account.
No Drive files searched/read, folder created, upload, key or backup operation.

Remaining: correct account availability, exact private destination and sharing
readback, encryption/key custody, backup cadence and explicit export/isolated
restore authority. Direction/account connection alone cannot close recovery.

The owner's separate acceptance of platform verification/posting/interest duties
does **not** accept the backup operator/cadence or authorize a Production export.

## Current gate

**Free plan identified; restricted empty folder/tools prepared; recovery NOT proven.** Still required: operator/cadence
acceptance, protected destination and key custody, authorized export, and a
successful data-plus-objects restore drill. No paid feature is a prerequisite.
