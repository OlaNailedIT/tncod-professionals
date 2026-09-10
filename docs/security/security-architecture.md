# Security architecture — TNCOD Professionals

**Phase:** 3 — Privacy, permissions and security **contract**  
**Status:** Architecture documented. RLS/Storage SQL designed, **not applied**. No live database.  
**Phase 2:** Schema **contract** exists; **database not migrated / not production-approved.**

Frontend checks are UX only. Default is **deny**. Identity comes from **Supabase Auth** (`auth.uid()`), never from the request body.

LEGAL REVIEW REQUIRED for PIPEDA/GDPR/POPIA/NDPA claims. This document is **technical** privacy control, not legal compliance.

---

## 1. Principles

1. Do not trust the frontend.  
2. Deny by default; grant narrowly.  
3. Parent-record access ≠ child/sensitive-field access.  
4. Do not trust client-supplied `userId` / `role`.  
5. Service-role keys: server-only, never `NEXT_PUBLIC_*`.  
6. Do not bypass RLS by using service role everywhere.  
7. `profile_status` ≠ `verification_status` ≠ `visibility_status`.  
8. DIRECTORY requires VERIFIED (Phase 2). Standard unpublish → MEMBERS_ONLY; admin hide → PRIVATE.

---

## 2. Trust boundaries

| Boundary | Trust |
| --- | --- |
| Browser | Untrusted |
| Next.js client | Untrusted for authorization |
| Next.js server / Route Handlers | Trusted **after** Auth JWT verification |
| Supabase Auth | Trusted identity (`auth.users.id`) |
| Postgres with user JWT + RLS | Enforces row access for that connection |
| Prisma + privileged `DATABASE_URL` | **Bypasses RLS** unless using a restricted role — **must re-authorize in domain layer** (Phase 4 critical) |
| Service role | Unrestricted DB; server-only, audited, minimized |

```text
INTERNET → SUPABASE AUTH → AUTHENTICATED ID
        → APPLICATION/API → RBAC + DOMAIN RULES
        → POSTGRESQL → RLS (when using authenticated role)
        → DOMAIN DATA / AUDIT

DOCUMENTS: AUTH → AUTHORIZE → PRIVATE STORAGE → SHORT-LIVED URL
```

---

## 3. Authentication model

Passwordless (magic link / OTP) per Phase 0. Mechanism: **Supabase Auth** (Phase 4/7).

```text
auth.users.id  =  public.users.id  →  profiles.user_id
```

Sync: **database trigger** (Phase 4). Must not assign EXCO_ADMIN / SUPER_ADMIN from user metadata. Browser must not insert arbitrary `users` rows.

**JWT:** Do **not** treat client-stored roles as authorization. V1 recommendation: **database-backed permission checks** (and RLS helpers reading `user_roles`). If claims are added later: issued only by Auth hooks; refresh/revocation documented; never writable from the browser.

**Sessions:** Supabase session/refresh. Logout invalidates session. SUSPENDED / DEACTIVATED: reject application actions (Auth + `users.account_status` check). Password reset / email verification: Auth-owned. CSRF: document for cookie vs Bearer (Phase 4 stack). Rate limits: TBD — environment/traffic validation for sign-in, register, upload, search.

**Account lifecycle:** ACTIVE — normal. SUSPENDED — no normal app actions; history kept. DEACTIVATED — no use; do not cascade-delete audit, verification, consents.

---

## 4. Authorization model

```text
Authentication → Identity → Roles (N:M, additive) → Permissions
  → Resource ownership → Classification → RLS + domain rules → Audit
```

Roles: `MEMBER` · `EXCO_VIEWER` · `EXCO_ADMIN` · `SUPER_ADMIN`.

Permission keys live in `permissions.key` (Phase 2). Application constants: `src/security/permissions.ts` (catalogue only).

**Privileged fields** (member owns the row, not these columns): `verification_status`; `visibility_status = DIRECTORY` (unpublish/hide also administrative). Member **may** set visibility preference `PRIVATE` | `MEMBERS_ONLY`. Business `business_status` / business `visibility_status` are administrative. Enforce with **domain commands** (`submitProfile`, `verifyProfile`, `requestClarification`, `rejectProfile`, `publishProfile`, `unpublishProfile`, `hideProfile`) + column triggers — **not** generic `PATCH /profiles/:id`.

`assertTrustedUserId` only proves the caller matches `auth.uid()`. It does **not** authorize a resource (SEC-001).

## 5a. Security invariants

| ID | Invariant |
| --- | --- |
| SEC-001 | Access requires ownership and/or permission — not UUID possession. |
| SEC-002 | Client-supplied `user_id` never grants authority. |
| SEC-003 | Client-supplied role never grants authority. |
| SEC-004 | MEMBER cannot assign EXCO_VIEWER / EXCO_ADMIN / SUPER_ADMIN. |
| SEC-005 | EXCO_VIEWER cannot perform EXCO_ADMIN mutations. |
| SEC-006 | EXCO_ADMIN cannot manage privileged roles or system configuration. |
| SEC-007 | Anonymous users cannot access private profile data. |
| SEC-008 | Anonymous users cannot access documents or storage objects. |
| SEC-009 | Directory results are `PublicProfessional` only. |
| SEC-010 | DIRECTORY requires VERIFIED. |
| SEC-011 | Members cannot directly mutate `verification_status`. |
| SEC-012 | Members cannot mutate `admin_notes`. |
| SEC-013 | Members cannot mutate `audit_logs`. |
| SEC-014 | Document objects live in a private bucket. |
| SEC-015 | `storage_key` is not directory/public API data. |
| SEC-016 | Prisma privileged connections require domain authorization (RLS is not sufficient). |
| SEC-017 | EXCO_VIEWER policies are SELECT (or equivalent); no accidental INSERT/UPDATE/DELETE. |
| SEC-018 | Privileged actions remain auditable, including SUPER_ADMIN. |
| SEC-019 | Auth user metadata cannot self-assign privileged roles. |
| SEC-020 | Business access follows `business_professionals`, not `businesses.profile_id`. |

Layers: Authentication → domain authorization → RLS → Storage policies → audit. No layer replaces the others.

LEGAL REVIEW REQUIRED for retention, lawful basis, and consent wording (OPEN).

---

## 5. Ownership

```text
auth.uid() → users.id → profiles.user_id → child rows
business_professionals: profile associated, not exclusive owner
```

Never: client sends `profile_id` and DB trusts it without `profiles.user_id = auth.uid()` (or EXCO permission).

UUIDs are not authorization.

---

## 6. RLS vs domain

| Layer | Protects |
| --- | --- |
| RLS | Which **rows** an authenticated DB role can see/change |
| Domain | Legal **transitions**, privileged **columns**, transactions (verify/publish + history + audit + notify) |
| API projections | Which **fields** leave the server (`SELECT *` forbidden for sensitive responses) |

Both required. Prisma privileged connection ≠ RLS.

---

## 7. Storage

Private bucket. Path: `documents/{user_id}/{document_id}`. Short-lived signed URLs after authorize. EXCO: no product download action; in-app view only. Browser copying remains possible. See `storage-security.md`.

---

## 8. API security

No generic unrestricted `PATCH /profiles/:id`. Domain commands for submit, verify, publish, unpublish, hide. Projections in `src/security/projections.ts`. Search uses the same visibility filter as GET. See `api-security-contract.md`.

Input validation is server-side (type, length, ownership, transition). HTML/Zod-on-client is UX only. URLs (`linkedin_url`, `website_url`): allow `https:` only. User text is plain text, not HTML (XSS). SQL via Prisma parameterized APIs; raw SQL must be parameterized.

Rate limits: TBD — environment/traffic validation for sign-in, register, upload, search, verification.

## 9. Storage security

See `storage-security.md` and `supabase/policies/30-storage.sql`. Private bucket; ownership path; signed URLs; no public CVs.

## 10. Sensitive data controls

| Data | Enters | Stored | Query | Modify | Delete | Expose | Audit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Email | Auth + users | `users.email` | Own; EXCO_ADMIN+ | Own limited / Super | Soft with account | Never directory | Role/account changes |
| Phone | Member | `users.phone` | Own; EXCO_ADMIN+ | Own | Policy | Never directory | If changed |
| CV / certificates / CAC | Upload | Private Storage + `documents` | Own; `document.review` view | Own metadata; admin status | Retention OPEN | Signed URL only | DOCUMENT_* |
| Church `service_area` | Member | `church_information` | Own; EXCO_ADMIN need-based | Own | Own | Never directory | If required |
| Verification notes | EXCO_ADMIN | `verification_records.notes` | Admin+ | Append-only | Never | Never public/member APIs | VERIFICATION_* |
| Admin notes | EXCO_ADMIN | `admin_notes` | Admin+ | Admin | Admin | Admin endpoints only | Optional |
| Consents | Member grant/withdraw | `consents` history | Own; authorized admin | Withdraw only | Never ordinary | Never public | CONSENT_* |
| Audit logs | System | `audit_logs` | `audit.view` | Never | Never | Admin/Super | N/A |

## 11. Audit architecture

Append-only. Actor SET NULL. Events: PROFILE_SUBMITTED/UPDATED/PUBLISHED/UNPUBLISHED, VERIFICATION_*, BUSINESS_APPROVED/REJECTED, USER_SUSPENDED/DEACTIVATED, ROLE_CHANGED, PERMISSION_CHANGED, DOCUMENT_*, CONSENT_*. No passwords, tokens, or keys in metadata. Application logs ≠ audit logs.

## 12. Session security

Supabase Auth expiry/refresh/logout. SUSPENDED/DEACTIVATED fail application actions. Passwordless: no app password column. CSRF depends on cookie vs Bearer (Phase 4).

## 13. Threat model summary

P0: IDOR, privilege escalation, Prisma RLS bypass, document leakage, search leakage, service-role in browser. See `threat-model.md`.

## 14. Security testing strategy

Negative tests mandatory (`security-test-plan.md`, `src/security/security-test-cases.ts`). **NOT RUN** (no database, no API).

## 15. Open risks

- Prisma bypass of RLS if misconfigured in Phase 4 (**P0** until dual-client design is implemented).  
- Public directory scraping of approved PII (**P2**, minimize fields).  
- Enumeration via register/sign-in (**P2**, generic errors).  
- No malware scanning in V1 (**P2**, document strategy).  
- Phase 2 schema not migrated — policies cannot be tested on Postgres (**BLOCKED on DB gate**).  
- `businesses` INSERT policy is account-active only; **domain must** create `business_professionals` in the same transaction (orphan-business residual).
