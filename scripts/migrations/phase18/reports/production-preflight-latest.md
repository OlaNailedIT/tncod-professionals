# Phase 18 — Production preflight (masked)

Status: **PHASE 18 — PRODUCTION PREFLIGHT PASS**
Generated: 2026-09-10T18:16:01.348Z
Production access: READ_ONLY_OK

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

- CREATE: 18
- MATCH_EXISTING: 0
- GAP_ONLY: 0
- MANUAL_REVIEW: 0
- CONFLICT: 0
- SKIP: 0
- TOTAL: 18 (must be 18) → OK

## Business candidates
- 6 → MANUAL_REVIEW: 6

## Rows
- row 2: CREATE / NEW_MEMBER — M*** m***@g*** business=N/A
- row 3: CREATE / NEW_MEMBER — O*** O*** o***@g*** business=MANUAL_REVIEW
- row 4: CREATE / NEW_MEMBER — M*** m***@g*** business=N/A
- row 5: CREATE / NEW_MEMBER — O*** O*** I*** a***@g*** business=N/A
- row 6: CREATE / NEW_MEMBER — G*** o***@g*** business=N/A
- row 7: CREATE / NEW_MEMBER — K*** m***@g*** business=MANUAL_REVIEW
- row 8: CREATE / NEW_MEMBER — O*** o***@g*** business=MANUAL_REVIEW
- row 9: CREATE / NEW_MEMBER — D*** b***@g*** business=N/A
- row 10: CREATE / NEW_MEMBER — C*** k***@g*** business=MANUAL_REVIEW
- row 11: CREATE / NEW_MEMBER — A*** b***@y*** business=N/A
- row 12: CREATE / NEW_MEMBER — M*** m***@y*** business=N/A
- row 13: CREATE / NEW_MEMBER — B*** B*** S*** b***@g*** business=N/A
- row 14: CREATE / NEW_MEMBER — A*** a***@g*** business=N/A
- row 15: CREATE / NEW_MEMBER — O*** U*** o***@g*** business=N/A
- row 16: CREATE / NEW_MEMBER — C*** o***@g*** business=N/A
- row 17: CREATE / NEW_MEMBER — T*** t***@j*** business=MANUAL_REVIEW
- row 18: CREATE / NEW_MEMBER — M*** a***@g*** business=N/A
- row 19: CREATE / NEW_MEMBER — A*** A*** F*** a***@g*** business=MANUAL_REVIEW