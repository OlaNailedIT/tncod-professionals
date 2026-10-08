# Phase 4 — remaining soft-deleted identifier recovery (owner-verified)

**Status:** procedure only. **No bulk apply. No bulk delete.** Controlled-pilot remains in force.

## Why this exists

PR #4 recovered **one** owner-confirmed Auth-absent soft-deleted identity so a real Production `/join` could reuse that email and phone. That live path **PASS**ed (Auth + active `public.users` + profile + professional details + MEMBER + member OTP sign-in).

It does **not** clear the collision surface for other soft-deleted rows. Masked Production inventory (2026-10-08):

- Soft-deleted total **10** (all Auth-absent in that scan).
- **8** reclaim candidates (non-tombstone); **2** already tombstoned.
- **6** Auth-absent rows still retain phone numbers.
- Several candidates still show `account_status: ACTIVE` despite `deleted_at` — soft-delete is authoritative; reclaim now normalizes `account_status` to `DEACTIVATED` on apply.
- Reusing candidate identifiers can still yield the neutral “Request received” page **without** creating Auth.
- PR #4 fixed the misleading success claim and shipped a **one-id** reclaim tool; it did not auto-recover everyone.

## Invariants

1. **One confirmed UUID per apply** — never a batch reclaim of all remaining rows.
2. Owner (or delegated EXCO operator) must confirm each identity before `--write-snapshot` / `--apply`.
3. Prefer preserving the tombstone row and FKs; release email/phone only (see `phase-4-identifier-reclaim.md`).
4. Do **not** hard-delete the remaining soft-deleted records as a cleanup shortcut.
5. Do **not** clean up the current working Production test account until a later explicit authorization.
6. Masked inventory and dry-run reports are not rollbacks; ACL-gated snapshots outside the repo are.

## Inventory (read-only)

Masked Production inventory (no full phone/email in logs):

```bash
npx tsx -r ./scripts/register-server-only.cjs \
  scripts/phase4-soft-deleted-inventory.ts
```

Output categories (non-PII):

- `auth_absent_soft_deleted` — reclaim candidates (owner must still confirm)
- `auth_present_soft_deleted` — **do not reclaim** via this tool
- `phone_retained` count within auth-absent soft-deleted

## Per-record recovery (after owner confirmation)

For **each** UUID the owner lists:

```bash
HOOK=(-r ./scripts/register-server-only.cjs)

# Dry-run
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts --user-id <uuid>

# Snapshot (outside-repo ACL-hardened --snapshot-dir)
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --user-id <uuid> --write-snapshot --snapshot-dir "<outside-repo-private-dir>"

# Apply only with explicit phrase
PHASE4_RECLAIM_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --user-id <uuid> --apply --snapshot-file "<snapshot-path>"
```

Then, if identifiers must be proven reusable: one controlled `/join` with **owner-controlled** credentials for that record only (not required for every tombstone before pilot continues).

## Broader release gate (not yet met)

Before unrestricted launch / Phase 4 unrestricted PASS:

1. Controlled-pilot E-API residual reassessed or accepted under a new explicit decision.
2. Remaining collision records either reclaimed under this procedure or explicitly accepted as residual with documented risk.
3. Disposable full-Auth synthetic registration suite green (several distinct unused email/phone pairs).
4. Working test account disposition decided separately — **retain for now**.

**Phase 5:** not authorized.
