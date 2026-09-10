import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.10 shell browser evidence", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const width of WIDTHS) {
    test(`shell overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: /Application shells/i })).toBeVisible({
        timeout: 30_000,
      });

      await page.getByRole("button", { name: "Member shell" }).click();

      const metrics = await page.evaluate(() => {
        const innerWidth = window.innerWidth;
        const overflowDelta = document.documentElement.scrollWidth - innerWidth;
        const scrollXRoots = new Set<Element>();
        document.querySelectorAll(".layout-scroll-x").forEach((el) => {
          scrollXRoots.add(el);
          el.querySelectorAll("*").forEach((c) => scrollXRoots.add(c));
        });
        const offenders: string[] = [];
        for (const el of Array.from(document.querySelectorAll("body *")) as HTMLElement[]) {
          if (scrollXRoots.has(el)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          if (rect.right > innerWidth + 1 || rect.left < -1) {
            offenders.push(el.tagName.toLowerCase());
            if (offenders.length >= 6) break;
          }
        }
        const heading = Array.from(document.querySelectorAll("h2")).find((h) =>
          (h.textContent || "").includes("Application shells"),
        );
        return { overflowDelta, offenders, hasShells: Boolean(heading) };
      });

      expect(metrics.hasShells).toBe(true);
      expect(metrics.offenders).toEqual([]);
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }

  test("public member exco navigation interaction", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Application shells/i })).toBeVisible({
      timeout: 30_000,
    });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });

    await section.getByRole("button", { name: "Public shell" }).click();
    await expect(section.getByRole("button", { name: "Menu" })).toBeVisible();
    await section.getByRole("button", { name: "Menu" }).click();
    const publicDialog = page.getByRole("dialog");
    await expect(publicDialog).toBeVisible();
    await expect(publicDialog.getByRole("button", { name: "Join" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(publicDialog).toBeHidden();

    await section.getByRole("button", { name: "Member shell" }).click();
    await section.getByRole("button", { name: "Menu" }).click();
    const memberDialog = page.getByRole("dialog");
    await expect(memberDialog.getByRole("button", { name: "Dashboard" })).toBeVisible();
    await memberDialog.getByRole("button", { name: "Profile" }).click();
    await expect(memberDialog).toBeHidden();
    await expect(section.locator("code").filter({ hasText: /^\/profile$/ })).toBeVisible();
    await section.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog").getByRole("button", { name: "Profile" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.keyboard.press("Escape");

    await section.getByRole("button", { name: "Simulate /profile/edit" }).click();
    await expect(section.locator("code").filter({ hasText: /^\/profile\/edit$/ })).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await section.getByRole("button", { name: "EXCO shell" }).click();
    await expect(section.getByRole("navigation", { name: "EXCO" })).toBeVisible();
    await section.getByRole("navigation", { name: "EXCO" }).getByRole("button", { name: "Professionals" }).click();
    await section.getByRole("button", { name: "Open specimen" }).click();
    await expect(section.getByLabel("Breadcrumb")).toContainText("Professionals");

    const skip = page.getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeFocused();
  });
});
