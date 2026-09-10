# Verification environment

**Status:** **PASS** (2026-09-07) — browser verification restored; Phase 5.5 residual live evidence collected  
**Does not authorize Phase 5.6.**

## Problem diagnosed

| Observation | Meaning |
| --- | --- |
| `@playwright/test` installed (`1.62.1`) | Package available |
| `request`-only smoke tests passed | Layer 3 available without Chromium |
| `page`-based tests failed | `chrome-headless-shell` missing |
| `PLAYWRIGHT_BROWSERS_PATH` | Cursor agent shells pointed at empty Temp sandbox cache under `cursor-sandbox-cache\…\playwright` |
| Default `%LOCALAPPDATA%\ms-playwright` | Missing |

```text
Playwright package installed
≠
Playwright browser available
```

## Remediation (smallest durable change)

1. Project-local browser cache: `.cache/ms-playwright` (gitignored).
2. Wrapper: `scripts/run-playwright.mjs` overrides `PLAYWRIGHT_BROWSERS_PATH` so install and test share one path (not disposable Temp).
3. Scripts:
   - `npm run test:e2e:install` — download Chromium for this project
   - `npm run test:e2e` — run all Playwright tests via the wrapper
   - `npm run test:e2e:ready` — browser readiness only
4. Tests:
   - `e2e/browser-readiness.spec.ts` — Layer 4 readiness (launch fails loudly if browser missing)
   - `e2e/phase-5-5-browser-evidence.spec.ts` — Phase 5.5 residual viewport/overflow/focus/disabled checks
   - `e2e/smoke.spec.ts` — Layer 3 request smoke (unchanged)

Do **not** use `playwright install --with-deps` on Windows for this gate unless OS libraries are proven missing.

## Verification layers (contract)

| Layer | What it proves | Commands |
| --- | --- | --- |
| 1 Source | Types / lint / units | `npm run typecheck` · `npm run lint` · `npm test` |
| 2 Build | Production compile | `npm run build` |
| 3 Request smoke | Routes / HTML content | part of `npm run test:e2e` (`request` fixtures) |
| 4 Real browser | Viewport, overflow, focus, interaction | readiness + `phase-5-5-browser-evidence` via `npm run test:e2e` |

A green Layer 3 suite must **not** be treated as proof of Layer 4.

## Evidence collected (2026-09-07)

```text
npm run test:e2e:install     → Chromium + headless shell in .cache/ms-playwright
npm run test:e2e:ready       → 2/2 PASS (launch + page fixture)
Phase 5.5 browser evidence   → overflow @ 320–1280 PASS; wrap PASS; focus/disabled PASS; routes PASS
request smoke                → 3/3 PASS
```

## First-time / after cache wipe

```bash
npm run test:e2e:install
npm run test:e2e:ready
npm run test:e2e
```

## Scope control

This remediation does not:

- reopen Phase 5.5 component design
- implement Phase 5.6
- change product UI to make tests pass
- touch database / Auth / RLS / Storage / API
