import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv, hasBrowserSupabaseConfig } from "@/lib/env/public";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** User-scoped server client. Uses the anon key + session cookies. Not the service role. */
export async function createServerSupabaseClient() {
  if (!hasBrowserSupabaseConfig()) {
    return null;
  }
  const env = getPublicEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
        }
      },
    },
  });
}
