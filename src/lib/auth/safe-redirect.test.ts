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
    expect(sanitizeNextPath("https://evil.example/phish")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeNextPath("data:text/html,hi")).toBe("/dashboard");
    expect(sanitizeNextPath("/admin")).toBe("/dashboard");
    expect(sanitizeNextPath("../dashboard")).toBe("/dashboard");
    expect(sanitizeNextPath(null)).toBe("/dashboard");
  });

  it("rejects path traversal that would escape allowlisted prefixes", () => {
    expect(sanitizeNextPath("/dashboard/../evil")).toBe("/dashboard");
    expect(sanitizeNextPath("/dashboard/../../join")).toBe("/dashboard");
    expect(sanitizeNextPath("/profile/edit/../../exco")).toBe("/exco");
    expect(sanitizeNextPath("/profile/edit/../../../admin")).toBe("/dashboard");
  });

  it("extracts allowlisted path from absolute RedirectTo URLs", () => {
    expect(sanitizeNextPath("https://tncod-professionals-azure.vercel.app/dashboard")).toBe(
      "/dashboard",
    );
    expect(sanitizeNextPath("https://tncod-professionals-azure.vercel.app/exco/analytics")).toBe(
      "/exco/analytics",
    );
  });
});
