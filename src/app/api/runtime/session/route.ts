import { NextResponse } from "next/server";
import { getSessionSupabaseConfig } from "@/lib/env/supabase-session";
import { getAuthenticatedUser } from "@/server/auth/session";

/** Technical session probe. Returns no emails, tokens, or secrets. Not a product Auth page. */
export async function GET() {
  const supabaseConfigured = Boolean(getSessionSupabaseConfig());
  const user = supabaseConfigured ? await getAuthenticatedUser() : null;
  return NextResponse.json({
    supabaseConfigured,
    sessionPresent: Boolean(user),
  });
}
