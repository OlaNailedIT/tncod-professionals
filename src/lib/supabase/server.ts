import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** User-scoped client: low-privilege API key + session cookies, never a secret/service role. */
export async function createServerSupabaseClient() {
  const config = getSessionSupabaseConfig();
  if (!config) {
    return null;
  }
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
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
