import { test, expect } from "@playwright/test";

/**
 * Phase 20 — unauthenticated analytics access must not expose the surface.
 * Full EXCO authenticated browser evidence reuses Phase 10 session helpers when local Auth is available.
 */
test.describe("Phase 20 analytics access boundary", () => {
  test("anonymous /exco/analytics redirects to sign-in", async ({ page }) => {
    await page.goto("/exco/analytics", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("anonymous cannot see analytics metric markup", async ({ page }) => {
    await page.goto("/exco/analytics", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-metric]")).toHaveCount(0);
  });
});
