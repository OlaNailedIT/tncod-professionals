import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * LOCAL / disposable gate helper only.
 * Enabled when AUTH_E2E_HELPER=1. Never enable in production.
 * Returns the email OTP from Auth admin generateLink — not exposed to browsers in normal UX.
 */
export async function POST(request: Request) {
  if (process.env.AUTH_E2E_HELPER !== "1") {
    return NextResponse.json({ error: "DISABLED" }, { status: 404 });
  }
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "DISABLED" }, { status: 404 });
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

  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.auth.admin.generateLink({
      // action_link is the reliable local e2e path (OTP type mismatch is flaky).
      type: "magiclink",
      email: parsed.data.email.toLowerCase(),
    });
    if (error || !data) {
      return NextResponse.json({ error: "GENERATE_FAILED" }, { status: 500 });
    }
    const otp = data.properties?.email_otp;
    const actionLink = data.properties?.action_link;
    if (!otp && !actionLink) {
      return NextResponse.json({ error: "NO_OTP" }, { status: 500 });
    }
    return NextResponse.json({ otp, actionLink });
  } catch {
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
