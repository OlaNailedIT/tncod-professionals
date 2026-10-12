# Monitoring closeout — Gate 6B

**Result:** **MONITORING: PASS — MANUAL CONTROLLED-LAUNCH MODEL**

Automated paging is **not** configured. For controlled launch / pilot, the following manual model is explicit and sustainable.

---

## What is watched

| Signal | Where noticed |
| --- | --- |
| GitHub Actions `ci` failures on `main` / PRs | GitHub Actions UI + email notifications if enabled on the GitHub account |
| Vercel Production / Preview deploy failures | Vercel Dashboard; GitHub deployment statuses (may lag — verify live origin when unsure) |
| Application runtime errors | Vercel Runtime Logs for Production |
| Supabase DB / Auth / API health | Supabase Dashboard (project `brpppukzqgpzxjelwwrj`) |
| Auth email delivery | Operator mailbox / Auth logs (manual) |

---

## Responsible operator

| Role | Person |
| --- | --- |
| Primary | Product owner (platform operator) |
| Secondary | Engineering executor when engaged on a gate |

## Cadence (controlled launch)

- After every merge to `main`: confirm CI green + Production origin smoke (`/`, `/professionals`, `/sign-in`, `/privacy`) within the same working session.  
- Daily during active pilot: glance Vercel Production status + Supabase project health.  
- On any member report of Auth failure: check Auth + SMTP path same day.

## Incident recording

Short non-secret notes under `docs/operations/` or a private owner store. No secrets/PII in Git.

## Gaps retained (honest)

```text
No PagerDuty/Slack page routing configured
GitHub Deployments metadata may lag Vercel alias updates
```
