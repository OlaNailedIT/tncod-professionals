# Phase 18 — Pre-existing orphan disposition (cleanup)

Generated: 2026-09-11T16:54:38.105Z
**Final status:** CLEANUP PASS — ORPHAN REMOVED

## Original disposition

```text
REQUIRES_MANUAL_BUSINESS_DECISION
```

## Authorized action

```text
single-record cleanup
```

## Final disposition

```text
REMOVED_PRE_EXISTING_UNSUPPORTED_ORPHAN
```

## Target

```text
masked identifier = p***@e***
id prefix = 7df3c2b4…
original created_at = 2026-09-10T19:42:06.737Z
```

## Pre-delete verification

```text
TARGET_MATCH = true
AUTH_MISSING = true
PROFILE_MISSING = true
ROLES_MISSING = true
PROVENANCE_MISSING = true
REFERENCES_ZERO = true
PHASE18_MEMBER = false
CREATED_BEFORE_PHASE18 = true
NO_UNEXPECTED_DEPENDENCY = true
SAFE_DELETION_SEMANTIC = true
MASKED_MATCH = true
CREATED_AT_MATCH = true
ID_PREFIX_MATCH = true
STILL_ACTIVE = true
pre-delete references = 0
pre-delete Auth = NONE
pre-delete profile = NONE
pre-delete roles = NONE
pre-delete provenance = NONE
```

## Deletion mechanism

```text
soft-delete via public.users.deleted_at UPDATE scoped to exact users.id (deletedAt:null)
```

Hard DELETE was not used. Schema/RLS convention is soft-delete via `deleted_at`.

## Mutation performed

```text
Orphan cleanup mutation: 1 application-user record transitioned to deleted state
Auth mutations: 0
Historical Phase 18 mutations: 0
Other user mutations: 0
Schema changes: 0
RLS changes: 0
Deployment: 0
```

## Post-delete verification

```text
orphan active (same id, deleted_at null) = 0
active non-historical users = 0
orphan deleted_at = 2026-09-11T16:54:14.895Z
Auth users = 18 (SQL 18)
historical users (active) = 18
legacy profiles = 18
legacy provenance rows = 18
COMPLETE_SAFE = 18
historical partial = 0
unsafe public-state = 0
consent = 0
spotlight = 0
business = 0
```

## UNKNOWN

- Original creator/cause of the orphan remains unknown

## Governance

```text
PHASE 18 — PRODUCTION IMPORT COMPLETE
PHASE 18 — HISTORICAL DATA VERIFIED
PRE-EXISTING ORPHAN — DISPOSITIONED
PHASE 18 — PASS / COMPLETE / VERIFIED / LOCKED
```

The orphan predated Phase 18, was outside the historical source, was not created by Phase 18,
was an unsupported Auth-less application-user record, had zero dependencies,
and was soft-deleted under separate explicit authorization.

HARD STOP
