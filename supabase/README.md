# Supabase

**One PostgreSQL database.** Prisma is the application ORM and type contract. It is **not** a second database and **not** the migration authority.

```text
supabase/migrations/*.sql     ← authoritative schema evolution
        ↓
Supabase PostgreSQL
        ↓
Prisma schema/client          ← types and queries
        ↓
Application
```

Do **not** add `prisma/migrations` as a competing history.

Migrations **exist** (2026082712*). They have **not** been applied (Postgres was unreachable on the database-gate attempt).

Auth trigger (`auth.users` → `public.users`): SQL exists as `20260827140000_auth_user_sync.sql` (**not applied**; database gate BLOCKED). Must not self-elevate.

Design SQL source: `supabase/policies/`. Gate copies them into `20260827120200_security_rls.sql` and `20260827120300_storage_security.sql`.
