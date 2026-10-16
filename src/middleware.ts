import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/opportunities",
  "/settings",
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Session refresh + member-route gate (Phase 7).
 * Does not authorize EXCO or mutate profile statuses.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSessionSupabaseConfig();
  if (!config) {
    return response;
  }

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  let activeUser = user;

  if (user) {
    const [{ data: account }, { data: profile }] = await Promise.all([
      supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .eq("account_status", "ACTIVE")
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle(),
    ]);
    if (!account || !profile) {
      activeUser = null;
      await supabase.auth.signOut({ scope: "local" });
    }
  }

  if (isProtectedPath(pathname) && !activeUser) {
    const next = sanitizeNextPath(`${pathname}${search}`);
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(signIn);
  }

  // Signed-in users hitting /sign-in go to a safe destination.
  if (pathname === "/sign-in" && activeUser) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
