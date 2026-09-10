import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import {
  loadMemberProfileForViewer,
  updateOwnMemberProfile,
} from "@/features/profile/own-profile";
import { getAuthenticatedUser } from "@/server/auth/session";

/**
 * Member profile API for Phase 7 evidence.
 * Identity always comes from the Auth session — never from client trust alone.
 */
export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const claimed = url.searchParams.get("userId");

  try {
    const profile = await loadMemberProfileForViewer(auth.userId, claimed);
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof AppError) {
      if (err.code === "UNAUTHORIZED") {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
      if (err.code === "NOT_FOUND") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const result = await updateOwnMemberProfile(auth.userId, body);
  if (!result.ok) {
    const denied = result.message.toLowerCase().includes("only update your own");
    return NextResponse.json(
      { error: denied ? "FORBIDDEN" : "VALIDATION", message: result.message, fieldErrors: result.fieldErrors },
      { status: denied ? 403 : 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
