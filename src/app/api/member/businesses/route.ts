import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/server/auth/session";
import {
  createOwnBusiness,
  loadOwnBusiness,
  listOwnBusinesses,
  submitOwnBusinessVerification,
  updateOwnBusiness,
} from "@/features/business/own-business";

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  try {
    if (id) {
      const business = await loadOwnBusiness(auth.userId, id);
      return NextResponse.json({ business });
    }
    const businesses = await listOwnBusinesses(auth.userId);
    return NextResponse.json({ businesses });
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

export async function POST(request: Request) {
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
  const result = await createOwnBusiness(auth.userId, body);
  if (!result.ok) {
    return NextResponse.json(
      { error: "VALIDATION", message: result.message, fieldErrors: result.fieldErrors },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, businessId: result.businessId });
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
  const businessId =
    body && typeof body === "object" && "businessId" in body
      ? String((body as { businessId: unknown }).businessId ?? "")
      : "";
  if (!businessId) {
    return NextResponse.json({ error: "VALIDATION", message: "businessId required" }, { status: 400 });
  }

  const action =
    body && typeof body === "object" && "action" in body
      ? String((body as { action: unknown }).action ?? "")
      : "update";

  try {
    if (action === "submit_verification") {
      const result = await submitOwnBusinessVerification(auth.userId, businessId, body);
      if (!result.ok) {
        return NextResponse.json(
          { error: "VALIDATION", message: result.message, fieldErrors: result.fieldErrors },
          { status: 400 },
        );
      }
      return NextResponse.json({ ok: true, businessId });
    }

    const result = await updateOwnBusiness(auth.userId, businessId, body);
    if (!result.ok) {
      return NextResponse.json(
        { error: "VALIDATION", message: result.message, fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, businessId });
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
