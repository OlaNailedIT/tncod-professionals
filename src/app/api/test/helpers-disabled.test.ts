import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as otpHelper } from "@/app/api/test/auth-otp/route";
import { POST as sessionHelper } from "@/app/api/test/auth-session/route";

describe("Production test-helper boundary", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns 404 in Production even if the helper flag is accidentally enabled", async () => {
    vi.stubEnv("AUTH_E2E_HELPER", "1");
    vi.stubEnv("NODE_ENV", "production");
    const request = new Request("https://example.test/api/test/helper", {
      method: "POST",
      body: JSON.stringify({ email: "member@example.com" }),
    });

    const [otp, session] = await Promise.all([
      otpHelper(request.clone()),
      sessionHelper(request.clone()),
    ]);

    expect(otp.status).toBe(404);
    expect(session.status).toBe(404);
  });
});
