import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { verifyRegistrationCaptcha } from "@/features/registration/captcha";

describe("Turnstile registration verification", () => {
  beforeEach(() => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tncod-professionals-azure.vercel.app");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("accepts only the expected hostname and registration action", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        hostname: "tncod-professionals-azure.vercel.app",
        action: "registration",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyRegistrationCaptcha("valid-token", "203.0.113.10")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(String(request.body)).toContain("idempotency_key=");
  });

  it("rejects a token issued for another hostname or action", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, hostname: "evil.example", action: "registration" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          hostname: "tncod-professionals-azure.vercel.app",
          action: "other",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyRegistrationCaptcha("first-token")).resolves.toBe(false);
    await expect(verifyRegistrationCaptcha("second-token")).resolves.toBe(false);
  });

  it("rejects oversized tokens without calling Cloudflare", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyRegistrationCaptcha("x".repeat(2_049))).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
