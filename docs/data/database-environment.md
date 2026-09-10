# Database environment (gate prerequisite)

**Status:** Local Supabase Postgres, Auth, and Storage are **RUNNING**. Phase 2 Database Gate **PASS** (2026-09-06). Phase 4 Auth trigger **APPLIED** (2026-09-06). Phase 5 **not** started.

This is not a schema redesign.

## Required shape

```text
Docker Desktop
        ↓
npx supabase start   (local stack; disposable)
        ↓
apply supabase/migrations/20260827120*.sql   ← Database Gate only
        ↓
seed + integrity + RLS/Storage tests
```

Do **not** apply `supabase/migrations/20260827140000_auth_user_sync.sql` as part of the Phase 2 database gate.

Do **not** use `prisma migrate`. Do **not** create `prisma/migrations/`.

`supabase/config.toml` `[db.migrations] enabled = false` until the Database Gate is instructed to APPLY project SQL.

## Safety

Acceptable targets: **LOCAL** / **DEVELOPMENT** / **DISPOSABLE TEST**.

## This machine (2026-09-06)

| Service | Result |
| --- | --- |
| Docker | Reachable (Desktop 29.7.2) |
| PostgreSQL | **HEALTHY** — `127.0.0.1:54322`, version **17.6** |
| Auth | **HEALTHY** — `http://127.0.0.1:54321/auth/v1/health` HTTP 200 |
| Storage | **HEALTHY** — `http://127.0.0.1:54321/storage/v1/status` HTTP 200 |
| Studio | Not started (not required for SQL/RLS/Storage policy tests) |
| Realtime | Not started (not required for planned gate tests) |
| Classification | **LOCAL / DISPOSABLE** |
| TNCOD migrations | **NOT APPLIED** |
| `member-documents` bucket | **NOT CREATED** (Storage SQL not applied) |
| Seed / probes / RLS tests | **NOT EXECUTED** |

Local credentials from `npx supabase status` must stay out of git and out of `NEXT_PUBLIC_*` except the published anon key when the app is wired later.

Do not treat this as a Database Gate pass.
