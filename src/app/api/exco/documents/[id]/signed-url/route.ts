import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { getAuthenticatedUser } from "@/server/auth/session";
import { createAuthorizedDocumentSignedUrl } from "@/features/business/business-documents";

/** EXCO reviewer signed document access (same authorization gate as member route). */
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
    const signed = await createAuthorizedDocumentSignedUrl(auth.userId, id, 60);
    return NextResponse.redirect(signed.url);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.httpStatus },
      );
    }
    return NextResponse.json({ error: "ERROR" }, { status: 500 });
  }
}
