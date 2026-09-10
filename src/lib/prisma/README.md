/**
 * Privileged Prisma access lives in src/lib/prisma/client.ts (server-only).
 * It bypasses RLS. Domain authorization is mandatory (Phase 3 SEC-016).
 * Migration authority: supabase/migrations — not prisma/migrations.
 */
