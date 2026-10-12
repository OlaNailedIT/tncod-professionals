# Phase 18 — Production post-import reconciliation

**Status:** PHASE 18 — POST-IMPORT HISTORICAL PASS — PREEXISTING ORPHAN NOTED
Generated: 2026-09-11T15:58:43.616Z

## Source
```text
rows = 18
emails = 18
source hash = 4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C
```

## Auth
```text
listUsers = 18
auth.users SQL = 18
historical found = 18
unexpected non-historical = 0
```

## PostgreSQL
```text
users total = 19
historical users = 18
profiles = 18
legacy_import_rows = 18
legacy_import profiles = 18
consent = 0
spotlight = 0
businesses = 0
unsafe public-state profiles = 0
directory-like profiles = 0
non-historical users = 1
absolute integrity clean = false
```

## Row classification
- row 2: COMPLETE_SAFE · m***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 3: COMPLETE_SAFE · o***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 4: COMPLETE_SAFE · m***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 5: COMPLETE_SAFE · a***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 6: COMPLETE_SAFE · o***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 7: COMPLETE_SAFE · m***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 8: COMPLETE_SAFE · o***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 9: COMPLETE_SAFE · b***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 10: COMPLETE_SAFE · k***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 11: COMPLETE_SAFE · b***@y*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 12: COMPLETE_SAFE · m***@y*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 13: COMPLETE_SAFE · b***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 14: COMPLETE_SAFE · a***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 15: COMPLETE_SAFE · o***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 16: COMPLETE_SAFE · o***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 17: COMPLETE_SAFE · t***@j*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 18: COMPLETE_SAFE · a***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE
- row 19: COMPLETE_SAFE · a***@g*** · auth=true member=true profile=true provenance=true ver=NOT_REVIEWED vis=PRIVATE

## Notes
- Pre-existing/non-historical application users (outside Phase 18 historical set)=1
-   · p***@e*** createdAt=2026-09-10T19:42:06.737Z hasProfile=false legacyImport=null

## Production mutation statement
```text
Production mutations performed by this reconciliation: 0
```
