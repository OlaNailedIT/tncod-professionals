# Netlify fallback — isolated proof

Base release: `b9e133b1bb3f1bd3b3f8db481b57cdb29e2ecfbd`.
Scope: hosting compatibility for the existing application. No database migration, key change, feature redesign or Production cutover.

## What changes

- Explicitly activate Netlify's Next.js adapter, generate Prisma before the build and include the Node 20+ Linux engine target alongside native. The datasource and runtime transaction-pooler fix are unchanged. The actual hosted project omitted adapter activation despite framework detection, so automatic detection alone is insufficient evidence.
- Preserve the design laboratory's Production 404 for both Vercel and Netlify deployment contexts. Local and preview access stays available.
- Match the existing `0 3 * * *` UTC registration-cleanup schedule on Netlify. The scheduled function requires the runtime context to identify a published Production deploy, then calls that deploy's existing authenticated cleanup route. It does not duplicate cleanup SQL or weaken the route's bearer check.
- The maintenance sender rejects missing/short secrets, invalid deployment identities and preview/unpublished invocations. Redirects are refused so the secret cannot be forwarded elsewhere. Errors omit response bodies. The sender times out at 25 seconds to fit Netlify's documented 30-second scheduled-function limit; verify real completion before any cutover.

The Vercel cron remains intact. Do not activate two live maintenance operators inadvertently; confirm the active schedule during an explicitly approved cutover.

## Local proof

The new checkout has no copied `.env` files. Use loopback-only database/Auth placeholders for builds. Never import a Production environment file or attach Production member data to this proof.

Required validation: focused context/maintenance tests and existing cleanup-route authorization tests; changed-file lint; typecheck; Next build through Netlify's adapter; generated engine and function/schedule packaging inspection. Build success alone does not prove hosted connectivity or member journeys.

## Hosted proof and cutover conditions

1. Verify the actual account is Free with no paid trial/add-ons. Start with a private, isolated project. Account terms and any new repository/account access require the owner's involvement at the relevant step.
2. Configure only approved isolated test configuration. Production credentials must not be copied to a new runtime without specific authorization. Preserve server-only Auth controls, Preview isolation and the existing database pool fix.
3. Record deployed SHA and deployment identity. Verify the hidden laboratory, access denial, public pages and correct asset/runtime packaging. Then prove real registration protection, email-code callback, member and EXCO journeys against an explicitly approved environment. Verify signed-out/private responses are not cached across users.
4. Check the exact deployed maintenance trigger and its bounded logs. A scheduled badge alone is not proof of successful cleanup; do not invoke it against Production as a synthetic test.
5. Confirm actual credit usage and response to exhaustion. Netlify Free has a hard usage cap; no paid recovery is authorized.
6. Present the concrete deployment and results before any final hosting/DNS decision. Preserve `codprofessionals.69resources.com` and azure service; do not use azure as a proxy to evade Vercel's eligibility decision. If those constraints cannot be met, stop for an explicit decision.

Primary references: [Netlify Next.js adapter](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/), [Prisma v6 Netlify packaging](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-netlify), [scheduled functions](https://docs.netlify.com/build/functions/scheduled-functions/), [runtime context](https://docs.netlify.com/build/functions/api/#deploy), and [runtime environment availability](https://docs.netlify.com/build/functions/environment-variables/).

Status: implementation prepared; validation results are recorded in the accompanying PR. No hosted journey or Production gate is closed by this document.
