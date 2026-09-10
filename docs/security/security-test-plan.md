# Security test plan

**Status:** DEFINED. Database Gate SQL **EXECUTED**. Storage **HTTP** **EXECUTED** in Phase 4 (local). Auth UI / API product tests **NOT EXECUTED**.

Negative tests are mandatory. Seed identities: MEMBER A (`incomplete.private` / `verified.members`), MEMBER B (`coowner.two`), EXCO_VIEWER, EXCO_ADMIN, SUPER_ADMIN; private / members-only / directory / pending / rejected; documents A/B; notes A/B; businesses A/B.

## A. Schema / integrity

CHECK `profiles_directory_requires_verified`. XOR FKs. **NOT RUN** (`prisma/sql/integrity-probes.sql`).

## B. RLS

Viewer DELETE/UPDATE/INSERT on member-owned tables → DENIED. Anon SELECT on `profiles` → DENIED. Anon SELECT directory fn → listed rows only. Member A SELECT member B private → empty. Viewer SELECT `users` emails → DENIED. Viewer SELECT `admin_notes` → DENIED.

## C. Authorization / API

Client role / `user_id` spoof → DENIED. Member verify/publish/role assign → DENIED. Viewer verify/publish/spotlight → DENIED. Admin `user.manage_roles` / `configuration.manage` → DENIED.

## D. Storage

Anon object GET → DENIED. Member A path under member B uid → DENIED. Reviewer without `document.review` → DENIED.

## E. Authentication

Anon / expired / SUSPENDED / DEACTIVATED → 401/403.

## F. Privacy / projection

Anon must not receive email, phone, CV, `storage_key`, church, verification notes, admin notes. Search ≡ GET filters.

## G. Negative / workflow

Member sets `verification_status` or DIRECTORY → DENIED. Illegal admin transition PENDING→VERIFIED skip UNDER_REVIEW → DENIED.

Catalogue: `src/security/security-test-cases.ts`.

Success of an authorized request is **not** sufficient evidence.
