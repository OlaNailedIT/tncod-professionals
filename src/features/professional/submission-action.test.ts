import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({ identity: vi.fn(), submit: vi.fn(), revalidate: vi.fn(), log: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ requireAuthenticatedUser: mocks.identity }));
vi.mock("@/features/professional/submit-profile", () => ({ submitProfile: mocks.submit }));
vi.mock("@/features/professional/exco-review", () => ({ applyExcoProfessionalDecision: vi.fn(), publishProfile: vi.fn(), unpublishProfile: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.log } }));
import { submitProfileAction } from "./actions";

describe("progressive submission action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.identity.mockResolvedValue({ userId: "trusted-session-identity" });
    mocks.submit.mockResolvedValue({ ok: true });
  });

  it("uses session identity, calls the existing command and refreshes after success", async () => {
    expect(await submitProfileAction({ ok: false, message: "untrusted previous presentation state" })).toEqual({ ok: true });
    expect(mocks.submit).toHaveBeenCalledExactlyOnceWith("trusted-session-identity");
    expect(mocks.revalidate).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidate).toHaveBeenCalledWith("/exco/verification");
  });

  it("preserves a server eligibility refusal without success revalidation", async () => {
    mocks.submit.mockResolvedValue({ ok: false, message: "Profile must be 100% complete before submission (currently 93%)." });
    expect(await submitProfileAction()).toEqual({ ok: false, message: "Profile must be 100% complete before submission (currently 93%)." });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("an expired or inactive session never reaches the mutation command", async () => {
    mocks.identity.mockRejectedValue(new AppError("UNAUTHENTICATED", "Authentication required"));
    expect(await submitProfileAction()).toEqual({ ok: false, message: "Your session has ended. Refresh the page to sign in again." });
    expect(mocks.submit).not.toHaveBeenCalled();
  });

  it("returns an honest unconfirmed result without exposing internal diagnostics", async () => {
    mocks.submit.mockRejectedValue(new Error("private internal diagnostic must never be returned"));
    const result = await submitProfileAction();
    expect(result).toEqual({ ok: false, message: "Your submission could not be confirmed. Refresh your profile to check its status before trying again." });
    expect(JSON.stringify(result)).not.toContain("private internal");
    expect(mocks.log).toHaveBeenCalledExactlyOnceWith("professional_submission_failed", { code: "INTERNAL" });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
