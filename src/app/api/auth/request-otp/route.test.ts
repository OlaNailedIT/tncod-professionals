import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { signInWithOtp: mocks.signInWithOtp },
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { POST } from "@/app/api/auth/request-otp/route";

function makeRequest(body: unknown) {
  return {
    url: "https://tncod-professionals-azure.vercel.app/api/auth/request-otp",
    cookies: { getAll: () => [] },
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

describe("POST /api/auth/request-otp neutralization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tncod-professionals-azure.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://brpppukzqgpzxjelwwrj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("returns identical success for member-shaped and unknown-user provider errors", async () => {
    mocks.signInWithOtp
      .mockResolvedValueOnce({ data: {}, error: null })
      .mockResolvedValueOnce({
        data: {},
        error: { message: "Signups not allowed for otp" },
      });

    const member = await POST(
      makeRequest({ email: "member@example.com", next: "/dashboard" }) as never,
    );
    const unknown = await POST(
      makeRequest({ email: "nobody@example.invalid", next: "/dashboard" }) as never,
    );

    expect(member.status).toBe(200);
    expect(unknown.status).toBe(200);
    await expect(member.json()).resolves.toEqual(await unknown.json());
  });
});
