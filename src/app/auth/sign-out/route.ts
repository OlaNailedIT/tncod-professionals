import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

async function clearSession() {
  const config = getSessionSupabaseConfig();
  if (!config) return;

  const cookieStore = await cookies();
  const supabase = createServerClient(config.url, config.key, {
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
