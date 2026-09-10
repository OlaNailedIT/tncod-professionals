import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

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

async function clearSession() {
  const supabaseUrl = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = unwrapEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !anonKey) return;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.signOut();
}

export async function POST(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}

export async function GET(request: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/sign-in", request.url), { status: 303 });
}
