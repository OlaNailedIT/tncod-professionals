# Operations — Monitoring (minimal)

**Gate 6A status:** **PARTIAL**  
**Date:** 2026-10-12

Telemetry exists. A standing on-call roster with paging is **not** configured in-repo.

---

## What is watched

| Signal | Where | Exists today? |
| --- | --- | --- |
| GitHub Actions CI failures (`ci` workflow on `main` / PRs) | GitHub Actions | YES |
| Vercel Production / Preview deployment success/failure | Vercel dashboard + GitHub deployment statuses | YES |
| Application HTTP availability (origin) | Manual / ad-hoc curl; Vercel runtime logs | PARTIAL (no dedicated uptime product wired in-repo) |
| Next.js runtime / function errors | Vercel logs | YES (provider logs) |
| Supabase DB / Auth health | Supabase Dashboard | YES (provider console) |
| Auth email delivery (SMTP) | Gmail / Auth logs (operator) | PARTIAL (manual) |

---

## Who responds

| Role | Duty |
| --- | --- |
| Product owner | Primary escalation contact for Production incidents |
| Engineering executor (when engaged) | Triage CI/deploy failures; coordinate Auth/DB checks |

No separate 24/7 on-call organisation is claimed.

---

## Escalation triggers (minimal)

Escalate to the product owner when any of the following occur:

- Production deployment **fails** or Production alias serves errors broadly  
- GitHub Actions `ci` on `main` fails repeatedly after merge  
- Members cannot complete OTP sign-in (Auth/SMTP outage)  
- Suspected data exposure or security incident (see incident runbook)

---

## Honest gaps

```text
External alerting (PagerDuty/Slack/email pages): NOT CONFIGURED in repository evidence
Dedicated synthetic uptime monitors: NOT CONFIGURED in repository evidence
```

Monitoring is therefore **PARTIAL**: dashboards/logs exist; proactive alert routing is not proven.
