import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/server/auth/session";
import { applyExcoBusinessDecision, loadExcoBusiness } from "@/features/business/exco-business";
import type { ExcoBusinessAction } from "@/features/business/verification-status";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const business = await loadExcoBusiness(auth.userId, id);
    return NextResponse.json({ business });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.code === "UNAUTHORIZED" ? "FORBIDDEN" : err.code, message: err.message },
        { status: err.httpStatus },
      );
    }
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const action =
    body && typeof body === "object" && "action" in body
      ? String((body as { action: unknown }).action ?? "")
      : "";
  const memberFacingMessage =
    body && typeof body === "object" && "memberFacingMessage" in body
      ? String((body as { memberFacingMessage?: unknown }).memberFacingMessage ?? "")
      : "";
  const internalNote =
    body && typeof body === "object" && "internalNote" in body
      ? String((body as { internalNote?: unknown }).internalNote ?? "")
      : "";

  const allowed: ExcoBusinessAction[] = [
    "start_review",
    "request_clarification",
    "approve",
    "reject",
  ];
  if (!allowed.includes(action as ExcoBusinessAction)) {
    return NextResponse.json({ error: "VALIDATION", message: "Invalid action" }, { status: 400 });
  }

  try {
    const result = await applyExcoBusinessDecision({
      reviewerUserId: auth.userId,
      businessId: id,
      action: action as ExcoBusinessAction,
      memberFacingMessage,
      internalNote,
    });
    if (!result.ok) {
      return NextResponse.json({ error: "VALIDATION", message: result.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.code === "UNAUTHORIZED" ? "FORBIDDEN" : err.code, message: err.message },
        { status: err.httpStatus },
      );
    }
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
