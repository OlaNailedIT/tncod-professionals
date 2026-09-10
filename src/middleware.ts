import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/opportunities",
  "/settings",
] as const;

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

function isHttpUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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
  const url = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!isHttpUrl(url) || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
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

  if (isProtectedPath(pathname) && !user) {
    const next = sanitizeNextPath(`${pathname}${search}`);
    const signIn = request.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.search = `?next=${encodeURIComponent(next)}`;
    return NextResponse.redirect(signIn);
  }

  // Signed-in users hitting /sign-in go to a safe destination.
  if (pathname === "/sign-in" && user) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
