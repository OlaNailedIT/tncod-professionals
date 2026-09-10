# Supabase policies (design artifacts)

These SQL files are the **Phase 3 RLS/storage contract**. They are **not** applied and are **not** the live migration history.

Authoritative migrations remain `supabase/migrations/` (empty until the database gate / Phase 4).

```text
00-helpers.sql              identity + role helpers
10-rls-policies.sql         table RLS + directory projection
20-privileged-columns.sql   member cannot set verify/publish columns
30-storage.sql              private bucket object policies
```

Do not enable RLS in development by disabling it. Test fixtures use seed identities, not `USING (true)`.
