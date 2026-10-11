# Phase 8 — Profile Completion Security Closeout

**Status:** PASS / CLOSED / LOCKED  
**Date:** 2026-10-11 (status-sync remediation)  
**Baseline entry:** `08c5ffe`  
**Scope:** Authenticated professional-record completion. No Phase 9.

## 1. Baseline architecture

| Area | Authority |
|------|-----------|
| Routes | `/dashboard`, `/profile`, `/profile/edit` |
| Canonical completion % | `calculateProfileCompletion` (pure, weighted sections) |
| Completeness enum | `deriveProfileCompletenessStatus` → `REGISTERED`/`INCOMPLETE`/`COMPLETE` on member save |
| Persistence | `updateOwnMemberProfile` + Zod `profileEditSchema` whitelist |
| Authz | Session identity; `claimedUserId` / `?userId=` IDOR → 403 |
| Business M:N | Read-only links in Phase 8; create/link deferred |
| Contact | Email not editable; phone member-private; no public exposure |
| Separation | Save never writes verification, visibility, Spotlight, EXCO, headshot key |

## 2. Canonical completion rule

1. Join leaves `profile_status = REGISTERED`.
2. After a member profile save:
   - derived completion **&lt; 100%** → `INCOMPLETE`
   - derived completion **= 100%** → `COMPLETE`
3. Removing required data after COMPLETE → `INCOMPLETE`.
4. `SUBMITTED` is **preserved** (Phase 12 verification submission owns it).
5. Optional fields / headshot (deferred) do not incorrectly control completeness beyond the locked denominator rules.
6. COMPLETE ≠ VERIFIED ≠ DIRECTORY ≠ published.

## 3. Remediation in this pass

- Server writes computed `profile_status` on save from derived %.
- Client cannot mass-assign `profileStatus` / verification / visibility.
- Unit coverage for REGISTERED→INCOMPLETE, INCOMPLETE↔COMPLETE, SUBMITTED preserve, IDOR, whitespace reject.

## 4. Verification

- Profile unit + update ownership tests
- Phase 6 privacy + Phase 7 auth regressions
- typecheck / lint / build
- Production read-only smoke after merge

## 5. Closure

**PHASE 8: PASS / CLOSED / LOCKED**

Do not begin Phase 9 under this authorization.
