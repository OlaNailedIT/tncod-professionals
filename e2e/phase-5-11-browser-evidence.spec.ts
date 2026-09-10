import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.11 Member vs EXCO differentiation", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const width of WIDTHS) {
    test(`density shells overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: /Application shells/i })).toBeVisible({
        timeout: 30_000,
      });

      for (const label of ["Member shell", "EXCO shell"] as const) {
        await page.getByRole("button", { name: label }).click();
        const metrics = await page.evaluate(() => {
          const innerWidth = window.innerWidth;
          const overflowDelta = document.documentElement.scrollWidth - innerWidth;
          return { overflowDelta };
        });
        expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
      }
    });
  }

  test("Member and EXCO shells differ in density while sharing language", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Application shells/i })).toBeVisible({
      timeout: 30_000,
    });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });

    await section.getByRole("button", { name: "Member shell" }).click();
    await expect(page.locator('[data-shell="member"]')).toBeVisible();
    await expect(page.locator('[data-shell-main="member"]')).toBeVisible();
    await expect(page.locator('[data-audit-density="member"]')).toBeVisible();
    await expect(section.getByRole("navigation", { name: "Member" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Continue profile" })).toBeVisible();

    const memberMetrics = await page.evaluate(() => {
      const main = document.querySelector('[data-shell-main="member"]') as HTMLElement | null;
      const sectionEl = document.querySelector('[data-audit-density="member"]') as HTMLElement | null;
      const nav = document.querySelector('nav[aria-label="Member"]');
      const csMain = main ? getComputedStyle(main) : null;
      const csSection = sectionEl ? getComputedStyle(sectionEl) : null;
      return {
        mainPadY: csMain ? parseFloat(csMain.paddingTop) + parseFloat(csMain.paddingBottom) : 0,
        sectionGap: csSection ? parseFloat(csSection.gap || "0") : 0,
        navCount: nav ? nav.querySelectorAll("button, a").length : 0,
        hasMemberButton: Boolean(
          Array.from(document.querySelectorAll("button")).find((b) =>
            (b.textContent || "").includes("Continue profile"),
          ),
        ),
      };
    });

    await section.getByRole("button", { name: "EXCO shell" }).click();
    await expect(page.locator('[data-shell="exco"]')).toBeVisible();
    await expect(page.locator('[data-shell-main="exco"]')).toBeVisible();
    await expect(page.locator('[data-audit-density="exco"]')).toBeVisible();
    await expect(section.getByRole("navigation", { name: "EXCO" })).toBeVisible();
    await expect(section.getByText("Overview")).toBeVisible();
    await expect(section.getByText("Workflows")).toBeVisible();

    const excoMetrics = await page.evaluate(() => {
      const main = document.querySelector('[data-shell-main="exco"]') as HTMLElement | null;
      const sectionEl = document.querySelector('[data-audit-density="exco"]') as HTMLElement | null;
      const nav = document.querySelector('nav[aria-label="EXCO"]');
      const csMain = main ? getComputedStyle(main) : null;
      const csSection = sectionEl ? getComputedStyle(sectionEl) : null;
      return {
        mainPadY: csMain ? parseFloat(csMain.paddingTop) + parseFloat(csMain.paddingBottom) : 0,
        sectionGap: csSection ? parseFloat(csSection.gap || "0") : 0,
        navCount: nav ? nav.querySelectorAll("button, a").length : 0,
        usesSharedButton: Boolean(
          Array.from(document.querySelectorAll("button")).find((b) =>
            (b.textContent || "").includes("Open specimen"),
          ),
        ),
      };
    });

    expect(memberMetrics.mainPadY).toBeGreaterThan(excoMetrics.mainPadY);
    expect(memberMetrics.sectionGap).toBeGreaterThan(excoMetrics.sectionGap);
    expect(excoMetrics.navCount).toBeGreaterThan(memberMetrics.navCount);
    expect(memberMetrics.hasMemberButton).toBe(true);
    expect(excoMetrics.usesSharedButton).toBe(true);

    // Shared primitives still present (no MemberButton/ExcoButton classes in DOM).
    const noForks = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return !html.includes("MemberButton") && !html.includes("ExcoButton") && !html.includes("MemberCard");
    });
    expect(noForks).toBe(true);

    await page.setViewportSize({ width: 390, height: 900 });
    await section.getByRole("button", { name: "Member shell" }).click();
    await section.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();

    await section.getByRole("button", { name: "EXCO shell" }).click();
    await section.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Verification" })).toBeVisible();
    await page.keyboard.press("Escape");
  });
});
