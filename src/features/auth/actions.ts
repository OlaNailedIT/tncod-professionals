"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import {
  classifyAuthErrorMessage,
  type AuthErrorClass,
} from "@/lib/auth/classify-auth-error";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { activeIdentityExists } from "@/server/auth/active-identity";

const emailSchema = z.string().trim().email().max(254);

export type SignInRequestResult =
  | { ok: true }
  | { ok: false; message: string; errorClass: AuthErrorClass };

export type SignInVerifyResult =
  | { ok: true; next: string }
  | { ok: false; message: string };

const GENERIC_REQUEST_FAIL =
  "We could not send a sign-in code right now. Please wait a moment and try again.";

export async function requestSignInOtpAction(input: {
  email: unknown;
  next?: unknown;
}): Promise<SignInRequestResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address.", errorClass: "unknown" };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_REQUEST_FAIL, errorClass: "config" };
  }

  const email = parsed.data.toLowerCase();
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
  const next = sanitizeNextPath(typeof input.next === "string" ? input.next : null);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);

  if (process.env.AUTH_E2E_HELPER === "1" && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    const errorClass = classifyAuthErrorMessage(error.message);
    logger.warn("auth_sign_in_request_failed", {
      error_category: errorClass,
    });
    // Keep the outward response identical for unknown, inactive, banned, and
    // rate-limited identities. Provider detail remains in structured logs.
    return { ok: true };
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
