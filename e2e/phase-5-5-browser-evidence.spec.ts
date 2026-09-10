import { test, expect } from "@playwright/test";

/**
 * Phase 5.5 residual live-browser evidence.
 * Closes the verification gap: overflow, wrap, focus, disabled — on /design-system.
 * Not a product E2E suite. Not Phase 5.6.
 */

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.5 design-system browser evidence", () => {
  for (const width of WIDTHS) {
    test(`overflow and wrap @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "networkidle" });

      const metrics = await page.evaluate(() => {
        const innerWidth = window.innerWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const overflowDelta = docScrollWidth - innerWidth;

        const scrollXRoots = new Set<Element>();
        document.querySelectorAll(".layout-scroll-x").forEach((el) => {
          scrollXRoots.add(el);
          el.querySelectorAll("*").forEach((child) => scrollXRoots.add(child));
        });

        const offenders: string[] = [];
        for (const el of Array.from(document.querySelectorAll("body *")) as HTMLElement[]) {
          if (scrollXRoots.has(el)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          if (rect.right > innerWidth + 1 || rect.left < -1) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
            offenders.push(`${el.tagName.toLowerCase()}.${cls}`);
            if (offenders.length >= 8) break;
          }
        }

        const core = Array.from(document.querySelectorAll("h2")).find((h) =>
          (h.textContent || "").includes("Core components"),
        )?.closest("section");

        const buttonRow = core?.querySelector("div.flex.flex-wrap");
        const badgeLabel = Array.from(core?.querySelectorAll("p") ?? []).find((p) =>
          (p.textContent || "").includes("Badge"),
        );
        const badgeRow = badgeLabel?.nextElementSibling as HTMLElement | null;

        return {
          overflowDelta,
          offenders,
          intentionalScrollX: document.querySelectorAll(".layout-scroll-x").length,
          buttonRowWrap: buttonRow ? getComputedStyle(buttonRow).flexWrap : null,
          badgeRowWrap: badgeRow ? getComputedStyle(badgeRow).flexWrap : null,
        };
      });

      expect(metrics.offenders, `elements outside viewport @ ${width}`).toEqual([]);
      expect(metrics.overflowDelta, `scrollWidth delta @ ${width}`).toBeLessThanOrEqual(1);
      expect(metrics.intentionalScrollX).toBeGreaterThanOrEqual(1);
      expect(metrics.buttonRowWrap).toBe("wrap");
      expect(metrics.badgeRowWrap).toBe("wrap");
    });
  }

  test("focus-visible and disabled Button behaviour", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/design-system", { waitUntil: "networkidle" });

    const core = page.locator("section").filter({ has: page.getByRole("heading", { name: "Core components" }) });
    const primary = core.getByRole("button", { name: "Primary", exact: true }).first();
    const disabled = core.getByRole("button", { name: "Disabled" });

    await primary.focus();
    const focusOk = await primary.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.boxShadow !== "none" || (cs.outlineStyle !== "none" && cs.outlineWidth !== "0px");
    });
    expect(focusOk, "focus-visible ring should be visible on Primary").toBe(true);

    await expect(disabled).toBeDisabled();
    const pointerEvents = await disabled.evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pointerEvents).toBe("none");
  });

  test("home and design-system routes still render in browser", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "TNCOD Professionals" })).toBeVisible();

    await page.goto("/design-system");
    await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Core components" })).toBeVisible();
  });
});
