"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { type AuthErrorClass } from "@/lib/auth/classify-auth-error";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activeIdentityExists } from "@/server/auth/active-identity";

const emailSchema = z.string().trim().email().max(254);

export type SignInRequestResult =
  | { ok: true; emailRedirectTo: string; skipSend?: boolean }
  | { ok: false; message: string; errorClass: AuthErrorClass };

export type SignInVerifyResult =
  | { ok: true; next: string }
  | { ok: false; message: string };

/**
 * Prepare a passwordless sign-in request.
 *
 * Does **not** call `signInWithOtp` on the server. The PKCE code verifier must be
 * written by the browser client so the later Magic Link callback can exchange
 * the auth code in the same cookie jar (Production: `pkce_exchange` when the
 * verifier was only set in a Server Action cookie context).
 */
export async function requestSignInOtpAction(input: {
  email: unknown;
  next?: unknown;
}): Promise<SignInRequestResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address.", errorClass: "unknown" };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
  const next = sanitizeNextPath(typeof input.next === "string" ? input.next : null);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);
  const emailRedirectTo = callbackUrl.toString();

  if (process.env.AUTH_E2E_HELPER === "1" && process.env.NODE_ENV !== "production") {
    return { ok: true, emailRedirectTo, skipSend: true };
  }

  return { ok: true, emailRedirectTo };
}

export async function verifySignInOtpAction(input: {
  email: unknown;
  token: unknown;
  next?: unknown;
}): Promise<SignInVerifyResult> {
  const emailParsed = emailSchema.safeParse(input.email);
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!emailParsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (!/^\d{6,8}$/.test(token)) {
    return { ok: false, message: "Enter the code from your email." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, message: "We could not verify the code right now. Please try again." };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: emailParsed.data.toLowerCase(),
    token,
    type: "email",
  });

  if (error) {
    logger.info("auth_sign_in_verify_failed", { error_category: "otp_verify" });
    return {
      ok: false,
      message: "That code is invalid or has expired. Request a new code and try again.",
    };
  }

  if (!data.user || !(await activeIdentityExists(data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    logger.info("auth_sign_in_verify_failed", { error_category: "inactive_identity" });
    return {
      ok: false,
      message: "That code is invalid or has expired. Request a new code and try again.",
    };
  }

  const next = sanitizeNextPath(typeof input.next === "string" ? input.next : null);
  return { ok: true, next };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
