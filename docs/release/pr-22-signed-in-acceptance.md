# PR #22 — Signed-in acceptance check (Member ↔ EXCO)

**As of:** 2026-10-16  
**Reviewed head:** `b80bc5d01ce73651958997f1860e8996cadfaab5`  
**Merge SHA:** `1a699153cb6259628c9dc1372051aec5f1bf4b04`  
**PR:** https://github.com/OlaNailedIT/tncod-professionals/pull/22 · **MERGED**

## Production identity (fresh read 2026-10-16)

| Fact | Value |
| --- | --- |
| `origin/main` | `1a69915…` (includes #22) |
| Ready Production (GitHub) | still `7115716634` · sha `71b5570…` (PR #20) |
| Vercel Production | `dpl_BdtPVaTNnKktWxLSWe1KqQFanHjQ` · aliases include azure + `git-main` |
| Azure homepage chunk | still `app/page-2194e43327d5ea22.js` |
| “Member dashboard” on azure | **Not present** at last read-only smoke |

**Conclusion:** code is on `main`, but **Git-linked Production has not deployed `1a69915`**. Signed-in acceptance against azure is **blocked until** a Ready Production deployment for `1a69915` (or an owner-authorized equivalent) is confirmed.

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
