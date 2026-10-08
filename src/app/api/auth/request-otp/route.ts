import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { classifyAuthErrorMessage } from "@/lib/auth/classify-auth-error";
import { logger } from "@/lib/logger";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const emailSchema = z.string().trim().email().max(254);

function unwrapEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1);
  }
  return current;
}

/**
 * Same-origin OTP request.
 *
 * Calls Supabase `signInWithOtp` on the server and writes PKCE verifier cookies onto
 * this response so Magic Link exchange works in the browser jar — without exposing
 * provider membership differentials on a browser→Supabase `/auth/v1/otp` call.
 *
 * Outward JSON is identical for member, unknown, inactive, and banned emails.
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const origin =
    unwrapEnv(process.env.NEXT_PUBLIC_SITE_URL)?.replace(/\/$/, "") ||
    new URL(request.url).origin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address.", errorClass: "unknown" },
      { status: 400 },
    );
  }

  const emailRaw =
    body && typeof body === "object" && "email" in body
      ? (body as { email: unknown }).email
      : undefined;
  const nextRaw =
    body && typeof body === "object" && "next" in body
      ? (body as { next: unknown }).next
      : undefined;

  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address.", errorClass: "unknown" },
      { status: 400 },
    );
  }

  const next = sanitizeNextPath(typeof nextRaw === "string" ? nextRaw : null);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", next);
  const emailRedirectTo = callbackUrl.toString();

  const success = NextResponse.json({ ok: true, emailRedirectTo });

  if (process.env.AUTH_E2E_HELPER === "1" && process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, emailRedirectTo, skipSend: true });
  }

  if (!supabaseUrl || !anonKey) {
    logger.warn("auth_sign_in_request_failed", { error_category: "config" });
    return success;
  }

  const email = parsed.data.toLowerCase();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          success.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo,
    },
  });

  if (error) {
    logger.warn("auth_sign_in_request_failed", {
      error_category: classifyAuthErrorMessage(error.message),
    });
  }

  return success;
}
