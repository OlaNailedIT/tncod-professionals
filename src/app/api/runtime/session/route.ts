import { NextResponse } from "next/server";
import { hasBrowserSupabaseConfig } from "@/lib/env/public";
import { getAuthenticatedUser } from "@/server/auth/session";

/** Technical session probe. Returns no emails, tokens, or secrets. Not a product Auth page. */
export async function GET() {
  const supabaseConfigured = hasBrowserSupabaseConfig();
  const user = supabaseConfigured ? await getAuthenticatedUser() : null;
  return NextResponse.json({
    supabaseConfigured,
    sessionPresent: Boolean(user),
  });
}
