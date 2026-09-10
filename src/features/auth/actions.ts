"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email().max(254);

export type SignInRequestResult =
  | { ok: true }
  | { ok: false; message: string };

export type SignInVerifyResult =
  | { ok: true; next: string }
  | { ok: false; message: string };

/**
 * Neutral messaging — avoids confirming whether an account exists.
 */
const GENERIC_REQUEST_FAIL =
  "We could not send a sign-in code right now. Please wait a moment and try again.";

export async function requestSignInOtpAction(input: {
  email: unknown;
  next?: unknown;
}): Promise<SignInRequestResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_REQUEST_FAIL };
  }

  const email = parsed.data.toLowerCase();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
  const next = sanitizeNextPath(typeof input.next === "string" ? input.next : null);

  // Local e2e: skip Auth email send (flaky under load). OTP comes from /api/test/auth-otp.
  if (process.env.AUTH_E2E_HELPER === "1" && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // Still return neutral success when user is missing — reduces enumeration.
    const msg = error.message.toLowerCase();
    if (msg.includes("signups not allowed") || msg.includes("user not found") || msg.includes("unable")) {
      logger.info("auth_sign_in_request_neutralized", { error_category: "user_or_policy" });
      return { ok: true };
    }
    logger.warn("auth_sign_in_request_failed", { error_category: "otp_send", message: error.message });
    return { ok: false, message: GENERIC_REQUEST_FAIL };
  }

  return { ok: true };
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

  const { error } = await supabase.auth.verifyOtp({
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
