# PR #22 — Signed-in acceptance check (Member ↔ EXCO)

**As of:** 2026-10-18 — desktop return verified; remaining physical-device checks only
**Reviewed head:** `b80bc5d01ce73651958997f1860e8996cadfaab5`  
**Merge SHA:** `1a699153cb6259628c9dc1372051aec5f1bf4b04`  
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/22 · **MERGED**

## Current acceptance baseline — do not deploy an older build

Current main includes #22 at `ce2ebaaa8fa507b0669a7565b67bbadd6673aaeb`.
Azure serves Git-linked READY `dpl_7b6CRFCKJDW6zp6xnrMgbGpMH5pK`, with the preserved private
Auth configuration. Actual desktop Member → EXCO → Member navigation passed in
Stage B and again after Stage C key retirement. Do not ask for another desktop
sign-in/return test without a new regression. Evidence: `auth-a-stage-c-retirement.md`.
PR #21 release identity/configuration: `pr-21-production-release-2026-10-18.md`.

Physical phone/tablet EXCO return and the full EXCO surface checklist remain open.
Use the current verified release containing #22; **never roll back to the historical
legacy-dependent #22 recovery artifact just to run this checklist**.

## Historical Production identity (2026-10-16 LC-B recovery; superseded)

| Fact | Value |
| --- | --- |
| `origin/main` | `1a69915…` (includes #22) |
| Application tree | merge `1a69915` **===** reviewed head `b80bc5d` (identical git trees) |
| Root cause of lag | **Deployment absent** — no Vercel/GitHub Production (or Preview) deployment was created for `1a69915` after merge; not a failed build; azure still aliased to PR #20 until recovery |
| Recovery action | CLI Production deploy from clean checkout of `1a69915` on linked project `tncod-professionals` (Git webhook never produced a deployment for this SHA). Meta: `githubCommitSha=1a69915`, `deployReason=lc-b-release-recovery-git-webhook-absent` |
| Ready Production (Vercel) | `dpl_DTe6dmsQ51fckqdYPtQmhZZEzJRX` · `https://tncod-professionals-9g33jg1dl-olanailedits-projects.vercel.app` · aliases: **azure**, project default, **git-main** (git-main re-pointed 2026-10-16 after lagging on `dpl_BdtPVaT`) |
| GitHub Deployments API | Latest recorded Production still `7115716634` / `71b5570` — **no** GitHub deployment row for `1a69915` (webhook absent; Vercel Ready + azure alias are authoritative) |
| “Member dashboard” on azure | **Present** in deployed application JS after recovery (read-only smoke; homepage chunk `page-0853a8d8daaf56e6.js`) |

The table above is historical recovery evidence, not today's deployment target.

## Remaining physical-device journey (current verified release containing #22)

Environment: current verified azure release. Account: existing EXCO-capable signed-in user (do not re-assign SUPER_ADMIN).

1. Start on **Member** `/dashboard` (session already established — do not re-sign-in mid-journey).
2. Open **EXCO** from member navigation.
3. Confirm EXCO workspace loads; open **Opportunities** from EXCO manage nav if present.
4. Use the labelled **Member dashboard** control → expect `/dashboard` without typing a URL or signing in again.
5. Confirm member destinations remain: Dashboard, Directory, Profile, Businesses, Opportunities, Settings.
6. Complete only the still-unverified **phone** and **tablet** checks. Desktop is already verified.

Record: PASS/FAIL, device class (model/browser if known — do not invent), Production SHA/deployment id observed.

## Do not

- Re-implement the return link.
- Treat preview HEAD `b80bc5d` as Production acceptance.
- Mark Phase 23C/EXCO surface PASS from this checklist alone without the live Production identity.
