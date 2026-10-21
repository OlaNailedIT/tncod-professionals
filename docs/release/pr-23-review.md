# PR #23 — Dashboard clarity review (LC-B)

**As of:** 2026-10-17
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/23  
**Head:** `7f517fb6bb02f18836902074e7d12d0a4ef9aa02`

**Checks:** fresh local verification PASS; CI verify PASS ([run 38954110458](https://github.com/OlaNailedIT/tncod-professionals/actions/runs/38954110458)); new-head Vercel preview PASS. Earlier-head checks were not reused to certify this head.
**Disposition:** **RELEASED WITH NARROW CORRECTION** — publication does not prove effective directory listing. Migration/Auth/roles untouched. Owner explicitly approved PR #23 release only. Merged at `2026-10-17T05:28:42Z` as `52f3d8c1edeeb6dc5965c1129431148a8a2a8500`; main matched at that release and later main includes it. No check bypass.

## Production release evidence

- Deployment `dpl_83ezLvKX2czfGg3F3a4YWkupFEej`: `READY`, target `production`, source `git`; both `gitSource.sha` and `meta.githubCommitSha` equal the merge SHA.
- Project `prj_YL2rguqWGr4kSjJTQhuU7r8g6pce`, team `team_zvTxCHUqJDtCr1ezQWjg0LcR`; azure alias assigned, no alias error.
- Read-only smoke: `/`, `/sign-in`, `/join`, `/professionals` returned 200; `/dashboard` and `/exco` returned 307 to sign-in with matching `next` destinations. Six checks; no failed request. No forms submitted or member data changed.
- Authenticated dashboard CTA acceptance and participant comprehension remain pending. HTTP success is not signed-in flow verification or Phase 23D closure.
- Historical #22 missing automatic deployment remains unexplained; #23 deployed automatically. No manual deploy, paid resource, migration, Auth key or role change was used for #23.

## Review against charter criteria

| Criterion | Finding |
| --- | --- |
| Raw enums replaced | Uses `presentProfileStatus` / `presentVerificationStatus` / `presentVisibilityStatus`; completion shown as percent |
| Dimensions stay separate | Profile + Completion% + Verification + Directory badges remain independent |
| One next-step section | `resolveMemberNextAction` card + primary CTA |
| Welcoming intro | `PageIntro` purpose matches intended community wording |
| Profile edit + privacy discoverable | Secondary: Explore opportunities · View profile · Privacy settings · Edit profile |
| PENDING ≠ UNDER_REVIEW | Distinct titles/bodies; tests assert no cross-claim |
| Clarification / rejected | Clarification and rejected paths → `/profile` with accurate CTAs |
| Directory claim | Corrected: `VERIFIED` ∧ `DIRECTORY` reports publication, not guaranteed listing. Actual directory eligibility also checks public identity preference and a public slug. No query or privacy-policy changes. |
| SUBMITTED lifecycle | Not altered; Phase 12 ownership preserved |
| CTA destinations | `/profile`, `/profile/edit`, `/opportunities`, `/professionals`, `/settings/privacy` — existing routes |
| Scope creep | No business discovery, Help Centre, notifications, redesign |
| Regression | Fresh run: next-action 12 + completion 18 + EXCO return 3 = 33 passed, 0 failed, 0 skipped. Typecheck, changed-file lint and build PASS. The changed assertion failed before the correction and passed afterward. |

## Limitations (honest)

- Authenticated browser walk of each CTA: **pending** until released candidate.
- Full Phase 23D participant comprehension: **not** claimed by this PR.
- Secondary “Explore opportunities” can duplicate the primary CTA in PENDING/UNDER_REVIEW — acceptable, not a defect.

## Dependency on #21

**None.** #23 is dashboard copy/logic only (next-action labels, PageIntro, CTAs). It does not import interest-roster code, migrations, or EXCO opportunity queries. Prior “after #21” sequencing was queue preference, not a hard dependency.

## Historical recommended queue order — superseded by recorded releases

1. #22 Production recovery is done (`dpl_DTe6dmsQ…` on azure) — run signed-in acceptance.
2. #23 may merge/release independently of #21 (docs+UI only; no DB). Retest dashboard wording/destinations after release.
3. #21 still requires explicit owner migration authorization before Production apply/merge.

Update 2026-10-18: #21 subsequently received exact owner approval, its named
migration committed and was read back, and its merge `ce2ebaa` deployed through
Git as READY `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK`. No #23 re-implementation or
re-release is needed; remaining human comprehension/CTA acceptance is separate.

## Do not

- Open a second dashboard-clarity implementation.
- Expand #23 into parked Phase 23D surfaces wholesale.
