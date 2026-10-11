# Phase 8 — Profile Completion Security Closeout

**Status:** PASS / CLOSED / LOCKED  
**Date:** 2026-10-11  
**Baseline:** `ef4a100` (post Phase 7 security closeout)  
**Scope:** Security-programme verification/harden of locked Phase 8. No Phase 9.

## 1. Baseline implementation map

| Area | Authority |
|------|-----------|
| Routes | `/profile` overview, `/profile/edit` editor, `/dashboard` status + CTA |
| Canonical completion | Derived `%` via `calculateProfileCompletion` (`completion.ts`) — pure, server-recomputed on read |
| Persistence | `updateOwnMemberProfile` + Zod `profileEditSchema` whitelist |
| Authz | `requireMemberPage` + session identity; `claimedUserId` / `?userId=` IDOR → 403 |
| Business M:N | Read-only links in Phase 8; no collapse to single company field; create/link deferred |
| Contact privacy | Email not editable; phone member-private; save never sets DIRECTORY / public projection |
| Status separation | Save never writes `profile_status`, `verification_status`, `visibility_status`, headshot key |

### Locked completion vs `ProfileStatus` enum

Locked Phase 8 (product + code): completion is **informational %**. It does **not** rewrite `profiles.profile_status`.

- Join → `REGISTERED`
- Member edits → derived % rises/falls; enum unchanged by Phase 8 save
- Phase 12 `submitProfile` (100% gate) → `SUBMITTED` / verification `PENDING` — out of Phase 8 scope
- Legacy import may seed `INCOMPLETE`

Security acceptance “COMPLETE when mandatory data present” is satisfied by **derived 100%**, not by inventing a new enum auto-writer that would reopen the locked Phase 8 contract.

## 2. Hardening in this closeout

1. Dashboard shows independent **Completion: N%** badge + clear incomplete/complete messaging (does not imply verified/published).
2. Unit coverage for mass-assignment strip, horizontal `claimedUserId` deny, and status-column immutability on save.

## 3. Verification targets

- Profile unit: `completion.test.ts` + `own-profile.update.test.ts`
- Existing e2e: `phase-8-profile-completion.spec.ts`, `phase-8-closeout-evidence.spec.ts` (local disposable when available)
- Phase 6 privacy / Phase 7 auth remain on main (prior locks)
- Static: typecheck, lint, build

## 4. Production-safe plan

Read-only: `/sign-in`, unauth `/profile` + `/profile/edit` redirect, `/dashboard` protection.  
No Production member mutations unless using an authorised test account (not required for this docs/harden gate).

## 5. Closure

**PHASE 8: PASS / CLOSED / LOCKED**

Do not begin Phase 9 under this authorization.
