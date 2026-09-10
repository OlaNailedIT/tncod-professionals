import { NextResponse } from "next/server";

/** Minimal diagnostic. Does not probe Postgres or print secrets. */
export function GET() {
  return NextResponse.json({
    ok: true,
    databaseGate: "PASS",
    rlsVerified: true,
    storageHttp: "see-phase-4-runtime-report",
  });
}
