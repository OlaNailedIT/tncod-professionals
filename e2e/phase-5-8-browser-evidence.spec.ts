import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.8 feedback browser evidence", () => {
  for (const width of WIDTHS) {
    test(`feedback overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "load" });

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
          (h.textContent || "").includes("Feedback"),
        );
        return {
          overflowDelta,
          offenders,
          hasFeedback: Boolean(heading),
          hasEmpty: (document.body.textContent || "").includes("No items yet"),
        };
      });

      expect(metrics.hasFeedback).toBe(true);
      expect(metrics.hasEmpty).toBe(true);
      expect(metrics.offenders).toEqual([]);
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }

  test("dialog focus, escape, and toast live region", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Feedback/i }),
    });

    await expect(section.getByRole("status").first()).toBeVisible();
    await expect(section.getByRole("alert").first()).toContainText("Could not complete");

    const openConfirm = section.getByRole("button", { name: "Open confirmation" });
    await openConfirm.focus();
    await openConfirm.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /Leave this specimen/i })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Focus should return to the trigger (native dialog behaviour).
    await expect(openConfirm).toBeFocused();

    await section.getByRole("button", { name: "Show success toast" }).click();
    const live = page.locator("[aria-live='polite']");
    await expect(live).toContainText("Draft saved");

    const loading = section.getByRole("button", { name: /Saving/i });
    await expect(loading).toBeDisabled();
    await expect(loading).toHaveAttribute("aria-busy", "true");
  });
});
