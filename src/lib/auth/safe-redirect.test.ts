import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

describe("sanitizeNextPath", () => {
  it("allows safe internal destinations", () => {
    expect(sanitizeNextPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath("/profile/edit")).toBe("/profile/edit");
    expect(sanitizeNextPath("/profile?tab=1")).toBe("/profile?tab=1");
    expect(sanitizeNextPath("/businesses/new")).toBe("/businesses/new");
    expect(sanitizeNextPath("/exco/businesses")).toBe("/exco/businesses");
  });

  it("rejects external and unsafe redirects", () => {
    expect(sanitizeNextPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeNextPath("data:text/html,hi")).toBe("/dashboard");
    expect(sanitizeNextPath("/admin")).toBe("/dashboard");
    expect(sanitizeNextPath("../dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath(null)).toBe("/dashboard");
  });
});
