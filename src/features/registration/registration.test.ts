import { describe, expect, it, beforeEach, vi } from "vitest";
import { normalizePhone, phonesLikelyMatch } from "@/features/registration/phone";
import { registrationSchema } from "@/features/registration/schema";
import { checkRegistrationRateLimit } from "@/features/registration/rate-limit";

const rateLimitMocks = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({ $queryRaw: rateLimitMocks.queryRaw }),
}));

describe("phone normalization", () => {
  it("normalizes common Nigerian formats to the same canonical digits", () => {
    expect(normalizePhone("+234 801 234 5678")).toBe("2348012345678");
    expect(normalizePhone("08012345678")).toBe("2348012345678");
    expect(normalizePhone("2348012345678")).toBe("2348012345678");
    expect(phonesLikelyMatch("0801 234 5678", "+2348012345678")).toBe(true);
  });

  it("rejects empty or non-phone input", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });

  it("does not ZA-first rewrite Nigerian locals", () => {
    expect(normalizePhone("08143395949")).toBe("2348143395949");
  });
});

describe("registration schema", () => {
  const valid = {
    fullName: "Ada Example",
    phone: "08012345678",
    email: "ada@example.com",
    professionalSituation: "Employee" as const,
    profession: "Software",
    organisation: "Lab",
    lookingFor: "Connections",
    offering: "Mentorship",
    website: "",
    captchaToken: "test-turnstile-token",
  };

  it("accepts a complete Stage 1 payload", () => {
    const parsed = registrationSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it("rejects malformed email", () => {
    const parsed = registrationSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(parsed.success).toBe(false);
  });

  it("allows empty organisation", () => {
    const parsed = registrationSchema.safeParse({ ...valid, organisation: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.organisation).toBeUndefined();
  });

  it("keeps honeypot optional", () => {
    const parsed = registrationSchema.safeParse({ ...valid, website: "https://spam.test" });
    expect(parsed.success).toBe(true);
  });
});

describe("registration rate limit", () => {
  beforeEach(() => {
    rateLimitMocks.queryRaw.mockReset();
  });

  it("uses the shared database decision and never stores the raw client key", async () => {
    rateLimitMocks.queryRaw
      .mockResolvedValueOnce([{ allowed: true, retry_after_seconds: 0 }])
      .mockResolvedValueOnce([{ allowed: false, retry_after_seconds: 120 }]);

    expect((await checkRegistrationRateLimit("203.0.113.10")).ok).toBe(true);
    expect(await checkRegistrationRateLimit("203.0.113.10")).toEqual({
      ok: false,
      retryAfterSec: 120,
    });

    const firstCall = rateLimitMocks.queryRaw.mock.calls[0];
    expect(JSON.stringify(firstCall)).not.toContain("203.0.113.10");
  });
});
