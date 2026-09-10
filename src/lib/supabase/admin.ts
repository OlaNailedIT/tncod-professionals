import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicEnv, hasBrowserSupabaseConfig } from "@/lib/env/public";
import { requireServiceRoleKey } from "@/lib/env/server";

/**
 * Privileged client. Server-only. Never import from client components.
 * Does not replace domain authorization. Prisma with DATABASE_URL also bypasses RLS.
 */
export function createServiceRoleClient() {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error("Supabase URL is required for the service-role client");
  }
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
