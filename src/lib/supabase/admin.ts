import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";
import { requireServiceRoleKey } from "@/lib/env/server";

/**
 * Privileged client. Server-only. Never import from client components.
 * Does not replace domain authorization. Prisma with DATABASE_URL also bypasses RLS.
 */
export function createServiceRoleClient() {
  const config = getSessionSupabaseConfig();
  if (!config) {
    throw new Error("Supabase URL is required for the service-role client");
  }
  return createClient(config.url, requireServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
