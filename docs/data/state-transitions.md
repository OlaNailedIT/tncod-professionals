# Profile state transitions (domain / service — Phase 4+)

Three **independent** columns. Cross-rule: `visibility_status = DIRECTORY` requires `verification_status = VERIFIED` (CHECK + service).

Do not merge into one state machine.

## profile_status

```text
REGISTERED → INCOMPLETE → COMPLETE → SUBMITTED
```

After `NEEDS_CLARIFICATION` or `REJECTED`, member may edit; `profile_status` may return to `INCOMPLETE`/`COMPLETE` then `SUBMITTED` again.

## verification_status

```text
NOT_REVIEWED → PENDING → UNDER_REVIEW → VERIFIED

UNDER_REVIEW → NEEDS_CLARIFICATION → (member updates) → PENDING or UNDER_REVIEW
  (profile_status typically SUBMITTED again)

UNDER_REVIEW → REJECTED → member corrects → SUBMITTED + PENDING (new review)
```

Rejected **history** stays in `verification_records`. Current status may leave `REJECTED` on resubmission.

## visibility_status

```text
PRIVATE | MEMBERS_ONLY | DIRECTORY
```

No current-state `UNPUBLISHED`.

| Operation | From | To |
| --- | --- | --- |
| Standard unpublish from public directory | DIRECTORY | **MEMBERS_ONLY** |
| Explicit administrative hide | DIRECTORY | **PRIVATE** |
| Re-publish | MEMBERS_ONLY | DIRECTORY **only if VERIFIED** |
| Invalid | any non-VERIFIED | DIRECTORY |

`publications.resulting_visibility` records the new current visibility after each event.

## Valid / invalid examples

VALID: `COMPLETE` + `PENDING` + `PRIVATE`  
VALID: `COMPLETE` + `PENDING` + `MEMBERS_ONLY`  
VALID: `COMPLETE` + `VERIFIED` + `DIRECTORY`  
INVALID: `PENDING` + `DIRECTORY`
