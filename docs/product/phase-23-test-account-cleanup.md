# Phase 23 — Test account cleanup + auth entry / terminology remediation

**Date:** 2026-09-16  
**Authorization:** Explicit Phase 23 Controlled Pilot remediation (two workstreams)  
**Status:** `PASS`

---

## Purpose

1. **Workstream A** — Remove seven authorized Production test registrations from active product data.  
2. **Workstream B** — Correct member-facing authentication entry copy and Area of Service terminology without changing Auth or privacy architecture.

---

## Authorization

```text
Explicit Production cleanup authorization: YES
Scope: exactly seven UUIDs
Bulk / name-based / pattern-based deletion: NO
Auth redesign: NO
Schema / RLS / RBAC changes: NO
```

---

## Governance

```text
PHASE 5–13 / 18–22 / 23A / 23B — LOCKED (unchanged)
PHASE 23 — CONTROLLED PILOT — AUTHORIZED / IN PROGRESS
PHASE 24+ — NOT AUTHORIZED
```

---

## Seven authorized UUIDs

| Profile UUID | Expected display name |
| --- | --- |
| `e71d27c9-c168-4b32-808f-f986a90dacdd` | ranee olu |
| `a147247a-05bc-4896-af2b-590beab77a34` | P205 UI 1789354274630 |
| `4015fff5-80c2-4cfa-aed0-24f91f371ad2` | test prof |
| `f1c104d2-5f5f-42a4-94e1-3f1712b60183` | test prof |
| `f49974b6-db55-4797-89e5-3f69695621f6` | test prof 3 |
| `c8f277a6-7702-437e-a1c3-dc7409530dc0` | test prof2 |
| `bba19b7a-f369-4bda-91e0-06de3f346827` | P205 Test 1789353899010 |

---

## Pre-delete verification

(Executed 2026-09-16 prior pass; reconfirmed post-state this pass.)

| Check | Result |
| --- | --- |
| Name match | YES (all seven) |
| `legacy_import` | `false` |
| Directory-eligible | NO |
| Business / opportunity / documents | 0 |
| Auth email match | YES (at deletion time) |
| Owner / Phase 18 sample | Intact |

Safety gate: **PASS**.

---

## Dependency analysis

Authoritative semantic: **soft-delete via `deleted_at`** (Phase 18 orphan convention). Hard DELETE avoided (`ON DELETE RESTRICT` on many FKs).

```text
profiles.deleted_at + users.deleted_at
→ then auth.admin.deleteUser(exact linked Auth id)
```

Audit history not rewritten. Child rows under soft-deleted profiles retained but excluded from active reads.

---

## Deletion result

```text
Removed: 7 (prior authorized execute)
Already absent: 7 (this-pass reconfirm)
Blocked: 0
Unexpected: 0
```

Post-check (this pass): all seven `profile_deleted=true`, `user_deleted=true`, `auth_exists=false`, `active_product=false`.  
`LEGACY_ACTIVE_COUNT=18`. Owner intact.

---

## Auth cleanup

```text
Target Auth identities: deleted (7)
Owner Auth: intact
OTP / SMTP / signInWithOtp architecture: unchanged
```

---

## Authentication CTA correction

```text
Join the Professionals community → Sign In
```

Homepage primary entry CTAs now:

```text
Sign In → /sign-in
Join → /join (registration preserved)
```

`/join` registration heading remains “Join the Professionals community”.  
Sign-in page “New here?” link still points to `/join`.  
Nav retains Join + Sign in. Auth runtime unchanged.

---

## Terminology correction

```text
Community Information → Area of Service in TNCOD
```

Member-facing surfaces updated (profile edit, completion overview, privacy group label, EXCO record section/field labels).  
Internal identifiers preserved (`community` preference key, `serviceArea`, `church_information.service_area`).  
Privacy: still **PRIVATE ONLY** (`fixed_private`). Not made public / directory / searchable.

---

## Regression results

```text
TypeScript: PASS
ESLint (changed files): PASS
Unit (completion + visibility): PASS
Public smoke: / /join /sign-in /professionals → 200
EXCO anon: /exco/professionals → 307 sign-in
Deleted targets: not active; Auth gone
Directory: /professionals 200
Security architecture: unchanged
```

---

## Security results

```text
RLS: NO change
RBAC: NO change
Auth architecture: NO change
Directory projection: NO change
Storage policy: NO change
Privacy enforcement: Area of Service remains private-only
```

---

## Production impact

```text
Production application deployment: YES (`dpl_6AnbcsPwoCZzDkR5JwaGCsHH4L3g` → azure)
Production data mutation: YES — seven explicitly authorized test records only (prior execute; this pass confirm)
Database schema: NO
RLS: NO
RBAC: NO
Auth architecture: NO
Auth provider: NO
SMTP: NO
Storage policy: NO
Phase 13: NO
Phase 20.5 architecture: NO
Phase 21 security architecture: NO
Phase 22: NO
Phase 23B architecture: NO (copy/entry only)
```

---

## Killcritic

| ID | Result |
| --- | --- |
| K-001 Wrong UUID | PASS |
| K-002 Name collision | PASS (UUID authoritative) |
| K-003 Pilot participant | PASS |
| K-004 Phase 18 | PASS (`legacy_import=false`; 18 legacy active) |
| K-005 Auth mismatch | PASS |
| K-006 Shared business | PASS (0) |
| K-007 Orphaned Auth | PASS |
| K-008 Orphaned app data | PASS (soft-deleted first) |
| K-009 Broad deletion | PASS |
| K-010 Auth regression | PASS (CTA → `/sign-in` only) |
| K-011 Registration regression | PASS (`/join` remains) |
| K-012 Terminology leakage | PASS (labels only; keys/columns unchanged) |
| K-013 Privacy regression | PASS (still fixed private) |
| K-014 Phase 13 | PASS |

---

## Residual findings

- Soft-deleted rows remain in DB by design.  
- No additional test-looking accounts deleted under this authorization.  
- Homepage primary entry is Sign In; Join remains explicit secondary/nav path.

---

## Files touched (this remediation)

```text
docs/product/phase-23-test-account-cleanup.md
src/app/page.tsx
src/features/profile/profile-edit-form.tsx
src/features/profile/completion.ts
src/features/profile/profile-completion-overview.tsx
src/features/visibility/groups.ts
src/features/visibility/own-preferences.ts
src/app/exco/professionals/[id]/page.tsx
e2e/smoke.spec.ts
e2e/phase-23b-experience.spec.ts
e2e/phase-6-registration-browser-evidence.spec.ts
e2e/phase-8-profile-completion.spec.ts
scripts/phase23-test-account-cleanup-preflight.cjs
scripts/phase23-test-account-cleanup-verify.cjs
```
