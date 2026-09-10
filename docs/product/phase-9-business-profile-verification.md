# Phase 9 — Business Profile & Verification

**Status:** PASS / COMPLETE / VERIFIED / LOCKED (local disposable Supabase)

**Authority date:** 2026-09-08

Evidence:
- Unit: business schema + verification transitions
- DB closeout: `scripts/phase9-db-closeout.ts` → `PHASE9_DB_CLOSEOUT_PASS`
- Playwright: `e2e/phase-9-closeout-evidence.spec.ts` → 1 passed (create, persist, documents/storage, submit, IDOR, EXCO verify, clarification, resubmit, no professional side effects)

## Distinctions (non-negotiable)

| Concept | Field / model | Independent of |
| --- | --- | --- |
| Professional profile | `profiles` + `professional_details` | Business rows |
| Business profile | `businesses` | Professional verification |
| Business–professional relationship | `business_professionals` (M:N) | Platform roles |
| Business verification | `businesses.business_status` | Professional `verification_status` |
| Professional verification | `profiles.verification_status` | Business verification |
| Directory publication | `visibility_status` / publications | Verification alone |

**Business verification ≠ professional verification ≠ directory publication.**

There is **no** `businesses.profile_id`. Association is only via `business_professionals`.

## Domain model

### Business fields (mapped)

| Requirement | DB representation |
| --- | --- |
| Business name | `businesses.name` |
| Category | `businesses.industry_id` → `industries` |
| Description / company profile | `businesses.description` |
| Location | `businesses.location` |
| Phone / email / website | `businesses.phone`, `email`, `website_url` |
| Social links | `businesses.social_links` JSONB (`linkedin`, `twitter`, `facebook`, `instagram`) |
| Services | `businesses.services_offered` TEXT[] (≠ `profile_services`) |
| CAC registered? | `businesses.cac_registered` (member claim; not auto-verify) |
| CAC number | `businesses.cac_number` (unique when present + not deleted) |
| Clarification (member-facing) | `businesses.clarification_message` |
| Credentials / CAC document | `documents` + private Storage (`BUSINESS_REGISTRATION`, `PROFESSIONAL_CERTIFICATE`, `OTHER`) |

### Relationship roles

`BusinessProfessionalRelationship`: OWNER | DIRECTOR | EMPLOYEE | PARTNER | REPRESENTATIVE.

Relationship ≠ EXCO privilege ≠ verification permission.

## Verification lifecycle

Canonical DB enum `BusinessStatus` (member-facing labels):

| DB | Member label |
| --- | --- |
| DRAFT | Not submitted |
| SUBMITTED | Pending |
| PENDING_REVIEW | Under review |
| APPROVED | Verified |
| NEEDS_CLARIFICATION | Needs clarification |
| REJECTED | Rejected |
| SUSPENDED | Suspended |

### Allowed transitions

**Member (associated only):**

- DRAFT | NEEDS_CLARIFICATION | REJECTED → SUBMITTED (submit/resubmit)
- Cannot set APPROVED, PENDING_REVIEW, REJECTED, UNDER_REVIEW equivalents as EXCO

**EXCO (`business.verify`):**

- SUBMITTED → PENDING_REVIEW (start_review)
- SUBMITTED | PENDING_REVIEW → APPROVED | NEEDS_CLARIFICATION | REJECTED

Client cannot force status via PATCH of `businessStatus`.

Privileged column guard updated so JWT members may only perform the submit transition; Prisma/`auth.uid() IS NULL` path relies on **mandatory domain authorization**.

## Document / storage architecture

- Bucket: `member-documents` (private)
- Path: `documents/{auth.uid()}/{document_id}` — **server-constructed only**
- Metadata in `documents`; bytes in Storage
- Access: owner or `document.review` via short-lived signed URL (`/api/member/documents/[id]/signed-url`, `/api/exco/documents/[id]/signed-url`)
- Validation: size ≤ 10MB; sniffed PDF/PNG/JPEG; extension match; no SSRF previews

## Routes

**Member:** `/businesses`, `/businesses/new`, `/businesses/[id]`, `/businesses/[id]/edit`, `/businesses/[id]/verification`

**EXCO:** `/exco/businesses`, `/exco/businesses/[id]`

No `/admin`. No marketplace/discovery.

## Authorization

- Association: `business_professionals` server-checked
- EXCO view: `business.view`; decide: `business.verify`; docs: `document.review`
- Never trust client `user_id` / `business_id` / role / status
- Identity claims rejected via `rejectClientIdentity`

## Audit

`audit_logs` on create/update/submit/document upload/EXCO decisions.

`verification_records` on EXCO decisions (append-only).

`admin_notes` for internal notes (not member-visible).

Member-facing reasons use `clarification_message`.

## RLS / migration

Migration: `supabase/migrations/20260908140000_phase9_business_verification.sql`

- Adds `NEEDS_CLARIFICATION`, social/services/CAC/clarification columns
- Updates `guard_business_privileged_columns`
- EXCO_VIEWER select for review queue statuses
- Partial unique index on `cac_number`

Prisma is **not** migration authority (`prisma generate` only).

## Phase 8 integrity

Phase 8 completion algorithm **unchanged**. Profile Business section links to `/businesses` only.

## Tests / evidence

- Unit: `verification-status.test.ts`, `business-schema.test.ts`
- DB closeout: `scripts/phase9-db-closeout.ts` → `PHASE9_DB_CLOSEOUT_PASS`
- Playwright: `e2e/phase-9-closeout-evidence.spec.ts`

## Deferred scope

- Public business directory / discovery
- CAC API / external validation
- Business messaging / notifications
- Multi-member invitation UX beyond creator link
- Image transformation / SVG rendering of uploads
- EXCO professionals / directory / reports product surfaces (nav only)

## Known limitations

- Local Storage may require `supabase start --ignore-health-check` when analytics/realtime are flaky
- Signed URLs are short-lived (60s); no permanent private URLs
- Duplicate business names allowed; CAC uniqueness only when CAC supplied
- **P3 (environment):** Local Auth email OTP **send** can time out under load on disposable Supabase. Phase 9 application evidence used `AUTH_E2E_HELPER=1` (skip send + admin `generateLink` OTP). This does **not** invalidate Phase 9 product lock; treat as infra limitation for future EXCO/browser gates.

## Security assumptions

- Prisma `DATABASE_URL` bypasses RLS; domain authz is mandatory
- Service role used only server-side for Storage after domain checks
- Uploaded files treated as untrusted; not rendered as active HTML/SVG
