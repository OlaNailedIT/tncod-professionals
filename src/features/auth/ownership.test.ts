import { describe, expect, it } from "vitest";
import { assertTrustedUserId } from "@/security/authorization";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

describe("Phase 7 ownership binding", () => {
  it("rejects mismatched claimed user ids", () => {
    expect(() => assertTrustedUserId("aaa-bbb-ccc-ddd-eee000000001", "aaa-bbb-ccc-ddd-eee000000002")).toThrow(
      /AUTHORIZATION_DENIED/,
    );
  });

  it("accepts matching claimed user ids", () => {
    expect(assertTrustedUserId("aaa-bbb-ccc-ddd-eee000000001", "aaa-bbb-ccc-ddd-eee000000001")).toBe(
      "aaa-bbb-ccc-ddd-eee000000001",
    );
  });

  it("accepts absent claimed user id", () => {
    expect(assertTrustedUserId("aaa-bbb-ccc-ddd-eee000000001")).toBe("aaa-bbb-ccc-ddd-eee000000001");
  });
});

describe("Phase 7 redirect safety", () => {
  it("blocks open redirects used after sign-in", () => {
    expect(sanitizeNextPath("https://evil.example/phish")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("/sign-in")).toBe("/dashboard");
  });
});
