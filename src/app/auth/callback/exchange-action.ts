"use server";

import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activeIdentityExists } from "@/server/auth/active-identity";

/** Exchange the PKCE code in the same server-cookie context that requested it. */
export async function exchangeSignInCodeAction(
  code: string,
): Promise<{ error: "invalid" | null }> {
  if (typeof code !== "string" || !code || code.length > 2048) {
    return { error: "invalid" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "invalid" };

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    const raw = (error?.message || "").toLowerCase();
    const providerClass = raw.includes("code verifier") || raw.includes("code_verifier")
      ? "bad_code_verifier"
      : raw.includes("expired") || raw.includes("already been used") || raw.includes("otp_expired")
        ? "code_consumed_or_expired"
        : raw.includes("flow state")
          ? "flow_state"
          : "pkce_exchange";
    logger.info("auth_link_exchange_failed", {
      error_category: "pkce_exchange",
      provider_class: providerClass,
    });
    return { error: "invalid" };
  }
  if (!(await activeIdentityExists(data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    logger.info("auth_link_exchange_failed", { error_category: "inactive_identity" });
    return { error: "invalid" };
  }

  return { error: null };
}
