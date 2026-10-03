import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processRegistrationCleanupJobs } from "@/features/registration/registration-cleanup";
import { requireCronSecret } from "@/lib/env/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  let secret: string;
  try {
    secret = requireCronSecret();
  } catch {
    return false;
  }
  const authorization = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (authorization.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await processRegistrationCleanupJobs();
  return NextResponse.json(
    { ok: result.failed === 0, ...result },
    { status: result.failed === 0 ? 200 : 500 },
  );
}
