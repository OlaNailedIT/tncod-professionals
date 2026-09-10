import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.6 design-system status browser evidence", () => {
  for (const width of WIDTHS) {
    test(`status overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "networkidle" });

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
          (h.textContent || "").includes("Data & status"),
        );
        return {
          overflowDelta,
          offenders,
          hasStatusSection: Boolean(heading),
          hasMembersOnly: (document.body.textContent || "").includes("Members only"),
          hasVerified: (document.body.textContent || "").includes("Verified"),
        };
      });

      expect(metrics.hasStatusSection).toBe(true);
      expect(metrics.hasMembersOnly).toBe(true);
      expect(metrics.hasVerified).toBe(true);
      expect(metrics.offenders).toEqual([]);
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }
});
