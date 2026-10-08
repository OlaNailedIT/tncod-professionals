# Phase 4 — soft-deleted identifier reclaim (operator)

**Status:** implementation on branch `phase4-join-reclaim-v2`. **No Production apply until owner confirms the target user id and approves the procedure.**

## Problem

Soft-deleted `public.users` rows still occupy unique `email` / `phone`. `/join` detects them, returns a neutral accept, and `/join/success` previously claimed Auth + professional record existed.

## Recovery method

Keep the tombstone row and FKs. Release identifiers:

- `email` → `reclaimed+{compactUuid}@tombstone.invalid`
- `phone` → `NULL`

Guards:

- Preflight checks Auth by **UUID** and by **original email** via exact `auth.users` SQL.
- Apply takes `FOR UPDATE` on the row, re-checks the same facts, and runs a conditional `UPDATE` that must affect **exactly one** row; otherwise fail closed (`ROW_CHANGED`).
- Apply requires a pre-apply **snapshot file** whose full email/phone match the locked row.
- After a successful commit, `changed: true` even if post-check fails (so recovery is not misled).
- “Already reclaimed” succeeds only when the row is soft-deleted, Auth-absent, phone null, and has no active profile.

## Snapshot directory (Windows)

Full-PII snapshots **must not** be written under `scripts/reports` (or anywhere in the repo). On Windows, `mode: 0o600` does not strip inherited ACLs (e.g. `OX\CodexSandboxUsers`).

Requirements:

1. Operator creates a directory **outside** the repository.
2. Operator hardens ACL (disable inheritance; Allow only current user, `SYSTEM`, `Administrators`).
3. Pass `--snapshot-dir <that-path>` to `--write-snapshot`.
4. Tool verifies ACL before writing and **fails closed** if any other non-administrator principal can read.
5. CLI prints the snapshot **path only** — never the file contents.

## Operator command

```bash
HOOK=(-r ./scripts/register-server-only.cjs)

# 1) dry-run (default) — masked report only
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts --user-id <uuid>

# 2) write secure snapshot (explicit outside-repo dir with private ACL)
npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --user-id <uuid> --write-snapshot --snapshot-dir "D:\secure\tncod-reclaim"

# 3) apply (Production only after confirmation)
PHASE4_RECLAIM_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --user-id <uuid> --apply --snapshot-file "<outside-repo>\reclaim-<uuid>-<token>.json"

# 4) compensation / restore (only while identifiers remain unclaimed)
PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --restore --snapshot-file <path>
PHASE4_RECLAIM_RESTORE_AUTHORIZED=YES npx tsx "${HOOK[@]}" scripts/phase4-identifier-reclaim.ts \
  --restore --snapshot-file <path> --apply
```

Preferred candidate (confirm before apply): cleaned controlled identity `df709e23-1a55-4ba4-bfac-dde6740512ff` / `smiley7605+tncodphase4oct03@…`.

## Snapshot vs masked report

| Artifact | Contains full email/phone? | Rollback? |
| --- | --- | --- |
| Masked report under `scripts/reports/` | No | **No** — audit only |
| Snapshot outside repo (ACL-checked) | Yes | **Yes** — required for apply and restore |

Never commit snapshots. Treat them as credentials.

## Point of no return

After reclaim, a successful new `/join` (or Auth create) that claims the original email or phone makes restore **unsafe and refused** (`IDENTIFIERS_ALREADY_CLAIMED`).

## Success UX

`/join/success` does not claim Auth/record creation. If no OTP arrives after one Sign in request, copy directs people to the Professionals EXCO team via the City of David church channel. **`cityofdavidprofessionals@gmail.com` is not published** until the owner confirms it is an official monitored support inbox.
