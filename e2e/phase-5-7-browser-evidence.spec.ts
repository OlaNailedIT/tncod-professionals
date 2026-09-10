import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.7 forms browser evidence", () => {
  for (const width of WIDTHS) {
    test(`forms overflow @ ${width}px`, async ({ page }) => {
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
          (h.textContent || "").includes("Forms"),
        );
        return {
          overflowDelta,
          offenders,
          hasForms: Boolean(heading),
          hasError: (document.body.textContent || "").includes("Enter a valid email address."),
        };
      });

      expect(metrics.hasForms).toBe(true);
      expect(metrics.hasError).toBe(true);
      expect(metrics.offenders).toEqual([]);
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }

  test("form focus, disabled, and keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/design-system", { waitUntil: "networkidle" });

    const forms = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Forms/i }),
    });

    const nameInput = forms.getByRole("textbox", { name: /Full name/i });
    await nameInput.focus();
    const focusOk = await nameInput.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.boxShadow !== "none" || (cs.outlineStyle !== "none" && cs.outlineWidth !== "0px");
    });
    expect(focusOk).toBe(true);

    const disabled = forms.getByRole("textbox", { name: /Disabled field/i });
    await expect(disabled).toBeDisabled();

    const readOnly = forms.getByRole("textbox", { name: /Read-only field/i });
    await expect(readOnly).toHaveAttribute("readonly", "");

    await expect(forms.getByRole("alert")).toContainText("Enter a valid email address.");

    await forms.getByRole("radio", { name: "Option B" }).check();
    await expect(forms.getByRole("radio", { name: "Option B" })).toBeChecked();
  });
});
