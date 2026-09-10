# TNCOD Professionals — Supabase Production Readiness Report

**Closure date:** 2026-09-10
**Repository:** `OlaNailedIT/tncod-professionals`
**Branch:** `main`
**Baseline HEAD:** `9bfc3672d45faa94ec0092c4fcc1fa16fa3583c6` (synced with `origin/main`)
**Evidence classes:** LIVE VERIFIED | CODE REVIEWED | DEFERRED | NOT VERIFIED

---

## RESULT

```text
SUPABASE INFRASTRUCTURE
PASS
COMPLETE
VERIFIED
LOCKED
```

This lock covers the hosted schema/migration/RLS/Storage/security infrastructure gate only.

```text
PRODUCTION AUTH ORIGIN
DEFERRED TO VERCEL

AUTHENTICATED ADVERSARIAL TESTING
DEFERRED UNTIL LEGITIMATE AUTHENTICATED DEPLOYMENT

HISTORICAL IMPORT
NOT AUTHORIZED

VERCEL
NOT TOUCHED IN THIS PHASE
```

---

## Project — LIVE VERIFIED

| Item | Value |
| --- | --- |
| Name | `tncod-professionals` |
| Ref | `brpppukzqgpzxjelwwrj` |
| Region | `us-west-2` |
| Status | `ACTIVE_HEALTHY` |
| Linked | yes |

---

## Migrations — LIVE VERIFIED

| Check | Result |
| --- | --- |
| Local files | 16 |
| Hosted history | 16/16 local = remote through `20260909190000` |
| Ordering | `20260908135000` precedes `20260908140000` |
| `NEEDS_CLARIFICATION` ADD VALUE | Only in `20260908135000_phase9_business_status_enum.sql` |
| Phase 9 business verification | Consumes enum; does not ADD VALUE |
| Prisma migrations | None (`prisma/migrations` absent) |
| Destructive reset / manual bypass | Not performed |

---

## Data sanity — LIVE VERIFIED (closure re-check)

| Relation | Count |
| --- | --- |
| `auth.users` | 0 |
| `public.users` / `profiles` / `businesses` / `documents` | 0 |
| `industries` | 10 (taxonomy seed only) |

No unexpected application data. Historical import **NOT AUTHORIZED** / **NOT PERFORMED**.

---

## RLS

| Test/Control | Evidence Type | Result |
| --- | --- | --- |
| RLS enabled on application tables (30 tables incl. preferences, spotlights, opportunities, legacy import) | LIVE VERIFIED | PASS |
| No `anon` write policies on `public` | LIVE VERIFIED | PASS |
| Anon `INSERT` into `public.users` denied (`42501`) | LIVE VERIFIED (prior; not re-mutated this closure) | PASS |
| Ownership / EXCO predicates | CODE REVIEWED | PASS (structure) |
| Member→member IDOR | DEFERRED — no Auth users | DEFERRED |
| Member→EXCO escalation | DEFERRED — no Auth users | DEFERRED |
| EXCO Viewer→mutation | DEFERRED — no Auth users | DEFERRED |
| Forged-ID access | DEFERRED — no Auth users | DEFERRED |

`RLS CONFIGURATION = PASS`
`AUTHENTICATED ADVERSARIAL TESTING = DEFERRED`

---

## Storage

| Test/Control | Evidence Type | Result |
| --- | --- | --- |
| Bucket `member-documents` exists | LIVE VERIFIED | PASS |
| `public = false` | LIVE VERIFIED | PASS |
| Policies: insert/select/update/delete own + select review | LIVE VERIFIED | PASS |
| Path model `documents/{userId}/{documentId}` | CODE REVIEWED | PASS |
| Anon Storage INSERT denied (`42501`) | LIVE VERIFIED (prior) | PASS |
| Authenticated cross-user object access | DEFERRED — Auth user required | DEFERRED |

---

## Auth

| Test/Control | Evidence Type | Result |
| --- | --- | --- |
| Hosted `auth.site_url` | LIVE VERIFIED (`supabase config diff`) | `http://localhost:3000` — **NOT production-ready**; **DEFERRED** until production origin exists |
| Hosted `auth.additional_redirect_urls` | LIVE VERIFIED | `[]` empty — **DEFERRED** until `/auth/callback` origin known |
| OTP / magic-link app path | CODE REVIEWED | `signInWithOtp`, `/auth/callback`, `sanitizeNextPath` |
| OTP length / email confirmations / MFA TOTP / SMS Twilio flags | LIVE VERIFIED (diff) | Present on remote; review at Vercel Auth cutover |
| Live OTP / session cookie | DEFERRED | Needs deployed origin + identity |
| Blind `config push` from local | NOT DONE | Correct — local still localhost-oriented |

**Classification:** Hosted Auth URLs = **NOT VERIFIED as production-ready** / **DEFERRED — DEPENDS ON PRODUCTION APPLICATION ORIGIN**. Do not invent a URL. Do not configure localhost as production. Do not touch Vercel in this phase.

---

## Security

| Category | Result | Evidence |
| --- | --- | --- |
| `.env` git tracking | PASS | Ignored; not tracked |
| Secret leakage in readiness docs/rules | PASS | No JWT/service_role/DB URLs in those files |
| Service-role in client bundle | CODE REVIEWED | Server-only usage expected |
| Anon protected DB write | LIVE PASS | Prior `42501` |
| Storage privacy | LIVE PASS | Private bucket + policies |
| Test-auth dual gate | CODE REVIEWED | Not expanded |
| Historical PII / import | LIVE PASS | Absent |
| Production Auth test-user fabrication | PASS | Still `auth.users = 0` |
| Credential helper | ACCEPTABLE / OPTIONAL | Presence-only; prints lengths/hosts, never secret values; not app runtime |

---

## Production safety

- Historical import: **NOT AUTHORIZED** / **NOT PERFORMED**
- No historical documents uploaded
- No production Auth users created
- No destructive reset
- No migration bypass
- No unexpected production application data
- Vercel: **UNTOUCHED**
- Commit / push of remediation: **AUTHORIZED** as part of formal infrastructure lock (this commit)

---

## Working-tree change boundary (authorized remediation)

| File | Role |
| --- | --- |
| `supabase/migrations/20260908135000_phase9_business_status_enum.sql` | Enum prerequisite (applied) |
| `supabase/migrations/20260908140000_phase9_business_verification.sql` | Enum ADD removed |
| `supabase/config.toml` | Migrations enabled for hosted apply |
| `docs/infrastructure/SUPABASE-PRODUCTION-READINESS-REPORT.md` | This handoff |
| `.cursor/rules/tncod-professionals.mdc` | Governance status |
| `scripts/migrations/phase18/scan-credential-presence.cjs` | Optional presence-only helper |

No unrelated dirty files observed at closure.

---

## Validation (closure)

| Check | Result |
| --- | --- |
| Typecheck | PASS |
| Lint | PASS |
| Build | PASS |
| `git diff --check` | PASS |

Full test suite not re-run for documentation-only closure; authenticated prod tests not manufactured.

---

## Formal lock

```text
SUPABASE INFRASTRUCTURE = PASS / COMPLETE / VERIFIED / LOCKED
```

**Next authorized phase (do not execute here):**
`VERCEL PRODUCTION DEPLOYMENT / ORIGIN ESTABLISHMENT`

After a real production origin exists: set Auth Site URL + redirect URLs → re-verify with `supabase config diff` → then authenticated adversarial suite with legitimate identities. Historical import remains **NOT AUTHORIZED** until explicit `AUTHORIZE PHASE 18 PRODUCTION IMPORT`.
