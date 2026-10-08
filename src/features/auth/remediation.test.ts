import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
    mocks.signOut.mockResolvedValue({ error: null });
  });

  it("prepares magic-link redirect through the PKCE callback without server signInWithOtp", async () => {
    const result = await requestSignInOtpAction({
      email: "member@example.com",
      next: "/exco?tab=members",
    });

    expect(result).toEqual({
      ok: true,
      emailRedirectTo:
        "https://tncod-professionals-azure.vercel.app/auth/callback?next=%2Fexco%3Ftab%3Dmembers",
    });
  });

  it("rejects invalid email before the browser sends OTP", async () => {
    const result = await requestSignInOtpAction({ email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/valid email/i);
    }
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
