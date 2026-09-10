# Phase 18 — Production preflight (masked)

Status: **PHASE 18 — PRODUCTION PREFLIGHT BLOCKED — READ-ONLY ACCESS UNAVAILABLE**
Generated: 2026-09-09T19:14:54.984Z
Production access: UNAVAILABLE
Blocker: PRODUCTION PREFLIGHT BLOCKED — READ-ONLY ACCESS UNAVAILABLE (no PRODUCTION_DATABASE_URL / PHASE18_PRODUCTION_DATABASE_URL)

## Actual production mutations

```text
0
```

## Auth strategy (code-reviewed)

- Can profile exist without Auth: **false**
- Auth structurally required: **true**
- Existing onboarding: Passwordless /join + /sign-in OTP (signInWithOtp); no invite/claim tables or routes
- Existing claim mechanism: NONE
- Recommended: AUTH_FIRST_AT_AUTHORIZED_IMPORT_SAME_AS_JOIN — create Auth+user+profile only when PRODUCTION IMPORT authorized; ownership via email-bound Auth OTP; MATCH_EXISTING → GAP_ONLY never overwrite; do not create orphan profiles; do not send OTP at import unless separately authorized

## Accounting

- CREATE: 0
- MATCH_EXISTING: 0
- GAP_ONLY: 0
- MANUAL_REVIEW: 18
- CONFLICT: 0
- SKIP: 0
- TOTAL: 18 (must be 18) → OK

## Business candidates
- 6 → MANUAL_REVIEW: 6

## Rows
- row 2: MANUAL_REVIEW / MANUAL_REVIEW — M*** m***@g*** business=N/A
- row 3: MANUAL_REVIEW / MANUAL_REVIEW — O*** O*** o***@g*** business=MANUAL_REVIEW
- row 4: MANUAL_REVIEW / MANUAL_REVIEW — M*** m***@g*** business=N/A
- row 5: MANUAL_REVIEW / MANUAL_REVIEW — O*** O*** I*** a***@g*** business=N/A
- row 6: MANUAL_REVIEW / MANUAL_REVIEW — G*** o***@g*** business=N/A
- row 7: MANUAL_REVIEW / MANUAL_REVIEW — K*** m***@g*** business=MANUAL_REVIEW
- row 8: MANUAL_REVIEW / MANUAL_REVIEW — O*** o***@g*** business=MANUAL_REVIEW
- row 9: MANUAL_REVIEW / MANUAL_REVIEW — D*** b***@g*** business=N/A
- row 10: MANUAL_REVIEW / MANUAL_REVIEW — C*** k***@g*** business=MANUAL_REVIEW
- row 11: MANUAL_REVIEW / MANUAL_REVIEW — A*** b***@y*** business=N/A
- row 12: MANUAL_REVIEW / MANUAL_REVIEW — M*** m***@y*** business=N/A
- row 13: MANUAL_REVIEW / MANUAL_REVIEW — B*** B*** S*** b***@g*** business=N/A
- row 14: MANUAL_REVIEW / MANUAL_REVIEW — A*** a***@g*** business=N/A
- row 15: MANUAL_REVIEW / MANUAL_REVIEW — O*** U*** o***@g*** business=N/A
- row 16: MANUAL_REVIEW / MANUAL_REVIEW — C*** o***@g*** business=N/A
- row 17: MANUAL_REVIEW / MANUAL_REVIEW — T*** t***@j*** business=MANUAL_REVIEW
- row 18: MANUAL_REVIEW / MANUAL_REVIEW — M*** a***@g*** business=N/A
- row 19: MANUAL_REVIEW / MANUAL_REVIEW — A*** A*** F*** a***@g*** business=MANUAL_REVIEW