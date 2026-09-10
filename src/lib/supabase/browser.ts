"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv, hasBrowserSupabaseConfig } from "@/lib/env/public";

export function createBrowserSupabaseClient() {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error("Browser Supabase is not configured");
  }
  const env = getPublicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
