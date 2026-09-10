# Phase 18 — Historical Google Form Migration

**Closeout date:** 2026-09-09  
**Phase 18 completion status:** **NOT COMPLETE** (blocked on production read-only access)  
**Production read-only preflight gate:** EXPLICITLY AUTHORIZED — still **BLOCKED** on credentials  
**Phase 19+:** NOT AUTHORIZED  
**Production import:** NOT AUTHORIZED (`AUTHORIZE PHASE 18 PRODUCTION IMPORT` not issued as an active write grant)

---

## 1. Executive Status

> **PHASE 18 — NOT COMPLETE**
>
> **PHASE 18 — IMPLEMENTATION / DRY-RUN: PASS**
>
> **PHASE 18 AUTH ARCHITECTURE: DECIDED FROM CODE/SCHEMA EVIDENCE**
>
> **PHASE 18 CREDENTIAL ARCHITECTURE: DOCUMENTED (least-privilege RO vs separate import)**
>
> **PHASE 18 PRODUCTION READ-ONLY PREFLIGHT GATE: OPENED BY EXPLICIT AUTHORIZATION**
>
> **PHASE 18 PRODUCTION PREFLIGHT RESULT: BLOCKED**
>
> Reason: authorized production read-only access unavailable (`PHASE18_PRODUCTION_DATABASE_URL` / `PRODUCTION_DATABASE_URL` ABSENT; workspace DB is local `127.0.0.1:54322` only). Local `SUPABASE_SERVICE_ROLE_KEY` was **not** used as a production substitute.
>
> Production identity matching and production diff were **not** performed and therefore **cannot** be reported as successful. Local disposable data was **not** substituted.
>
> Production mutation count during this work: **0**, because no production connection or production write was attempted. This confirms **non-execution**, not successful validation of a production write guard against the live production environment.
>
> **PRODUCTION IMPORT: NOT AUTHORIZED**

```text
PHASE 5–17 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 18 — NOT COMPLETE

PHASE 18 IMPLEMENTATION / DRY-RUN — PASS
PHASE 18 AUTH ARCHITECTURE — DECIDED FROM CODE/SCHEMA EVIDENCE
PHASE 18 CREDENTIAL ARCHITECTURE — DOCUMENTED

PHASE 18 PRODUCTION PREFLIGHT — BLOCKED
Reason: authorized production read-only access unavailable

PRODUCTION IDENTITY MATCHING — NOT TESTED
PRODUCTION 18-ROW DIFF — NOT AVAILABLE

PRODUCTION MUTATIONS — 0
NON-EXECUTION ONLY

PRODUCTION IMPORT — NOT AUTHORIZED
PHASE 19+ — NOT AUTHORIZED
HARD STOP
```

**18 proposed historical imports ≠ 18 confirmed production inserts.**

---

## 1b. Credential architecture (explicit)

```text
PHASE 18 READ-ONLY PREFLIGHT
        │
        └── PostgreSQL READ-ONLY credential only
            PHASE18_PRODUCTION_DATABASE_URL
            (alias: PRODUCTION_DATABASE_URL)
            Prefer dedicated least-privilege SELECT role
            NO Supabase service_role
            NO Storage
            NO write / DDL
                    ↓
             Production reconciliation
                    ↓
             Import plan finalized
                    ↓
        EXPLICIT: AUTHORIZE PHASE 18 PRODUCTION IMPORT
                    ↓
       Separate write-capable credentials
       (PHASE18_IMPORT_DATABASE_URL + Auth admin minimum TBD)
                    ↓
             Controlled import
```

| Gate | Credential | Notes |
| --- | --- | --- |
| Preflight | `PHASE18_PRODUCTION_DATABASE_URL` | Genuinely read-only PostgreSQL; SELECT for Auth linkage, members/profiles, professional/status, verification, visibility, privacy prefs, businesses, relationships |
| Preflight | `service_role` / Auth admin | **Not required; do not use** |
| Preflight | Storage | **Not required; do not use** |
| Import | Separate write DB + Auth admin | **Deferred** until CREATE_NEW/MATCH_EXISTING known; never reuse RO URL |

Access classifier: `scripts/migrations/phase18/check-access.mjs`  
Operator notes: `scripts/migrations/phase18/README.md`, `.env.example`
## 2. Evidence Classification

| Claim | Classification |
| --- | --- |
| Source XLSX parse (18×43, SHA256) | DIRECTLY TESTED |
| Source duplicates / invalid email-phone = 0 | DIRECTLY TESTED |
| NG phone normalization (18/18 → `234…`) | DIRECTLY TESTED |
| Local dry-run CREATE 18 / pass2 SKIP 18 | DIRECTLY TESTED |
| Local existing-member matches = 0 | DIRECTLY TESTED (local disposable DB only) |
| Idempotency of source-row hash (unit) | DIRECTLY TESTED |
| Privacy invariants in mapped payload (no consent/VERIFIED/DIRECTORY) | DIRECTLY TESTED |
| TypeScript / ESLint / Vitest / Next build | DIRECTLY TESTED / PREVIOUSLY EVIDENCED |
| Auth requires `auth.users` → `users` → `profiles` | CODE REVIEWED |
| `/join` Auth-first + passwordless OTP | CODE REVIEWED |
| No invite/claim mechanism in codebase | CODE REVIEWED |
| Production identity matching | **NOT TESTED / BLOCKED** |
| Production 18-row diff | **NOT AVAILABLE / BLOCKED** |
| Production write-guard against live production | **NOT TESTED** |
| Playwright (this closeout) | NOT RUN IN THIS CLOSEOUT |
| Production Auth / RLS / migration runtime | NOT TESTED |

---

## 3. Source Reconciliation

| Fact | Value | Evidence |
| --- | --- | --- |
| Format | XLSX | DIRECTLY TESTED |
| Authoritative sheet | `Form responses 1` | DIRECTLY TESTED |
| Derived sheets (not member sources) | `Spotlight Queue`, `Dashboard` | DIRECTLY TESTED |
| Data rows | **18** | DIRECTLY TESTED |
| Columns | **43** | DIRECTLY TESTED |
| SHA256 | `4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C` | DIRECTLY TESTED |
| Exact duplicate rows | 0 | DIRECTLY TESTED |
| Ambiguous identities (source) | 0 | DIRECTLY TESTED |
| Invalid emails | 0 | DIRECTLY TESTED |
| Invalid NG-aware phones | 0 | DIRECTLY TESTED |
| Raw preserved / gitignored | YES | PREVIOUSLY EVIDENCED |

---

## 4. Local Dry-Run Reconciliation

| Classification | Count | Evidence scope |
| --- | --- | --- |
| Historical source rows | 18 | Directly tested |
| Proposed CREATE | 18 | Local/source dry-run |
| Local existing-member matches | 0 | Local disposable DB only |
| Source duplicates | 0 | Source analysis |
| Ambiguous identities | 0 | Source/local analysis |
| Invalid | 0 | Source validation |
| Pass2 SKIP_ALREADY_IMPORTED | 18 | Local simulated idempotency |
| Production matches | **UNKNOWN** | Production blocked |
| Production creates | **UNKNOWN** | Production blocked |
| Production skips | **UNKNOWN** | Production blocked |
| Production conflicts | **UNKNOWN** | Production blocked |

Artifacts: `scripts/migrations/phase18/reports/dry-run-latest.{json,md}`

Local dry-run also confirmed mapped baseline:

* `verification_status` → NOT_REVIEWED  
* `visibility_status` → PRIVATE  
* `createConsent` / `createBusiness` / `createSpotlightRecord` → false  
* years buckets → not coerced to fake integers  
* historical directory/WhatsApp consent ignored for current state  

---

## 5. Auth Architecture Decision

### Decision (CODE REVIEWED)

| Question | Finding |
| --- | --- |
| Can a legitimate profile exist without Auth? | **NO** — `profiles.user_id` FK → `public.users`; `users.id` = `auth.users.id` (Phase 4 trigger) |
| Is Auth structurally required? | **YES** |
| Admin placeholder identities without Auth? | **NOT SUPPORTED** by current architecture |
| Passwordless claim/invitation tables/routes? | **NONE** — only `/join` + `/sign-in` OTP |
| Representation before claim? | Only safe if Auth identity already exists (same as `/join` creating Auth before first login) — **orphan profiles without Auth must not be invented** |
| How ownership is later proven? | Person authenticates via existing passwordless OTP to the email bound to that Auth user |
| What must NOT be done? | Fake emails/Auth users/passwords; shared accounts; admin impersonation; assigning another member’s Auth identity; treating Google Form submission as proof of Auth ownership; inventing VERIFIED/DIRECTORY/consent |

### AUTH STRATEGY — RECOMMENDED

```text
AUTH_FIRST_AT_AUTHORIZED_IMPORT_SAME_AS_JOIN
```

At a **future authorized production import** only:

1. For confirmed NEW_MEMBER after production match: use the same sequence as `/join` — `auth.admin.createUser` → `public.users` → legacy-marked `profiles` (+ mapped safe fields).  
2. Person later uses `/sign-in` OTP to that email.  
3. MATCH_EXISTING → GAP_ONLY; current member data always wins.  
4. Do not send OTP at import unless separately authorized.  
5. Do not implement a new claim product in this closeout — a fuller invite/claim UX remains a **future authorized prerequisite** if product requires it beyond Auth-first import.

**Claim mechanism status:** incomplete as a dedicated product feature (**NONE** in codebase). Auth-first import reuses existing `/join` security model; it is **not** marked implemented as a separate claim flow.

---

## 6. Production Access Status

| Item | Result |
| --- | --- |
| Explicit read-only preflight authorization | **YES** (2026-09-09) |
| `PRODUCTION_DATABASE_URL` / `PHASE18_PRODUCTION_DATABASE_URL` | ABSENT |
| Workspace `DATABASE_URL` | LOCAL_OR_DISPOSABLE only (`127.0.0.1:54322`) |
| Production environment confirmed | **NO** |
| Production connection established | **NO** |
| Production mutation attempted | **NO** |
| Actual production mutations | **0** (non-execution) |

Artifacts:

* `scripts/migrations/phase18/reports/production-preflight.md` — canonical blocked preflight  
* `scripts/migrations/phase18/reports/production-preflight-latest.{json,md}` — machine output  

Status therein: **BLOCKED — READ-ONLY ACCESS UNAVAILABLE**

The 18 rows held at `MANUAL_REVIEW` in tooling mean **“cannot classify without production read”** — not a production match result. Production `MATCH_EXISTING` / `CREATE_NEW` counts remain **NOT TESTED**.

---

## 7. Production Identity Matching

> **Production identity matching: NOT TESTED / BLOCKED — no production database access.**

Local disposable result “Existing matches: 0” is **local only** — not a production finding.

Future production preflight must classify each row as one of:

`MATCH_EXISTING` | `CREATE_NEW` | `AMBIGUOUS` | `CONFLICT` | `MANUAL_REVIEW` | `SKIP`

using normalized email/phone only (never name-alone), with current member data winning over legacy.

---

## 8. Production 18-Row Diff

> **Production 18-row diff: NOT AVAILABLE — cannot be truthfully generated without reading the production dataset.**

Do not treat local dry-run CREATE×18 as confirmed production inserts.

---

## 9. Business Candidate Review

| Item | Count | Status |
| --- | --- | --- |
| Business candidates (source) | **6** | Identified from historical source |
| Safe auto-migrate | 0 | — |
| Manual review | **6** | Required |
| Do not migrate automatically | — | Default until EXCO review |

Forbidden without separate authorization: auto OWNER, APPROVED/VERIFIED business, CAC-as-verification, public business listing.

---

## 10. Security / Privacy Reconciliation

| Control | Status | Evidence |
| --- | --- | --- |
| No fake Auth identities created | Preserved | DIRECTLY TESTED (no Auth create in Phase 18 tooling default path) |
| No automatic VERIFIED | Preserved | DIRECTLY TESTED (dry-run invariants) |
| No automatic DIRECTORY | Preserved | DIRECTLY TESTED |
| No fabricated consent | Preserved | DIRECTLY TESTED |
| No automatic business OWNER | Preserved | CODE REVIEWED + DIRECTLY TESTED (createBusiness=false) |
| No public contact leakage via import UI | N/A (no migration UI) | CODE REVIEWED |
| No production mutation | Non-execution = 0 | DIRECTLY TESTED |
| No production credentials in reports | Preserved | CODE REVIEWED |
| Historical Spotlight ≠ Phase 15 publish | Preserved | CODE REVIEWED |
| Production write-guard vs live production | **NOT TESTED** | Access unavailable |

---

## 11. Test / Build Evidence

| Check | Result | Scope |
| --- | --- | --- |
| TypeScript | PASS | PREVIOUSLY EVIDENCED / DIRECTLY TESTED in implementation gate |
| ESLint | PASS | DIRECTLY TESTED (closeout window) |
| Vitest (incl. Phase 18 / phone) | PASS | PREVIOUSLY EVIDENCED (implementation/dry-run gate) |
| Local dry-run | PASS | PREVIOUSLY EVIDENCED |
| Next.js build | PASS | DIRECTLY TESTED (closeout window) |
| Playwright | NOT RUN IN THIS CLOSEOUT | — |
| Production DB / Auth / RLS tests | NOT TESTED | — |

---

## 12. What Is Proven

* Historical source integrity (18×43, hash, sheet authority).  
* Nigerian phone normalization remediation and 18/18 success.  
* Local/offline migration pipeline, mapping exclusions, idempotent dry-run semantics.  
* Schema metadata for legacy provenance (local disposable applied earlier).  
* Auth dependency: profile cannot exist without Auth-aligned `users.id`.  
* No production connection and no production writes during this work.  
* ESLint + Next build pass in closeout window.

---

## 13. What Is Not Proven

* Any production member match counts.  
* Any production create/skip/conflict totals.  
* Exact production before/after diff for 18 rows.  
* Live production execution of the read-only / mutation guards.  
* End-to-end Auth createUser import path against production.  
* Completeness of a dedicated claim/invitation product (does not exist).  
* Playwright / production RLS for Phase 18.

---

## 14. Required Future Production Preflight Prerequisites

Gate authorization for read-only preflight is **already granted**. Remaining blocker is **access**:

1. Provide authorized **read-only** production database URL via `PRODUCTION_DATABASE_URL` or `PHASE18_PRODUCTION_DATABASE_URL` (approved secret mechanism; never commit secrets).  
2. Ability to inspect production Auth/profile/member identity fields needed for email/phone match.  
3. No production write permission required for preflight.  
4. No secrets printed into reports.  
5. Re-run `production-preflight.ts` and produce exact 18-row production classification.  
6. Production import remains a **separate** gate afterward.

Required workflow (do not combine gates):

```text
READ-ONLY PRODUCTION PREFLIGHT
        ↓
EXACT IDENTITY MATCHING
        ↓
18-ROW PRODUCTION DIFF
        ↓
RECONCILIATION
        ↓
SECURITY REVIEW
        ↓
IMPORT PLAN
        ↓
EXPLICIT: AUTHORIZE PHASE 18 PRODUCTION IMPORT
        ↓
CONTROLLED IMPORT
        ↓
POST-IMPORT VERIFICATION
```

---

## 15. Import Authorization Status

```text
PRODUCTION IMPORT — NOT AUTHORIZED
```

This closeout does **not** issue, imply, or simulate `AUTHORIZE PHASE 18 PRODUCTION IMPORT`.

---

## 16. Final Gate Decision

```text
PHASE 5–17 — PASS / COMPLETE / VERIFIED / LOCKED

PHASE 18 — NOT COMPLETE

Blocking finding:
authorized production read-only PostgreSQL credential unavailable
(PHASE18_PRODUCTION_DATABASE_URL / PRODUCTION_DATABASE_URL ABSENT)

Evidence:
check-access.mjs 2026-09-09T19:42:16.015Z — productionReadOnlyAccess=UNAVAILABLE;
only local DATABASE_URL at 127.0.0.1:54322; local service_role not used for production

Required remediation:
1. Provision dedicated production PostgreSQL READ-ONLY role
2. Set PHASE18_PRODUCTION_DATABASE_URL in gitignored env
3. Re-run check-access + production-preflight
4. Complete 18-row production reconciliation
5. Separate write/Auth credentials + AUTHORIZE PHASE 18 PRODUCTION IMPORT before any write

PRODUCTION IMPORT — NOT AUTHORIZED

PHASE 19+ — NOT AUTHORIZED

HARD STOP
```

Do not mark Phase 18 PASS / COMPLETE / VERIFIED / LOCKED until production preflight and (if authorized) import/verification succeed. Do not begin Phase 19.
