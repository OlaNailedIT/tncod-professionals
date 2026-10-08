# Phase 4 — soft-deleted identifier reclaim (operator)

**Status:** implementation on branch `phase4-join-reclaim-v2`. **No Production apply until owner confirms the target user id and approves the procedure.**

## Problem

Soft-deleted `public.users` rows still occupy unique `email` / `phone`. `/join` detects them, returns a neutral accept, and `/join/success` previously claimed Auth + professional record existed.

## Recovery method

Keep the tombstone row and FKs. Release identifiers:

- `email` → `reclaimed+{compactUuid}@tombstone.invalid`
- `phone` → `NULL`

Guards:

- Preflight checks Auth by **UUID** and by **original email** via exact `auth.users` SQL (Admin API has no getUserByEmail).
- Apply takes `FOR UPDATE` on the row, re-checks the same facts, and runs a conditional `UPDATE` that must affect **exactly one** row; otherwise fail closed (`ROW_CHANGED`).
- Apply requires a pre-apply **snapshot file** whose full email/phone match the locked row.
- “Already reclaimed” succeeds only when the row is soft-deleted, Auth-absent, phone null, and has no active profile — not merely because the tombstone email exists.

## Operator command

```bash
# Always use the server-only register hook (same as Phase 18 scripts).
HOOK=(-r ./scripts/register-server-only.cjs)

# 1) dry-run (default) — masked report only
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts --user-id <uuid>

# 2) write secure snapshot (full email/phone; local, mode 0600, gitignored)
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts --user-id <uuid> --write-snapshot

# 3) apply (Production only after confirmation)
PHASE4_RECLAIM_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --user-id <uuid> --apply --snapshot-file scripts/reports/snapshots/reclaim-<uuid>-<token>.json

# 4) compensation / restore (only while identifiers remain unclaimed)
PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --restore --snapshot-file <path>          # dry-run
PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --restore --snapshot-file <path> --apply  # mutate
```

Preferred candidate (confirm before apply): cleaned controlled identity `df709e23-1a55-4ba4-bfac-dde6740512ff` / `smiley7605+tncodphase4oct03@…`.

## Snapshot vs masked report

| Artifact | Contains full email/phone? | Rollback? |
| --- | --- | --- |
| Masked report under `scripts/reports/` | No | **No** — audit only |
| Snapshot under `scripts/reports/snapshots/` | Yes | **Yes** — required for apply and restore |

Never commit snapshots. Treat them as credentials.

## Point of no return

After reclaim, a successful new `/join` (or Auth create) that claims the original email or phone makes restore **unsafe and refused** (`IDENTIFIERS_ALREADY_CLAIMED`). At that point the old identifiers belong to the new account; do not overwrite them from the snapshot.

## Success UX

`/join/success` no longer claims Auth/record creation. Same public page for genuine and neutral accepts (anti-enumeration). If no OTP arrives after one Sign in request, the page directs people to email `cityofdavidprofessionals@gmail.com` instead of an indefinite retry loop.
