# Operations — Incident response & rollback

**Gate 6A status:** **PARTIAL** (procedures documented; Production not intentionally broken to prove drills)  
**Date:** 2026-10-12  
**Canonical Production:** `https://tncod-professionals-azure.vercel.app`  
**Deployment authority:** Git SHA on `main` + Vercel Production deployment metadata

---

## Shared sequence

For every class below:

```text
1. Detect
2. Contain
3. Assess
4. Rollback / recover
5. Verify
6. Document
```

Do not invent unverified CLI flags. Prefer Dashboard actions the team already uses.

---

## 1. Security / privacy incident

| Step | Action |
| --- | --- |
| Detect | Report from member/EXCO, anomalous Auth/DB access, leaked secret, directory exposure report |
| Contain | Rotate exposed credentials (Vercel env / Supabase keys) **via Dashboards**; revoke sessions if Auth compromise suspected; take affected route offline only with owner approval |
| Assess | Scope: which tables/routes/users; whether PostgREST path involved; whether logs show abuse |
| Recover | Patch on a branch → PR → CI → merge → confirm Git-linked Production READY; re-verify Phase 21 PostgREST deny if directory-related |
| Verify | Narrow smoke on affected paths; confirm secrets no longer in client bundles |
| Document | Short incident note under `docs/operations/` or private owner store (no secrets/PII) |

---

## 2. Bad application deployment

| Step | Action |
| --- | --- |
| Detect | Vercel deploy failure, or Production smoke regression after merge |
| Contain | Stop merging further risky PRs; keep prior known-good SHA identified |
| Assess | Diff of merge commit; CI log; Vercel build log |
| Rollback | **Preferred:** Vercel Dashboard → Production deployment → Promote/Rollback to last known-good deployment **or** `git revert` of the bad merge on `main` → CI → auto Production deploy |
| Verify | `/` 200, `/professionals` 200, `/sign-in` 200, `/exco/analytics` anonymous redirect, critical feature of the change |
| Document | Note bad SHA, good SHA, timestamp |

**Verified mechanism (process-level):** Production tracks `main`; prior Gate 4/5/6 merges created Git-linked Production deployments READY. Exact Dashboard click-path is operator-executed; this gate did not perform a destructive rollback drill.

---

## 3. Bad database migration

| Step | Action |
| --- | --- |
| Detect | App errors referencing missing columns/relations; migration apply failure |
| Contain | Freeze further migrations; do not “fix forward” blindly on Production |
| Assess | Identify migration file under `supabase/migrations/`; determine whether Production applied it |
| Recover | Prefer additive forward-fix migration reviewed and authorised. Destructive restore only via Supabase backup/PITR or restore-to-new-project (**never** unauthorised Production overwrite). Schema authority remains `supabase/migrations/*.sql` — not Prisma migrate. |
| Verify | Disposable DB first when possible; then Production smoke |
| Document | Migration name, decision, outcome |

---

## 4. Auth outage

| Step | Action |
| --- | --- |
| Detect | OTP send/verify failures; Supabase Auth status; SMTP failures |
| Contain | Communicate delay to cohort; do not enable open signup to “work around” AUTH-A |
| Assess | Site URL / redirect allow-list drift; SMTP; rate limits; GoTrue errors |
| Recover | Restore Auth Site URL / redirects to azure origin if drifted; repair SMTP via Dashboard (secrets never in Git) |
| Verify | Controlled OTP on designated test account only (AUTH-C) |
| Document | Config drift found; no secrets |

---

## 5. Production misconfiguration (env)

| Step | Action |
| --- | --- |
| Detect | 500s, Auth callback failures, Prisma connection errors |
| Contain | Correct Vercel Production env in Dashboard; redeploy if required |
| Assess | Compare expected public vars (`NEXT_PUBLIC_SITE_URL`, Supabase URL/anon) — never paste secrets into chat/Git |
| Recover | Set correct values; trigger redeploy |
| Verify | Smoke + Auth callback path |
| Document | Which keys were wrong (names only) |

---

## Git revert path (application code)

```bash
git fetch origin
git log -5 --oneline origin/main
git revert -m 1 <merge_commit_sha>   # for merge commits
# or: git revert <commit_sha>
git push origin HEAD:main   # only via PR preferred
```

Prefer: branch → PR → CI PASS → merge (keeps Gate 4 CI enforcement).

---

## Gaps (honest)

```text
- No intentional Production break/fix drill was run in Gate 6A
- Schema-only disposable restore drill PASS; Dashboard backup class + production-data DR still human (see backup-restore.md)
- External paging not configured (see monitoring.md)
```
