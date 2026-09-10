import { describe, expect, it } from "vitest";
import { isNavActive, normalizePathname } from "@/components/shell/is-nav-active";

describe("isNavActive", () => {
  it("normalizes trailing slashes and query strings", () => {
    expect(normalizePathname("/profile/?x=1")).toBe("/profile");
    expect(normalizePathname("")).toBe("/");
  });

  it("matches home and exco home exactly", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/professionals", "/")).toBe(false);
    expect(isNavActive("/exco", "/exco")).toBe(true);
    expect(isNavActive("/exco/professionals", "/exco")).toBe(false);
  });

  it("keeps parent active for nested routes", () => {
    expect(isNavActive("/exco/professionals/abc", "/exco/professionals")).toBe(true);
    expect(isNavActive("/profile/edit", "/profile")).toBe(true);
    expect(isNavActive("/dashboard", "/profile")).toBe(false);
  });
});
