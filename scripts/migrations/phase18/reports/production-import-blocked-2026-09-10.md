# Phase 18 — Production import attempt (2026-09-10)

**Gate:** FINAL EXECUTION AUTHORIZATION → RECONCILIATION → LOCK  
**Owner authorization:** READY FOR PRODUCTION IMPORT (governance phrase present in chat)  
**Result:** **BLOCKED — NO PRODUCTION MUTATION**

---

## Verdict

```text
PHASE 18 PRODUCTION IMPORT — BLOCKED
PRODUCTION MUTATIONS — 0
PHASE 18 — NOT COMPLETE / NOT LOCKED
PHASE 19 — PASS / COMPLETE / VERIFIED / LOCKED (unchanged)
PHASE 20+ — NOT AUTHORIZED
HARD STOP — DO NOT IMPROVISE IMPORTER
```

Governance authorization alone is insufficient. The audited Phase 18 **mutating importer does not exist**; safety brakes intentionally abort. Implementing an Auth-first writer in this gate would violate “do not invent / do not rewrite during execution.”

---

## Pre-mutation checks (DIRECTLY TESTED)

### A. Source integrity

| Check | Result |
| --- | --- |
| Path | `scripts/migrations/phase18/raw/TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx` |
| Present | YES |
| Bytes | 45762 |
| SHA256 | `4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C` |
| Matches recorded authoritative hash | **YES** |
| Authoritative sheet (prior audit) | `Form responses 1` |
| Row count (prior audit / dry-run) | **18** |

Note: chat prompt SHA256 contained an extra `0` (`…F06C…`); file matches the **recorded** 64-char hash (`…F6C…`).

### B. Production target credentials (workspace)

| Key | Status |
| --- | --- |
| `PHASE18_PRODUCTION_DATABASE_URL` | **ABSENT** |
| `PRODUCTION_DATABASE_URL` | **ABSENT** |
| `PHASE18_IMPORT_DATABASE_URL` | **ABSENT** |
| Workspace `DATABASE_URL` | LOCAL only (`127.0.0.1:54322`) |
| Local `SUPABASE_SERVICE_ROLE_KEY` used as production substitute | **NO** |

`check-access.mjs` (2026-09-10T15:12:13.571Z): `productionReadOnlyAccess=UNAVAILABLE`.

Phase 19 restored **Vercel** Production `DATABASE_URL` for the app. That is **not** the Phase 18 least-privilege preflight/import credential architecture documented for offline scripts.

### C. Mutating importer (CODE REVIEWED + DIRECTLY TESTED)

| Artifact | Finding |
| --- | --- |
| `scripts/migrations/phase18/import.ts` | Stub only — throws “intentionally unimplemented” |
| `isProductionImportAuthorized()` | Hardcoded `return false` |
| `assertLocalMutationAllowed` | Aborts if phrase `AUTHORIZE PHASE 18 PRODUCTION IMPORT` is detected |
| `src/features/legacy-migration/*` | Parse / map / dry-run / hash / env-safety only |
| Auth-first `createUser` import executor | **DOES NOT EXIST** |

What **does** exist (prior gates): mapping that never sets VERIFIED/DIRECTORY/consent/business/Spotlight; local dry-run CREATE×18 / SKIP×18; schema metadata migration for `legacy_import_*`.

### D. Expected plan vs executable plan

| Item | Status |
| --- | --- |
| Prior local dry-run | CREATE 18 / pass2 SKIP 18 |
| Production identity matching | **NOT TESTED** (preflight still blocked) |
| Production 18-row diff | **NOT AVAILABLE** |
| Executable production import path | **NONE** |

---

## Execution

**NOT EXECUTED.**

No Auth users created. No profiles/users/legacy rows written. No businesses/consent/Spotlight/verification/DIRECTORY mutations.

---

## Reconciliation

| Category | Count |
| --- | --- |
| CREATE (production) | **0** (not executed) |
| SKIP_ALREADY_IMPORTED (production) | **0** (not executed) |
| FAILED (runtime) | N/A — blocked before mutation |
| Unexplained source rows | N/A — import not started |
| 18-row production accounting | **INCOMPLETE** |

---

## Mutation accounting

| Category | Count |
| --- | --- |
| Member/Auth mutations | **0** |
| Professional profile mutations | **0** |
| Business mutations | **0** |
| Business-professional relationships | **0** |
| Verification mutations | **0** |
| Consent mutations | **0** |
| Directory publication mutations | **0** |
| Spotlight mutations | **0** |
| Document mutations | **0** |
| Schema changes | **0** |
| Application source changes for this gate | **0** (docs/governance only) |

---

## Security / idempotency

| Check | Result |
| --- | --- |
| Duplicate creation | N/A — no import |
| State integrity after import | N/A — no import |
| Second-pass idempotency on production | **NOT RUN** |
| Adversarial post-import | **NOT RUN** (nothing imported) |
| Privacy preserved by non-execution | YES |

---

## Failure classification (exact)

```text
1. GOVERNANCE: Owner authorized Production import.
2. TECHNICAL BLOCKER A: Mutating Phase 18 importer intentionally unimplemented.
3. TECHNICAL BLOCKER B: Production read-only preflight credentials still ABSENT
   (PHASE18_PRODUCTION_DATABASE_URL / PRODUCTION_DATABASE_URL).
4. TECHNICAL BLOCKER C: Separate import write/Auth credentials ABSENT
   (PHASE18_IMPORT_DATABASE_URL + Auth admin).
5. SAFETY BRAKE: env-safety aborts on the authorization phrase by design
   until a real importer gate is implemented under a separate build authorization.
```

**Class:** Missing implementation + incomplete preflight prerequisites — **not** a credential typo inside an existing importer.

---

## What must NOT be done next (without a new authorized build gate)

* Invent Auth-first import code during “execution”
* Reuse local Docker DB as “production”
* Substitute local `SUPABASE_SERVICE_ROLE_KEY` for production Auth
* Blindly write 18 rows via ad-hoc SQL/Prisma scripts
* Force VERIFIED / DIRECTORY / consent / Spotlight / businesses
* Claim Phase 18 LOCKED from dry-run evidence

---

## Required next gate (separate authorization)

```text
1. Implement + test Auth-first mutating importer (same sequence as /join)
   under an explicit IMPLEMENTATION AUTHORIZATION (not invent-during-import).
2. Provision PHASE18_PRODUCTION_DATABASE_URL (RO) → production-preflight
   → exact 18-row MATCH/CREATE plan.
3. Provision PHASE18_IMPORT_DATABASE_URL + Auth admin (write).
4. Flip/implement isProductionImportAuthorized for the real gate.
5. Then re-issue AUTHORIZE PHASE 18 PRODUCTION IMPORT for execution only.
```

Until then:

```text
PHASE 18 — IMPLEMENTATION / DRY-RUN — PASS
PHASE 18 PRODUCTION PREFLIGHT — BLOCKED
PHASE 18 PRODUCTION IMPORT — AUTHORIZED BY OWNER BUT NOT EXECUTABLE
PHASE 18 — NOT COMPLETE / NOT LOCKED
```
