import { test, expect, chromium } from "@playwright/test";
import fs from "node:fs";

/**
 * Layer 4 readiness — fails loudly if the browser binary is missing.
 * Does not prove product behaviour; proves real-browser verification is available.
 */
test.describe("browser readiness", () => {
  test("PLAYWRIGHT_BROWSERS_PATH resolves and Chromium can launch", async () => {
    const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
    expect(browsersPath, "PLAYWRIGHT_BROWSERS_PATH should be set by run-playwright.mjs").toBeTruthy();
    expect(fs.existsSync(browsersPath!), `browsers path missing: ${browsersPath}`).toBe(true);

    const entries = fs.readdirSync(browsersPath!);
    const hasChromiumFamily = entries.some(
      (name) => name.startsWith("chromium") || name.startsWith("chromium_headless_shell"),
    );
    expect(
      hasChromiumFamily,
      `No chromium install under ${browsersPath}. Run: npm run test:e2e:install`,
    ).toBe(true);

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto("about:blank");
      expect(await page.evaluate(() => 1 + 1)).toBe(2);
      expect(browser.version().length).toBeGreaterThan(0);
    } finally {
      await browser.close();
    }
  });

  test("page fixture launches against the app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "TNCOD Professionals" })).toBeVisible();
  });
});
