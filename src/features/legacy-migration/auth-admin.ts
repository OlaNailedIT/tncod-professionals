/**
 * Phase 18A — migration Auth admin adapter (server/script only).
 * Uses explicit import credentials — never browser env.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthCreateResult, MigrationAuthAdmin } from "@/features/legacy-migration/execute";

export function createMigrationAuthAdmin(input: {
  supabaseUrl: string;
  serviceRoleKey: string;
}): MigrationAuthAdmin {
  const client: SupabaseClient = createClient(input.supabaseUrl, input.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async createUserWithoutPassword(email: string): Promise<AuthCreateResult> {
      const { data, error } = await client.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { legacy_import: true },
        app_metadata: {},
      });
      if (error || !data.user) {
        const msg = (error?.message || "auth create failed").toLowerCase();
        const duplicate =
          msg.includes("already") || msg.includes("registered") || msg.includes("exists");
        return { ok: false, duplicate, message: error?.message || "auth create failed" };
      }
      return { ok: true, userId: data.user.id, created: true };
    },
  };
}
