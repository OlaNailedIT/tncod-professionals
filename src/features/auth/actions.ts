"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import {
  classifyAuthErrorMessage,
  signInRequestUserMessage,
  type AuthErrorClass,
} from "@/lib/auth/classify-auth-error";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma/client";
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

async function registeredAppUserExists(email: string): Promise<boolean> {
  try {
    const prisma = getPrisma();
    const row = await prisma.user.findFirst({
      where: {
        email,
        accountStatus: "ACTIVE",
        deletedAt: null,
        profile: { is: { deletedAt: null } },
      },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

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

  if (process.env.AUTH_E2E_HELPER === "1" && process.env.NODE_ENV !== "production") {
    return { ok: true };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}${next}`,
    },
  });

  if (error) {
    const errorClass = classifyAuthErrorMessage(error.message);
    if (errorClass === "user_or_policy") {
      // Anti-enumeration for unknown emails only. If public.users has this email,
      // Auth rejected a real member — do not pretend a code was sent.
      const knownMember = await registeredAppUserExists(email);
      if (knownMember) {
        logger.warn("auth_sign_in_request_failed", {
          error_category: "otp_send_known_member",
        });
        return {
          ok: false,
          message: GENERIC_REQUEST_FAIL,
          errorClass: "otp_send",
        };
      }
      logger.info("auth_sign_in_request_neutralized", { error_category: errorClass });
      return { ok: true };
    }
    logger.warn("auth_sign_in_request_failed", {
      error_category: errorClass === "unknown" ? "otp_send" : errorClass,
    });
    // Message assumes code input will be shown for rate_limit (UI advances to code step).
    return {
      ok: false,
      message: signInRequestUserMessage(errorClass, {
        codeInputVisible: errorClass === "rate_limit",
      }),
      errorClass,
    };
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
