# PR #23 — Dashboard clarity review (LC-B)

**As of:** 2026-10-16  
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/23  
**Head:** `7f517fb6bb02f18836902074e7d12d0a4ef9aa02`

**Checks:** fresh local verification PASS; CI verify PASS ([run 38954110458](https://github.com/OlaNailedIT/tncod-professionals/actions/runs/38954110458)); new-head Vercel preview PASS. Earlier-head checks were not reused to certify this head.
**Disposition:** **REVIEWED WITH NARROW CORRECTION** — publication does not prove effective directory listing. Migration/Auth/roles untouched. PR remains open.

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

## Recommended release order relative to queue

1. #22 Production recovery is done (`dpl_DTe6dmsQ…` on azure) — run signed-in acceptance.
2. #23 may merge/release independently of #21 (docs+UI only; no DB). Retest dashboard wording/destinations after release.
3. #21 still requires explicit owner migration authorization before Production apply/merge.

## Do not

- Open a second dashboard-clarity implementation.
- Expand #23 into parked Phase 23D surfaces wholesale.
