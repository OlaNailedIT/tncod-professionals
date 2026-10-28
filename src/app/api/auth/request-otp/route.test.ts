import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  clientConfig: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => {
    mocks.clientConfig(...args);
    return { auth: { signInWithOtp: mocks.signInWithOtp } };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { POST } from "@/app/api/auth/request-otp/route";

function makeRequest(body: unknown, hostname = "tncod-professionals-azure.vercel.app") {
  return {
    url: `https://${hostname}/api/auth/request-otp`,
    cookies: { getAll: () => [] },
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

describe("POST /api/auth/request-otp neutralization", () => {
  afterEach(() => vi.unstubAllEnvs());
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

  it("returns email-code callbacks to each approved hostname without trusting an arbitrary host", async () => {
    vi.stubEnv("AUTH_E2E_HELPER", "1");
    const body = { email: "member@example.com", next: "/dashboard" };
    const oldSite = await POST(makeRequest(body));
    const viixSite = await POST(makeRequest(body, "codprofessionals.viix.solutions"));
    const resourcesSite = await POST(makeRequest(body, "codprofessionals.69resources.com"));
    const unknownSite = await POST(makeRequest(body, "untrusted.example"));

    expect((await oldSite.json()).emailRedirectTo).toBe(
      "https://tncod-professionals-azure.vercel.app/auth/callback?next=%2Fdashboard",
    );
    expect((await viixSite.json()).emailRedirectTo).toBe(
      "https://codprofessionals.viix.solutions/auth/callback?next=%2Fdashboard",
    );
    expect((await resourcesSite.json()).emailRedirectTo).toBe(
      "https://codprofessionals.69resources.com/auth/callback?next=%2Fdashboard",
    );
    expect((await unknownSite.json()).emailRedirectTo).toBe(
      "https://tncod-professionals-azure.vercel.app/auth/callback?next=%2Fdashboard",
    );
  });

  it("uses the private low-privilege key without exposing it or provider differences", async () => {
    vi.stubEnv("SUPABASE_AUTH_SERVER_ONLY", "1");
    vi.stubEnv("SUPABASE_URL", "https://hyzkearnbhxznkeokacj.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_private_test_sentinel");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    mocks.signInWithOtp.mockResolvedValueOnce({error:null}).mockResolvedValueOnce({error:{message:"Signups not allowed for otp"}});
    const member = await POST(makeRequest({email:"member@example.com"}));
    const unknown = await POST(makeRequest({email:"unknown@example.com"}));
    expect(mocks.clientConfig).toHaveBeenCalledWith(
      "https://hyzkearnbhxznkeokacj.supabase.co", "sb_publishable_private_test_sentinel", expect.any(Object),
    );
    expect(member.status).toBe(200);
    expect(unknown.status).toBe(200);
    const data = await member.json();
    expect(data).toEqual(await unknown.json());
    expect(JSON.stringify(data)).not.toContain("sb_publishable_private_test_sentinel");
  });
});
