import { describe, expect, it } from "vitest";
import { AppError, publicErrorMessage } from "./errors";

describe("AppError", () => {
  it("does not leak unknown errors", () => {
    const out = publicErrorMessage(new Error("DATABASE_URL=secret"));
    expect(out.message).toBe("An unexpected error occurred");
    expect(out.httpStatus).toBe(500);
  });

  it("maps unauthenticated", () => {
    const err = new AppError("UNAUTHENTICATED", "Authentication required");
    expect(publicErrorMessage(err).httpStatus).toBe(401);
  });
});
