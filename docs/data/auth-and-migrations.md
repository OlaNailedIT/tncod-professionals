# Auth sync and migration authority (Phase 2 contract)

**Not implemented in this phase (historical Phase 2 note).** Live trigger: see Phase 4 runtime report.

## Platform

```text
Supabase
├── PostgreSQL     ← only database
├── Auth
└── Storage        ← private document objects (policies: Phase 3)

Prisma             ← ORM, generated client, TypeScript types, schema representation
```

Prisma and Supabase are **not** two databases.

## Migration authority

**Authoritative:** `supabase/migrations/*.sql` (files created at the database gate; **not applied** until Postgres exists).

**Not authoritative:** `prisma/migrations` — must **not** be introduced as a second history.

`prisma/sql/checks.sql` is folded into `supabase/migrations/20260827120100_checks_and_constraints.sql`.

The Auth trigger SQL is a **Phase 4** file (`supabase/migrations/20260827140000_auth_user_sync.sql`). On local disposable Postgres it is **APPLIED** (2026-09-06). Schema remains compatible (`users.id` UUID, no password column).

## Auth identity

```text
auth.users
    ↓  controlled database trigger (Phase 4)
public.users          users.id = auth.users.id
    ↓
profiles
```

The trigger **MUST NOT**:

- read privileged roles from user-controlled metadata
- assign `EXCO_ADMIN` or `SUPER_ADMIN`
- assign arbitrary permissions
- let new users self-elevate

Default: create `public.users` + optional `MEMBER` via seed of roles table, not via JWT claims. Privileged roles: **SUPER_ADMIN only** may assign administrative roles (`user.manage_roles`).

## Documents vs Storage

PostgreSQL `documents` = metadata (`storage_key`, type, status).  
Supabase Storage = binary object. Never public URLs. EXCO: application **view-only** (Phase 3). Copying cannot be made technically impossible in a browser.
