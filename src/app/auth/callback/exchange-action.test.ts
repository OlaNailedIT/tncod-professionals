import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  activeIdentityExists: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn() } }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      signOut: mocks.signOut,
    },
  }),
}));
vi.mock("@/server/auth/active-identity", () => ({
  activeIdentityExists: mocks.activeIdentityExists,
}));

import { exchangeSignInCodeAction } from "./exchange-action";

describe("Phase 4 PKCE callback exchange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("exchanges the code in the server-cookie context and accepts an active identity", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "active-user" } },
      error: null,
    });
    mocks.activeIdentityExists.mockResolvedValue(true);

    expect(await exchangeSignInCodeAction("one-time-code")).toEqual({ error: null });
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(mocks.activeIdentityExists).toHaveBeenCalledWith("active-user");
  });

  it("does not exchange a missing code", async () => {
    expect(await exchangeSignInCodeAction("")).toEqual({ error: "invalid" });
    expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("rejects an expired or already-used code without exposing provider detail", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "bad_code_verifier" },
    });

    expect(await exchangeSignInCodeAction("used-code")).toEqual({ error: "invalid" });
  });

  it("signs out and rejects an inactive identity after a valid exchange", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      data: { user: { id: "suspended-user" } },
      error: null,
    });
    mocks.activeIdentityExists.mockResolvedValue(false);

    expect(await exchangeSignInCodeAction("valid-code")).toEqual({ error: "invalid" });
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
