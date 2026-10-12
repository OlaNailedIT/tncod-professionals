# Phase 21 — Security Hardening

**Status:** `PASS` / `COMPLETE` / `VERIFIED` / **LOCKED** (2026-09-14)

**Authorized:** 2026-09-14  
**Predecessor:** Phase 20.5 — PASS / COMPLETE / VERIFIED / LOCKED  
**Successor:** Phase 22+ — **NOT AUTHORIZED**

---

## Purpose

Establish a defensible security baseline for the **existing** TNCOD Professionals architecture by inspecting, attacking, classifying, and remediating only confirmed defects — without reinventing Auth, RLS theatre, or locked product phases.

---

## Governance

```text
PHASE 5–13, 18–20.5 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 21 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 22+ — NOT AUTHORIZED
```

Authentication architecture remains Phase 20.5 (passwordless OTP + Gmail SMTP). Not replaced.

---

## Architecture under audit

| Plane | Role |
| --- | --- |
| Next.js Server Actions / Prisma | Primary data plane (privileged `DATABASE_URL` — **bypasses RLS**) |
| Supabase Auth + SSR cookies | Session |
| Supabase RLS | Defense-in-depth for JWT/PostgREST |
| Storage `member-documents` | Private; service_role mint after domain authz |
| `app.directory_professionals()` | Schema projection; **PostgREST access revoked in Phase 21 migration** |

---

## Threat model (concise)

Attackers: anonymous browser, authenticated MEMBER, EXCO_VIEWER, compromised client payload, PostgREST with anon key, cross-member IDOR, privilege escalation.

Assets: PII, private docs, verification authority, EXCO ops, directory privacy preferences, Auth sessions, secrets.

---

## Critical findings register

### P0

None confirmed.

### P1

| ID | Finding | Disposition |
| --- | --- | --- |
| P1-001 | `public.directory_professionals` / `app.directory_professionals()` GRANTed to `anon`+`authenticated` returned allowlist fields **without** Phase 14 preference withhold — PostgREST dual-path privacy bypass vs Next.js Prisma projection | **REMEDIATED** — migration `20260914180000_phase21_directory_postgrest_revoke.sql` revokes SELECT/EXECUTE. App routes unchanged. |

### P2

| ID | Finding | Disposition |
| --- | --- | --- |
| P2-001 | `listExistingSpotlights` auto-archived Spotlights for any EXCO role (incl. EXCO_VIEWER) without `spotlight.manage` | **REMEDIATED** — archive only when `canManageSpotlight` |
| P2-002 | `sanitizeNextPath` allowlist bypass via `/dashboard/../…` path segments | **REMEDIATED** — pathname normalization |
| P2-003 | No app-level security headers in `next.config` | **REMEDIATED** — HSTS, nosniff, frame deny, referrer, permissions-policy |
| P2-004 | Prisma/`service_role` systemic RLS bypass | **ACCEPTED ARCHITECTURAL CONTROL** — domain authz mandatory; sampled mutations gated |
| P2-005 | `businesses` INSERT RLS = active account only (orphan possible via JWT) | **ACCEPTED RISK / DEFERRED** — app not primary JWT writer; tighten later if PostgREST exposure grows |
| P2-006 | Peer `profiles` SELECT policy over-broad vs app projections | **ACCEPTED RISK / DEFERRED** — JWT plane; app uses Prisma projections |

### P3 / Informational

| ID | Finding | Disposition |
| --- | --- | --- |
| P3-001 | No shared EXCO middleware/layout gate (per-page checks) | **ACCEPTED** — current pages gated; fragile pattern |
| P3-002 | Registration rate limit in-memory / multi-instance | **ACCEPTED** — MVP + Auth rate limits |
| P3-003 | OTP abuse relies on Supabase + UI cooldown | **PASS — ACCEPTED ARCHITECTURAL CONTROL** |
| P3-004 | SECURITY DEFINER on directory/helpers | **PASS** after revoke; helpers auth.uid()-scoped |
| P3-005 | Storage docs drift (signed URLs “unimplemented”) | **INFORMATIONAL** |

---

## Security baseline matrix

| Domain | Current control | Attack / review | Result | Severity | Remediation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication | OTP + SSR + anti-enum | Code review + Phase 20.5 human | PASS | — | — | LOCKED inherit |
| Authorization | Session + permissions | Static IDOR matrix | PASS | — | — | PASS |
| IDOR | Ownership asserts | Code review | PASS | — | — | PASS |
| Server/client | server-only / no public service_role | Grep | PASS | — | — | PASS |
| Validation | Zod on mutations | Code review | PASS | — | — | PASS |
| Rate limiting | Reg Map + Supabase Auth | Code review | PASS — ACCEPTED | P3 | — | ACCEPTED |
| CSRF | Server Actions + cookies | Architecture | PASS — ACCEPTED | — | — | PASS |
| Headers | None → baseline | Config | FAIL→FIX | P2 | next.config headers | REMEDIATED |
| Errors | Classified auth UX | Code review | PASS | P3 residual | — | PASS |
| RLS | Enabled core tables | Migration review | PASS — ACCEPTED | P2 residual JWT | — | ACCEPTED |
| Grants | Anon table grants + RLS | Review | PASS — ACCEPTED | — | revoke directory | REMEDIATED P1 |
| Constraints | FKs/uniques/enums | Migration review | PASS | — | — | PASS |
| Storage | Private bucket + signed URL | Code review | PASS | — | — | PASS |
| Uploads | Association + type limits | Code review | PASS | — | — | PASS |
| Signed URLs | 60s + authz | Code review | PASS | — | — | PASS |
| Secrets | Env split | Grep | PASS | — | — | PASS |
| Audit | audit_logs + writers | Code review | PARTIAL | P3 | — | ACCEPTED |
| Verification | Server transitions | Code review | PASS | — | — | PASS |
| Visibility | Pref ∩ allowlist in app | Dual-path found | FAIL→FIX | P1 | revoke PostgREST | REMEDIATED |
| Business privacy | Association + EXCO | Code review | PASS | — | — | PASS |
| Spotlight write-on-read | EXCO list archive | Code review | FAIL→FIX | P2 | manage gate | REMEDIATED |
| Redirects | sanitizeNextPath | Traversal | FAIL→FIX | P2 | normalize | REMEDIATED |

---

## Authentication

```text
signInWithOtp (shouldCreateUser: false)
→ Gmail SMTP → {{ .Token }}
→ verifyOtp → SSR cookies → middleware
```

Anti-enumeration on OTP request: **PASS — ACCEPTED**. Join does not send OTP. CSRF: Server Actions — **PASS — ACCEPTED**.

---

## Authorization / IDOR

Member mutations derive identity from session; client `userId`/`profileId`/`role`/`verification` spoofing rejected or ignored. EXCO uses role + permission keys. **No P0/P1 IDOR confirmed.**

---

## Database

- RLS enabled on sensitive tables; Prisma is privileged — domain authz is the fence.
- **P1-001** PostgREST directory revoke migration added.
- SECURITY DEFINER helpers remain; directory EXECUTE revoked from anon/authenticated.
- Production apply of migration: **REQUIRED** before Phase 21 LOCK (see Production impact).

---

## Storage

Private `member-documents`; path `documents/{uid}/{docId}`; signed URLs after ownership/`document.review`; no `getPublicUrl` in app.

---

## Application security

| Fix | File |
| --- | --- |
| Path traversal redirect | `src/lib/auth/safe-redirect.ts` |
| Spotlight manage gate | `src/features/spotlight/commands.ts` |
| Security headers | `next.config.ts` |
| Directory PostgREST revoke | `supabase/migrations/20260914180000_phase21_directory_postgrest_revoke.sql` |

---

## Secrets

No hardcoded service-role / SMTP / DB passwords found in `src/`. `NEXT_PUBLIC_*` service_role forbidden in public env helper.

---

## Auditability

Verification / publish / opportunity / spotlight manage write audit where implemented. Gaps (viewer-only reads) accepted as P3.

---

## Public / privacy security

```text
exposure = preference ∩ allowlist ∩ eligibility ∩ authorization
```

Enforced in Next.js directory list/detail. PostgREST dual-path closed by revoke migration (once applied).

---

## Remediation performed (this phase)

1. Spotlight auto-archive requires `spotlight.manage`
2. `sanitizeNextPath` normalizes `..`
3. Security response headers
4. SQL migration to revoke anon/authenticated access to directory projection view/function
5. Unit tests for redirect traversal

---

## Deferred / accepted risks

- JWT-plane over-broad profile peer SELECT
- Businesses orphan INSERT via JWT
- In-memory registration rate limit
- No EXCO layout middleware
- Magic-link ConfirmationURL prefetch (Phase 20.5 known; OTP canonical)
- Full Production CSP (deferred — compatibility)

---

## Regression (code-level this pass)

| Phase | Result | Notes |
| --- | --- | --- |
| Phase 13 | PASS | App 200; PostgREST revoke verified |
| Phase 18 | PASS (no mutation) | Integrity not altered |
| Phase 20 | PASS (smoke) | Anonymous analytics still 307 |
| Phase 20.5 | PASS (untouched Auth path) | OTP architecture unchanged |

---

## Tests

| Suite | Result |
| --- | --- |
| Vitest `safe-redirect` (+ traversal) | PASS |
| Vitest auth helpers | PASS |
| TypeScript | PASS |
| Production headers + Phase 13 smoke | PASS |
| Production PostgREST directory deny | PASS (401) |

---

## Production impact

```text
Production application deployment: YES
  dpl_Ax6qeGWGWAiH6KGZTu53AasqzHUM → https://tncod-professionals-azure.vercel.app
Production database schema changes: YES
  Applied: 20260914180000_phase21_directory_postgrest_revoke.sql
Production data mutations: NO
Production Auth changes: NO
Production RLS changes: NO (directory view/function GRANTs revoked)
Production Storage changes: NO
Production configuration changes: YES (security response headers)
```

### Production verification (post-deploy)

| Check | Result |
| --- | --- |
| Headers nosniff / DENY / Referrer / HSTS | PASS |
| `/professionals` | 200 |
| Anonymous `/exco/analytics` | 307 |
| Anon PostgREST `directory_professionals` | **401 DENIED** |

---

## Lock decision

```text
PHASE 21 — PASS / COMPLETE / VERIFIED / LOCKED
```

P0: none. P1-001 remediated + Production verified. P2 remediations deployed. Accepted residuals documented.

---

## Final governance

```text
PHASE 5–13 — PASS / COMPLETE / VERIFIED / LOCKED
PHASE 18–20.5 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 21 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 22+ — NOT AUTHORIZED

HARD STOP
```
