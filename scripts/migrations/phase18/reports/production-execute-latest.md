# Phase 18 — Production execution report

**Status:** Production historical import executed; historical reconciliation PASS; absolute integrity NOT CLEAN (pre-existing orphan)

## Execution attempted

```text
mode: EXECUTE_PRODUCTION
project: brpppukzqgpzxjelwwrj
source hash: 4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C
authorization: PHASE18_PRODUCTION_IMPORT_AUTHORIZED exact phrase verified (value not printed)
```

## Pass 1 — CREATE (2026-09-11T15:49:32.811Z)

```text
batch: phase18-prod-4EC0A1773D77-1789141626246
environment: production
stageOrderInvariant: AUTH_FIRST
productionMutationExecuted: true

CREATED: 18
SKIP_ALREADY_IMPORTED: 0
GAP_ONLY_PROVENANCE: 0
REFUSED: 0
FAILED: 0
total: 18
```

All 18 rows completed stages: `auth → user → role → profile → provenance`.

## Pass 2 — idempotency (2026-09-11T15:59:26.832Z)

```text
batch: phase18-prod-4EC0A1773D77-1789142365052
environment: production
productionMutationExecuted: true

CREATED: 0
SKIP_ALREADY_IMPORTED: 18
GAP_ONLY_PROVENANCE: 0
REFUSED: 0
FAILED: 0
total: 18
```

No duplicate Auth/member/profile/provenance created on second run.

## Records successfully created (Pass 1)

```text
Auth users created:        18
Members created:           18
Profiles created:          18
Provenance records:        18
Partial historical states: 0
```

## Public-state safety (post-import RO)

```text
verificationStatus: NOT_REVIEWED × 18
visibilityStatus: PRIVATE × 18
consent: 0
spotlight: 0
businesses: 0
DIRECTORY/MEMBERS_ONLY/VERIFIED profiles: 0
```

## Absolute integrity caveat

```text
users total: 19
historical users: 18
pre-existing non-historical orphan: 1
  masked: p***@e***
  createdAt: 2026-09-10T19:42:06.737Z (before Pass 1)
  hasProfile: false
  legacyImport: null
  Auth match: none (auth.users remains 18 historical only)
```

This orphan was **not** created by Pass 1. It blocks absolute “0 orphan states” integrity LOCK until separately disposed (read-only disposition only — no guesswork cleanup in this gate).

## Related reports

- `production-execute-latest.json` — latest CLI output (Pass 2)
- `production-post-import-reconciliation.md` — RO reconciliation after Pass 1
- `production-failed-run-reconciliation.md` — pre-import clean starting state

## Secrets

No database passwords, service-role keys, or full credentials are included in this report.
