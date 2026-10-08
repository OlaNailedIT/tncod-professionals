# Phase 4 — soft-deleted identifier reclaim (operator)

**Status:** implementation on branch `phase4-join-reclaim-v2`. **No Production apply until owner confirms the target user id.**

## Problem

Soft-deleted `public.users` rows still occupy unique `email` / `phone`. `/join` detects them, returns a neutral accept, and `/join/success` previously claimed Auth + professional record existed.

## Recovery method

Keep the tombstone row and FKs. Release identifiers:

- `email` → `reclaimed+{compactUuid}@tombstone.invalid`
- `phone` → `NULL`

Refuse if: missing, not soft-deleted, ACTIVE, Auth still present, profile still active, or email clash.

## Operator command

```bash
# dry-run (default)
npx tsx scripts/phase4-identifier-reclaim.ts --user-id <uuid>

# apply (Production only after confirmation)
PHASE4_RECLAIM_AUTHORIZED=YES npx tsx scripts/phase4-identifier-reclaim.ts --user-id <uuid> --apply
```

Preferred candidate (confirm before apply): cleaned controlled identity `df709e23-1a55-4ba4-bfac-dde6740512ff` / `smiley7605+tncodphase4oct03@…`.

## Backup / compensation

Dry-run writes an auditable JSON report under `scripts/reports/`. Apply refuses without `PHASE4_RECLAIM_AUTHORIZED=YES`. If apply succeeds incorrectly, restore email/phone from the report’s preflight masks only with a new authorized restore procedure (full values are not stored — take a privileged DB snapshot of `public.users` for that id before Production apply).

## Success UX

`/join/success` no longer claims Auth/record creation. Same public page for genuine and neutral accepts (anti-enumeration).
