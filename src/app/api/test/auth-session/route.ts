import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * LOCAL / disposable gate helper only.
 * Establishes a real Auth session via Set-Cookie for Playwright evidence.
 * Enabled when AUTH_E2E_HELPER=1. Never enable in production.
 */
export async function POST(request: Request) {
  if (process.env.AUTH_E2E_HELPER !== "1") {
    return NextResponse.json({ error: "DISABLED" }, { status: 404 });
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "DISABLED" }, { status: 404 });
  }
  const config = getSessionSupabaseConfig();
  if (!config) {
    return NextResponse.json({ error: "NO_SUPABASE" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = z.object({ email: z.string().email() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json({ error: "GENERATE_FAILED" }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, email });
    const supabase = createServerClient(
      config.url,
      config.key,
      {
        cookies: {
          getAll() {
            return request.headers
              .get("cookie")
              ?.split("; ")
              .filter(Boolean)
              .map((c) => {
                const eq = c.indexOf("=");
                return {
                  name: eq === -1 ? c : c.slice(0, eq),
                  value: eq === -1 ? "" : c.slice(eq + 1),
                };
              }) ?? [];
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: data.properties.hashed_token,
    });
    if (verifyError) {
      return NextResponse.json({ error: "VERIFY_FAILED", message: verifyError.message }, { status: 500 });
    }

    return response;
  } catch {
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
