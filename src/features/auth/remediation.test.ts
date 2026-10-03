import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  signOut: vi.fn(),
  active: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({ user: { findFirst: vi.fn() } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      signInWithOtp: mocks.signInWithOtp,
      verifyOtp: mocks.verifyOtp,
      signOut: mocks.signOut,
    },
  }),
}));
vi.mock("@/server/auth/active-identity", () => ({
  activeIdentityExists: mocks.active,
}));

import {
  requestSignInOtpAction,
  verifySignInOtpAction,
} from "@/features/auth/actions";

describe("Phase 4 OTP and inactive-account controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tncod-professionals-azure.vercel.app");
    mocks.signInWithOtp.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("routes magic links through the PKCE callback before the protected destination", async () => {
    const result = await requestSignInOtpAction({
      email: "member@example.com",
      next: "/exco?tab=members",
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "member@example.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo:
          "https://tncod-professionals-azure.vercel.app/auth/callback?next=%2Fexco%3Ftab%3Dmembers",
      },
    });
  });

  it("keeps OTP request responses neutral across account and provider states", async () => {
    mocks.signInWithOtp
      .mockResolvedValueOnce({ error: { message: "User not found" } })
      .mockResolvedValueOnce({ error: { message: "User is banned" } })
      .mockResolvedValueOnce({ error: { message: "Email rate limit exceeded" } });

    const unknown = await requestSignInOtpAction({ email: "unknown@example.com" });
    const banned = await requestSignInOtpAction({ email: "banned@example.com" });
    const throttled = await requestSignInOtpAction({ email: "member@example.com" });

    expect(unknown).toEqual({ ok: true });
    expect(banned).toEqual(unknown);
    expect(throttled).toEqual(unknown);
  });

  it("rejects a valid OTP when the application identity is suspended or deactivated", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { id: "inactive-user" } },
      error: null,
    });
    mocks.active.mockResolvedValue(false);

    const result = await verifySignInOtpAction({
      email: "member@example.com",
      token: "123456",
    });

    expect(result.ok).toBe(false);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("rejects expired and replayed OTP submissions without exposing the provider error", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null },
      error: { message: "Token has expired or already been used" },
    });

    const first = await verifySignInOtpAction({
      email: "member@example.com",
      token: "123456",
    });
    const replay = await verifySignInOtpAction({
      email: "member@example.com",
      token: "123456",
    });

    expect(first).toEqual(replay);
    expect(first).toEqual({
      ok: false,
      message: "That code is invalid or has expired. Request a new code and try again.",
    });
  });
});
