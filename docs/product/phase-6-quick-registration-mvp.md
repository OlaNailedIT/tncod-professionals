# Phase 6 — Quick Registration MVP

**Status:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Date:** 2026-09-07  
**Depends on:** Phase 5 **FORMALLY CLOSED**

Phase 7 and unrelated product modules are **not** authorized by this document.

---

## 1. Objective

Deliver a functional Quick Registration MVP:

```text
/ → /join → validation → anti-spam → passwordless Auth identity → database record → /join/success
```

Primary KPI (**instrumented, not empirically proven**): median completion ≤ 60 seconds.

---

## 2. Route architecture

| Route | Role |
| --- | --- |
| `/` | Focused landing + CTA |
| `/join` | Canonical registration |
| `/join/success` | Confirmation (no verification/directory promises) |
| `/register` → `/join` | Compatibility redirect (preserves locked IA path) |
| `/sign-in` | Minimal placeholder (full passwordless UX = Phase 7) |

Canonical journey: `/` → `/join` → `/join/success`.

---

## 3. Registration data model (existing Phase 2 schema)

| Form field | Storage |
| --- | --- |
| Full name | `profiles.display_name` |
| Phone / WhatsApp | `users.phone` (normalized canonical digits) |
| Email | `users.email` + Auth email |
| Professional status | `profiles.professional_situation` |
| Profession / expertise | `professional_details.profession` |
| Organisation (optional) | `professional_details.organisation_name` |
| Looking for | `professional_details.looking_for_summary` |
| Offering | `professional_details.offering_summary` |

Initial statuses (defaults preserved):

- `profile_status = REGISTERED`
- `verification_status = NOT_REVIEWED`
- `visibility_status = PRIVATE`
- Role: `MEMBER` only

Migration added: `20260907190000_users_phone_unique.sql` — unique index on non-null `users.phone`.

---

## 4. Authentication model

- **No passwords.**
- Server uses Supabase Auth **Admin `createUser`** (email confirmed for local disposable) + `signInWithOtp` for later passwordless access.
- Auth trigger / upsert ensures `public.users.id = auth.users.id`.
- Client never receives service-role credentials.
- No client-controlled role / verification / visibility.

### Forensic clarification — Auth / session lifecycle (post–Killcritic review)

Phase 6 guarantees:

```text
REGISTERED USER (profile + professional_details)
+ AUTH IDENTITY (auth.users / public.users)
+ ACCESS PATH INITIATED (OTP/magic-link email send attempted)
```

Phase 6 does **not** guarantee:

```text
Authenticated browser session on /join/success
```

Exact `/join` transaction:

1. Validate + anti-spam + duplicate checks  
2. `admin.auth.admin.createUser({ email, email_confirm: true, … })` — creates Auth identity  
3. Upsert `public.users` (email + **normalized** phone) + MEMBER role  
4. Create `profiles` + `professional_details` with safe defaults  
5. Best-effort `admin.auth.signInWithOtp({ email, shouldCreateUser: false })` — sends access email; **failure does not roll back registration**  
6. Client navigates to `/join/success` — **no session cookies are set by this flow**

Therefore after success the person has a registered record and Auth identity, and (when email delivery works) an inbox path to authenticate later. Full sign-in UX remains **Phase 7**. `/sign-in` is an explicit placeholder, not a second Auth implementation.

---

## 5. Validation

- Client: React Hook Form + Zod (`registrationSchema`).
- Server: same Zod schema in `registerProfessional`.
- Phone must normalize (ZA-first); invalid phone rejected.

---

## 6. Duplicate detection

- Email: exact lowercased match on `users.email`.
- Phone: `normalizePhone()` then exact match on stored canonical `users.phone`.
- UX message (no identity leakage):  
  `It looks like you may already have a Professionals profile. Try signing in to continue.`
- Auth “already registered” mapped to the same neutral message.

### Forensic clarification — email uniqueness layers

Email duplicates are defended by **combination**:

1. **Application pre-check** — `findRegistrationDuplicate` on `public.users.email` (lowercased)  
2. **Supabase Auth** — `createUser` rejects already-registered emails → same neutral `DUPLICATE` message  
3. **Database** — `users.email` UNIQUE; unexpected unique violations mapped to the same neutral message  

User-facing copy never names which field collided and never returns Postgres/`23505` text.

### Forensic clarification — phone normalization + unique index

- Application stores **only** `normalizePhone()` output (ZA-first canonical digits).  
  Examples → `27821234567`: `0821234567`, `+27 82 123 4567`, `27821234567`.
- Partial unique index `users_phone_normalized_unique` enforces uniqueness of that **stored** string where phone is non-null.
- The index is meaningful because normalization runs **before** insert.

**Limitation:** South Africa-first normalization, not a global telephony library.

---

## 7. Anti-spam

- Honeypot field `website` (hidden) — filled bots get a quiet non-creating path.
- In-process server rate limit: 8 attempts / 15 minutes / client key (IP).

### Forensic clarification — rate limit is MVP / process-local

Current rate limiting is an **in-memory `Map` in the Node process**. It is **not**:

- distributed across multiple server instances;
- durable across process restarts;
- a WAF / edge rate-limit product.

It is acceptable as **local/MVP demonstration protection** only. Production must add edge/WAF or shared-store limits. Do not treat the current control as production-grade anti-spam.

---

## 7b. Schema change scope (forensic)

**No new product tables and no Phase 2 architecture redesign.**

The only Phase 6 DDL was:

```text
supabase/migrations/20260907190000_users_phone_unique.sql
→ CREATE UNIQUE INDEX users_phone_normalized_unique ON users(phone) WHERE phone IS NOT NULL AND phone <> ''
```

Field mapping used existing `profiles` / `professional_details` / `users` columns only.

---

## 8. Analytics (non-PII)

Events: `registration_started`, `registration_step_viewed`, `registration_submitted`, `registration_validation_failed`, `registration_duplicate_detected`, `registration_auth_started`, `registration_completed`, `registration_failed`.

Properties may include: `step`, `result`, `error_category`, `device_class`, `duration_ms` — **never** name/email/phone.

Analytics failures do not break registration.

---

## 9. KPI instrumentation

- Client sends `clientDurationMs` (form open → submit).
- Server records `duration_ms` on `registration_completed`.
- **Instrumented:** yes.  
- **Empirically achieved median ≤60s:** **not claimed** — requires real-user / usability data.

---

## 10. Database proof

Executed against local disposable Supabase:

```text
scripts/phase6-registration-proof.ts → ok: true
authUserExists, publicUserIdMatches, REGISTERED / NOT_REVIEWED / PRIVATE
```

Playwright live submission:

```text
valid submission creates record and lands on success → PASS
duplicate email returns neutral message without raw DB errors → PASS (forensic follow-up)
```

Forensic script:

```text
scripts/phase6-forensic-clarification.ts
```

---

## 11. Security

- Service role / Prisma only on server.
- Defaults never elevate verification or directory visibility.
- Duplicate UX does not enumerate identities beyond a generic “may already have a profile”.
- RLS remains; privileged profile columns not client-settable.
- Phase 5 design system reused — no second component library.

---

## 12. Browser evidence

Widths: 320–1280 on `/join`. Landing CTA, `/register` redirect, validation, success copy, live submit verified via Playwright.

---

## 13. Accessibility

Reuses Phase 5 Field/label/error patterns. Required asterisk remains visible + native/ARIA required. No WCAG certification claim.

---

## 14. Known limitations

- Full passwordless sign-in UX deferred to Phase 7 (`/sign-in` is a minimal stub).
- In-memory rate limit (single-process).
- Phone normalization ZA-first.
- KPI not empirically proven.
- Public nav omits unimplemented `/professionals` directory until its owning phase (Phase 5.10 e2e selector updated to `Join` after intentional nav change).

---

## 15. Deferred

- Phase 7 passwordless sign-in completion
- Directory / profile enrichment / EXCO workflows
- Edge/WAF rate limiting
- Production email provider tuning
- Consent capture UI if product/legal later requires broader wording

---

## Governance

```text
PHASE 5 — FORMALLY CLOSED
PHASE 6 — PASS / COMPLETE / VERIFIED / LOCKED
  (forensic Auth/rate-limit/phone clarification complete — no material defect)
PHASE 7 — NOT AUTHORIZED
```
