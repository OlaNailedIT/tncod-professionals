import { describe, expect, it, beforeEach } from "vitest";
import { normalizePhone, phonesLikelyMatch } from "@/features/registration/phone";
import { registrationSchema } from "@/features/registration/schema";
import {
  checkRegistrationRateLimit,
  resetRegistrationRateLimitForTests,
} from "@/features/registration/rate-limit";

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
    resetRegistrationRateLimitForTests();
  });

  it("allows a burst then blocks", () => {
    for (let i = 0; i < 8; i += 1) {
      expect(checkRegistrationRateLimit("test-ip").ok).toBe(true);
    }
    expect(checkRegistrationRateLimit("test-ip").ok).toBe(false);
  });
});
