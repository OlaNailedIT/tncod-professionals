# TNCOD Professionals — Git / Infrastructure Readiness Report

**Date:** 2026-09-10  
**Scope:** Pre-baseline commit infrastructure readiness (inspection + hygiene documentation)  
**Commit / push:** NOT EXECUTED  
**Production mutation:** NOT EXECUTED  

---

## Executive Status

```text
PASS WITH NON-BLOCKING FINDINGS
```

```text
BASELINE COMMIT READY
```

Awaiting **separate** explicit authorization for initial `git commit` and `git push`.

---

## Git

| Item | Result | Evidence |
| --- | --- | --- |
| Local repo | Initialized at `C:\Users\O\Devs\tncod-professional` | DIRECTLY TESTED |
| Branch | `main` (no commits yet) | DIRECTLY TESTED |
| Remote `origin` | `git@github.com:OlaNailedIT/tncod-professionals.git` | DIRECTLY TESTED |
| `core.sshCommand` | `C:/Windows/System32/OpenSSH/ssh.exe` | DIRECTLY TESTED |
| GitHub SSH auth | PASS — `Hi OlaNailedIT! You've successfully authenticated...` | DIRECTLY TESTED |
| `git ls-remote origin` | Empty output, exit 0 | DIRECTLY TESTED |
| Remote heads/tags | Empty | DIRECTLY TESTED |
| Remote empty | **EXPECTED** | DIRECTLY TESTED |

**Note (P3):** No `~/.ssh/config` `Host github.com` IdentityFile entry was found; dedicated key `id_ed25519_github` works when used explicitly. `git ls-remote` already succeeds as `OlaNailedIT`. For reproducibility before push, ensure the dedicated key is selected (agent / `core.sshCommand` with `-i` / SSH config). Non-blocking while remote reachability PASS.

---

## Repository Hygiene

| Item | Result | Evidence |
| --- | --- | --- |
| Staged files | **418** (+ this report when staged) | DIRECTLY TESTED |
| True untracked (pre-report) | **0** | DIRECTLY TESTED |
| `.env` exists locally | YES | DIRECTLY TESTED |
| `.env` ignored | YES (`.gitignore:.env`) | DIRECTLY TESTED |
| `.env` tracked / staged | **NO** | DIRECTLY TESTED |
| `.env.example` staged | YES | DIRECTLY TESTED |
| `node_modules` / `.next` / `*.tsbuildinfo` | Ignored | DIRECTLY TESTED |
| Phase 18 `raw/` / `derived/` | Ignored | DIRECTLY TESTED |
| `supabase/.temp` | Ignored | DIRECTLY TESTED |
| Generated/junk in staged tree | CLEAN | DIRECTLY TESTED |
| Accidental root junk | None identified | DIRECTLY TESTED |

---

## Secret Security

### Scan performed

* Staged name filter for `.env`, keys, PEMs, XLSX/CSV, `raw/`, `node_modules`, `.next`
* Pattern search across `src/`, `scripts/`, staged content (`-G`)
* Manual review of `.env.example`
* Phase 18 report mask check (emails/phones)

### Findings

| Finding | Disposition |
| --- | --- |
| `.env` with live local secrets | Local-only, ignored — **PASS** |
| `.env.example` placeholders (`postgres:postgres@localhost`, empty `NEXT_PUBLIC_*`, commented service-role) | **SAFE** — no real hosted credentials |
| Test fixtures with fake `postgresql://user:pass@db.xxx.supabase.co` | Non-secret test strings — **PASS** |
| Phase 18 staged reports | Masked (`m***@g***`, `***5949`) + hashes — **PASS** (no raw XLSX staged) |
| Hard-coded JWT / service-role literals / private keys in staged tree | **None found** |

### Negative tests

| Check | Expected | Result |
| --- | --- | --- |
| Real credential in staged tree | NO | PASS |
| Service-role via `NEXT_PUBLIC_*` | NO | PASS (`assertNoLeakedServiceRole`) |
| DB credential in client env module | NO | PASS (CODE REVIEWED + DIRECTLY TESTED) |
| Raw historical PII staged | NO | PASS |
| Production mutation this task | NO | PASS |

**Never print secret values.** None disclosed in this report.

---

## `.env.example` Audit

**SAFE to commit.**

* Public slots: empty `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* Server slots: local placeholder `DATABASE_URL` only; `SUPABASE_SERVICE_ROLE_KEY` commented
* Phase 18 RO/import keys documented as comments only
* No production URL/key pair, JWT, or personal credential

---

## Supabase

| Item | Result | Evidence |
| --- | --- | --- |
| Local config | `supabase/config.toml` present | DIRECTLY TESTED |
| Migrations | 15 SQL files under `supabase/migrations/` (through Phase 18 metadata) | DIRECTLY TESTED |
| Migration authority | `supabase/migrations/` — **no** `prisma/migrations/` | DIRECTLY TESTED |
| Policies / tests | Present under `supabase/policies`, `supabase/tests` | DIRECTLY TESTED |
| Hosted production project | **NOT PROVISIONED** | PREVIOUSLY EVIDENCED / INFERRED from empty prod credentials |
| Phase 18 prod import | NOT AUTHORIZED | CODE REVIEWED / GOVERNANCE |
| Read-only reconciliation | PREPARED / NOT YET PROVISIONED (`PHASE18_PRODUCTION_DATABASE_URL`) | PREVIOUSLY EVIDENCED |

---

## Vercel

| Item | Result |
| --- | --- |
| `vercel.json` / `.vercel` | Absent |
| Framework | Next.js 15 (`next.config.ts`, `npm run build`) |
| Production branch expectation | `main` |
| Deployment | **NOT PROVISIONED** / not executed |
| Hard-coded production secrets in source | None found |

**Status:** READY for future Vercel project creation — **NOT YET PROVISIONED**.

---

## Application Security

### Test auth routes

`src/app/api/test/auth-otp/route.ts`  
`src/app/api/test/auth-session/route.ts`

Guards (CODE REVIEWED):

1. `AUTH_E2E_HELPER !== "1"` → 404 DISABLED  
2. `NODE_ENV === "production"` → 404 DISABLED  

**TEST AUTH PROTECTION: PASS** (dual gate). Do not delete; retain for local/disposable e2e.

### Env separation

| Variable class | Names | Client exposure |
| --- | --- | --- |
| Public | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Allowed via `src/lib/env/public.ts` / `browser.ts` |
| Server-only | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `server-only` modules (`server.ts`, `admin.ts`) |

**ENV SEPARATION: PASS**

### Auth architecture

Passwordless OTP / magic link retained; no second auth system introduced by this task. CODE REVIEWED / PREVIOUSLY EVIDENCED.

### Storage

Path convention `documents/{userId}/{documentId}`; signed URL default **60 seconds** in member/EXCO signed-url routes and `business-documents.ts`. DIRECTLY TESTED (code). No historical Drive upload.

### Route architecture (spot check)

* No `/admin` app route in build output — PASS  
* Public/member/EXCO surfaces present in build  
* Nav references `/exco/reports` and `/exco/settings` without page implementations — **NON-BLOCKING** (pre-existing UX placeholders; out of scope to implement)

---

## Phase Governance

| Gate | State |
| --- | --- |
| Phase 0–17 | PASS / COMPLETE / VERIFIED / LOCKED preserved |
| Phase 18 | Implementation / dry-run PASS; production preflight blocked on missing prod DB; **NOT FULLY LOCKED** |
| Production import | **NOT AUTHORIZED** (requires exact `AUTHORIZE PHASE 18 PRODUCTION IMPORT`) |
| Phase 19+ | **NOT AUTHORIZED** |

---

## Validation Evidence

| Check | Result | Classification |
| --- | --- | --- |
| GitHub SSH | PASS | DIRECTLY TESTED |
| Remote empty + reachable | EXPECTED / PASS | DIRECTLY TESTED |
| Secret / PII gates | PASS | DIRECTLY TESTED |
| `npm run typecheck` | PASS | DIRECTLY TESTED |
| `npm run lint` | PASS | DIRECTLY TESTED |
| `npm run build` | PASS | DIRECTLY TESTED |
| `npm run test` | 180 passed / 6 failed | DIRECTLY TESTED |
| Integration test failures | Local `DATABASE_URL` unavailable (disposable Postgres not running) — Phase 12/13/14 boundary suites | DIRECTLY TESTED — **environment**, not staged-tree defect |
| `npm audit --omit=dev` | 5 advisories (transitive prisma/deepmerge, next/postcss); fix would force major bumps | DIRECTLY TESTED — **NON-BLOCKING** for baseline; future dependency work |

---

## Blockers

### P0 / P1

**None** for baseline commit/push authorization.

### P2 (non-blocking)

* Integration tests require running local disposable Supabase before claiming full DB evidence PASS in a future closeout.
* Transitive `npm audit` highs — do not force-upgrade in this workstream.

### P3

* SSH IdentityFile not pinned in `~/.ssh/config` (reachability still PASS).
* Missing `engines` field in `package.json` (Node v24.18.0 used locally; Vercel may prefer LTS — decide at deploy provisioning).
* `/exco/reports` and `/exco/settings` linked in nav, pages not present — product follow-up, not infra baseline blocker.

---

## Required Next Action

```text
INITIAL BASELINE COMMIT/PUSH MAY BE AUTHORIZED SEPARATELY.
```

Do **not** interpret this report as commit/push authorization.

### Recommended command sequence (DO NOT RUN until authorized)

```powershell
# 1) Confirm cleanliness
git status
git diff --cached --stat

# 2) Ensure SSH identity for GitHub (if needed)
# Prefer Host github.com IdentityFile ~/.ssh/id_ed25519_github in SSH config
# or: git config core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe -i C:/Users/O/.ssh/id_ed25519_github -o IdentitiesOnly=yes"

# 3) Only after explicit user authorization:
git commit -m "Initial baseline: TNCOD Professionals Phases 0–18 local implementation."
git push -u origin main
```

---

## Final Governance Statement

```text
STATE A — READY

Infrastructure readiness PASS WITH NON-BLOCKING FINDINGS
Baseline commit ready
No production mutation performed
No architecture redesigned
Awaiting explicit commit/push authorization
PRODUCTION IMPORT — NOT AUTHORIZED
PHASE 19+ — NOT AUTHORIZED
```
