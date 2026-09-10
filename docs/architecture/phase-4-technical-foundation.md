# Phase 4 — Technical foundation

**Status:** Application foundation **IMPLEMENTED**. Auth/runtime integration **COMPLETED** on local disposable Supabase (2026-09-06). See `docs/architecture/phase-4-runtime-completion-report.md`.  
**Date:** 2026-09-06 (runtime completion)  

## Validation (this machine)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASSED** |
| `npx eslint .` | **PASSED** |
| `npx vitest run` | **PASSED** |
| Auth `auth.users` → `public.users` | **EXECUTED / PASSED** |
| Storage HTTP | **EXECUTED / PASSED** |
| RLS SQL suite | **EXECUTED / PASSED** (38 tests) |

This is not product-feature development. Starter conventions are not product architecture.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (Button primitive), Lucide, Supabase JS/SSR, Prisma ORM, Zod, React Hook Form + Zod resolver, Vitest, Playwright, ESLint, Vercel-compatible `next build`.

## Structure

```text
src/app/            shell + health + session probe
src/middleware.ts   cookie/session refresh only
src/components/ui/  primitives
src/lib/env         public vs server env (Zod)
src/lib/supabase    browser / server / service-role
src/lib/prisma      privileged Prisma (bypasses RLS)
src/lib/validation  parseInput + useZodForm
src/server/auth     getAuthenticatedUser
src/server/authorization  DB-backed permission/role checks
src/security        Phase 3 catalogue (unchanged contract)
src/types           independent status dimensions
```

## Server / client

Default: Server Components. Client: `button.tsx`, `supabase/browser.ts`, `validation/form.ts`.  
`server-only` on Prisma, service-role client, server env, session, authorization loaders.

## Supabase clients

| Client | Location | Credential |
| --- | --- | --- |
| Browser | `src/lib/supabase/browser.ts` | `NEXT_PUBLIC_*` anon only |
| Server session | `src/lib/supabase/server.ts` | anon + cookies |
| Service role | `src/lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` server-only |

## Prisma

Not migration authority. `supabase/migrations/` remains authoritative. Prisma queries **bypass RLS**. Domain helpers in `src/server/authorization` must run first.

## Auth trigger

SQL: `supabase/migrations/20260827140000_auth_user_sync.sql` — **APPLIED** on local disposable Postgres. Assigns `MEMBER` only. Does not read metadata for EXCO/SUPER_ADMIN.

## Environment

`.env.example` documents public vs server vars. `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is rejected.

## Testing

Vitest: authorization + env + errors. Playwright: foundation shell + session JSON probe (not product UI). Database RLS and Storage HTTP: see Phase 4 runtime report.

## Deployment

Vercel-compatible Next.js. Vercel is not the database.

## Deferred (not Phase 4 runtime)

Auth UI. Feature UI. Domain commands. CSRF by transport. Rate limits. Dual Prisma/RLS clients. Signed URL helpers. Phase 5 design system.

## Database gate

**PASS** (2026-09-06). Historical unavailability of Postgres is no longer current.
