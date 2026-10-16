# PR #22 — Signed-in acceptance check (Member ↔ EXCO)

**As of:** 2026-10-16  
**Reviewed head:** `b80bc5d01ce73651958997f1860e8996cadfaab5`  
**Merge SHA:** `1a699153cb6259628c9dc1372051aec5f1bf4b04`  
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/22 · **MERGED**

## Production identity (updated 2026-10-16 LC-B recovery)

| Fact | Value |
| --- | --- |
| `origin/main` | `1a69915…` (includes #22) |
| Application tree | merge `1a69915` **===** reviewed head `b80bc5d` (identical git trees) |
| Root cause of lag | **Deployment absent** — no Vercel/GitHub Production (or Preview) deployment was created for `1a69915` after merge; not a failed build; azure still aliased to PR #20 until recovery |
| Recovery action | CLI Production deploy from clean checkout of `1a69915` on linked project `tncod-professionals` (Git webhook never produced a deployment for this SHA). Meta: `githubCommitSha=1a69915`, `deployReason=lc-b-release-recovery-git-webhook-absent` |
| Ready Production (Vercel) | `dpl_DTe6dmsQ51fckqdYPtQmhZZEzJRX` · `https://tncod-professionals-9g33jg1dl-olanailedits-projects.vercel.app` · **aliased to azure** |
| “Member dashboard” on azure | **Present** in deployed application JS after recovery (read-only smoke) |

**Signed-in acceptance** is now unblocked on azure for the #22 journey below. Do not claim browser PASS until the signed-in walk is actually performed.

## Human journey (run only on the #22 Production identity)

Environment: azure once it serves `1a69915`. Account: existing EXCO-capable signed-in user (do not re-assign SUPER_ADMIN).

1. Start on **Member** `/dashboard` (session already established — do not re-sign-in mid-journey).
2. Open **EXCO** from member navigation.
3. Confirm EXCO workspace loads; open **Opportunities** from EXCO manage nav if present.
4. Use the labelled **Member dashboard** control → expect `/dashboard` without typing a URL or signing in again.
5. Confirm member destinations remain: Dashboard, Directory, Profile, Businesses, Opportunities, Settings.
6. Repeat on **desktop**, **phone**, and **tablet**.

Record: PASS/FAIL, device class (model/browser if known — do not invent), Production SHA/deployment id observed.

## Do not

- Re-implement the return link.
- Treat preview HEAD `b80bc5d` as Production acceptance.
- Mark Phase 23C/EXCO surface PASS from this checklist alone without the live Production identity.
