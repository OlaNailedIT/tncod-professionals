# Phase 18A — Auth-First Importer Implementation & Preflight

**Date:** 2026-09-10 (implementation/preflight); Production execution 2026-09-11  
**Result:** **PASS / COMPLETE / VERIFIED / LOCKED**  
**Phase 18A Production mutations (this phase window):** **0** (execution was a separate Phase 18 authorization)  
**Phase 18 (current):** **PASS / COMPLETE / VERIFIED / LOCKED** — Production import **VERIFIED COMPLETE** (see `docs/product/phase-18-historical-google-form-migration-scope.md` and `docs/release/RELEASE-STATE.md`)

---

## 1. Executive status

Phase 18A closes the implementation gap identified when Production import was correctly blocked:

| Prior gap | Phase 18A outcome |
| --- | --- |
| `import.ts` intentional stub | Real plan CLI + local execute path; Production path hard-stopped in 18A |
| `isProductionImportAuthorized()` always false | Explicit env phrase gate (default DENY) |
| Auth-first writer missing | `execute.ts` Auth → users → MEMBER → legacy profile → provenance |
| Isolated import credentials | Named `PHASE18_IMPORT_*` contract documented |

---

## 2. Initial audit (summary)

* `/join` (`registerProfessional`): Auth `createUser` → `users` upsert → MEMBER → profile (`REGISTERED` / `NOT_REVIEWED` / `PRIVATE`).
* Phase 18 map baseline: `INCOMPLETE` / `NOT_REVIEWED` / `PRIVATE`, `legacyImport: true`, no consent/business/Spotlight.
* Provenance schema already present (`legacy_import_batches` / `legacy_import_rows` + profile legacy columns) — **no new Production schema**.
* Dry-run classifier reused for execution plan parity.

---

## 3. Implementation

| Module | Role |
| --- | --- |
| `constants.ts` | Expected SHA256, 18 rows, project ref, auth phrase |
| `source-guard.ts` | Fail-closed source integrity |
| `env-safety.ts` | Local mutate gate; Production mutate gate (phrase + creds + ref) |
| `target-safety.ts` | Hosted Supabase project ref identity |
| `plan.ts` | Execution plan from dry-run classifier |
| `execute.ts` | Auth-first executor (injectable Auth + Prisma) |
| `auth-admin.ts` | Service-role Auth create (no password; no OTP) |
| `member-index.ts` | Prisma member/provenance index for planning |
| `scripts/.../import.ts` | CLI: plan-only default; `--execute-local`; `--execute-production` → **18A hard stop** |

### Auth-first flow

```text
CREATE row
  → auth.admin.createUser (passwordless, email_confirm)
  → public.users upsert
  → MEMBER role only
  → profile (INCOMPLETE / NOT_REVIEWED / PRIVATE / legacy_*)
  → professional_details (+ optional church serviceArea)
  → legacy_import_rows provenance
```

GAP_ONLY / MATCH_EXISTING → provenance only (never overwrite member fields).  
AMBIGUOUS / INVALID / MANUAL_REVIEW → REFUSED (no Auth).  
SKIP_ALREADY_IMPORTED → no Auth / no profile.

### Authorization (default DENY)

```text
PHASE18_PRODUCTION_IMPORT_AUTHORIZED
  === "AUTHORIZE PHASE 18 PRODUCTION IMPORT"   (exact; no trim)
+ PHASE18_IMPORT_DATABASE_URL (production-class)
+ PHASE18_IMPORT_SUPABASE_URL (contains brpppukzqgpzxjelwwrj)
+ PHASE18_IMPORT_SERVICE_ROLE_KEY
+ PHASE18_PRODUCTION_PROJECT_REF matches expected
```

Credentials alone / `--production` alone / app `DATABASE_URL` alone → DENY.

### Phase 18A Production hard stop

Even when the Production gate would pass, `import.ts --execute-production` throws:

> PHASE 18A HARD STOP: Production mutation is implemented but not authorized for execution in this phase.

---

## 4. Tests

| Suite | Result |
| --- | --- |
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint (`src/features/legacy-migration`) | PASS (0 errors) |
| Vitest legacy-migration (36) | PASS |
| Phase 18 dry-run (18 CREATE / pass2 18 SKIP) | PASS |
| Phase 18A plan-only (18 CREATE) | PASS |
| Next.js build | PASS |
| Playwright | NOT RUN (no app UI/API for importer) |
| Live disposable DB execute | NOT REQUIRED for 18A lock (mock Auth-first + idempotency DIRECTLY TESTED) |

---

## 5. Adversarial audit

| Boundary | Result | Class |
| --- | --- | --- |
| Default Production execution denied | PASS | DIRECTLY TESTED |
| Missing / malformed authorization denied | PASS | DIRECTLY TESTED |
| Wrong target denied | PASS | DIRECTLY TESTED |
| Missing migration credential denied | PASS | DIRECTLY TESTED |
| Wrong SHA / sheet / row count denied | PASS | DIRECTLY TESTED |
| Auth-first ordering | PASS | DIRECTLY TESTED |
| Idempotency 1st/2nd/3rd | PASS | DIRECTLY TESTED |
| Ambiguous identity → no Auth | PASS | DIRECTLY TESTED |
| No VERIFIED / DIRECTORY / consent / Spotlight / business create | PASS | DIRECTLY TESTED + CODE REVIEWED |
| NG phone not ZA-first | PASS | DIRECTLY TESTED |
| No public `/api/import` | PASS | CODE REVIEWED |
| Secrets not in reports | PASS | CODE REVIEWED |
| Browser cannot import execute modules via routes | PASS | CODE REVIEWED (script-only) |

---

## 6. Production preflight (read-only / presence)

| Item | Status |
| --- | --- |
| Target project ref | `brpppukzqgpzxjelwwrj` (expected constant) |
| Source SHA256 | MATCH |
| Sheet / rows | Form responses 1 / 18 |
| Plan | CREATE × 18 |
| `PHASE18_PRODUCTION_DATABASE_URL` | ABSENT |
| `PHASE18_IMPORT_*` | ABSENT |
| Authorization env | DISABLED |
| Production mutations | **0** |

RO identity matching against live Production remains **NOT TESTED** until RO URL is provisioned (does not block 18A implementation lock).

---

## 7. Governance

```text
Phase 18A — PASS / COMPLETE / VERIFIED / LOCKED
Phase 18  — NOT COMPLETE / NOT LOCKED
Phase 19  — PASS / COMPLETE / VERIFIED / LOCKED
Phase 20+ — NOT AUTHORIZED
```

Next authorized action (separate gate only):

> **PHASE 18 PRODUCTION EXECUTION + RECONCILIATION + FINAL LOCK**

---

## 8. Hard stop

Do **not** execute Production import from this phase.  
Do **not** begin Phase 20.  
Do **not** create migration UI/API.
