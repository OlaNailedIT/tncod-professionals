import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.13 component validation", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const width of WIDTHS) {
    test(`composition overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: /Consolidated composition/i })).toBeVisible({
        timeout: 30_000,
      });

      const root = page.locator('[data-phase513-composition="root"]');
      await expect(root).toBeVisible();

      const metrics = await page.evaluate(() => {
        const innerWidth = window.innerWidth;
        const overflowDelta = document.documentElement.scrollWidth - innerWidth;
        return { overflowDelta };
      });
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }

  test("composed Member/EXCO specimens preserve semantics and density", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Consolidated composition/i })).toBeVisible({
      timeout: 30_000,
    });

    const member = page.locator('[data-phase513-composition="member"]');
    const exco = page.locator('[data-phase513-composition="exco"]');
    await expect(member).toBeVisible();
    await expect(exco).toBeVisible();

    await expect(member.getByLabel("Preferred name")).toBeVisible();
    await expect(member.getByRole("button", { name: "Continue profile" })).toBeVisible();
    await expect(member.getByText("Incomplete")).toBeVisible();

    await expect(exco.getByLabel("Internal note")).toBeVisible();
    await expect(exco.getByRole("alert")).toContainText("Provide a short clarification note.");
    await expect(exco.getByRole("button", { name: "Open specimen" })).toBeVisible();
    await expect(exco.getByRole("button", { name: "Disabled action" })).toBeDisabled();
    await expect(exco.getByRole("progressbar", { name: "Specimen review progress" })).toBeVisible();

    const density = await page.evaluate(() => {
      const memberEl = document.querySelector(
        '[data-phase513-composition="member"]',
      ) as HTMLElement | null;
      const excoEl = document.querySelector(
        '[data-phase513-composition="exco"]',
      ) as HTMLElement | null;
      const memberGap = memberEl ? parseFloat(getComputedStyle(memberEl).gap || "0") : 0;
      const excoGap = excoEl ? parseFloat(getComputedStyle(excoEl).gap || "0") : 0;
      return { memberGap, excoGap };
    });
    expect(density.memberGap).toBeGreaterThan(density.excoGap);

    const noForks = await page.evaluate(() => {
      const html = document.body.innerHTML;
      return (
        !html.includes("MemberButton") &&
        !html.includes("ExcoButton") &&
        !html.includes("MemberCard") &&
        !html.includes("ExcoCard")
      );
    });
    expect(noForks).toBe(true);
  });

  test("shell Card composition + long content remain keyboard operable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });

    const shells = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });
    await shells.getByRole("button", { name: "Member shell" }).click();
    await expect(page.locator('[data-shell="member"]')).toBeVisible();
    await expect(shells.getByRole("button", { name: "Continue profile" })).toBeVisible();
    await expect(shells.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await shells.getByRole("button", { name: "EXCO shell" }).click();
    await expect(page.locator('[data-shell="exco"]')).toBeVisible();
    await expect(shells.getByRole("button", { name: "Open specimen" })).toBeVisible();

    const long = page.locator('[data-phase513-composition="long-content"]');
    await expect(long.getByText(/Very Long Professional Display Name/i)).toBeVisible();
    await expect(long.getByRole("button", { name: "Saving specimen" })).toBeVisible();

    const memberField = page
      .locator('[data-phase513-composition="member"]')
      .getByLabel("Preferred name");
    await memberField.focus();
    await expect(memberField).toBeFocused();

    await page.setViewportSize({ width: 390, height: 900 });
    await shells.getByRole("button", { name: "Member shell" }).click();
    await shells.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("button variants remain present on design-system surface", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Core components/i })).toBeVisible({
      timeout: 30_000,
    });

    const core = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Core components/i }),
    });
    await expect(core.getByRole("button", { name: "Primary", exact: true }).first()).toBeVisible();
    await expect(core.getByRole("button", { name: "Secondary", exact: true }).first()).toBeVisible();
    await expect(core.getByRole("button", { name: "Outline", exact: true }).first()).toBeVisible();
    await expect(core.getByRole("button", { name: "Ghost", exact: true }).first()).toBeVisible();
    await expect(core.getByRole("button", { name: "Destructive", exact: true }).first()).toBeVisible();
    await expect(core.getByRole("button", { name: "Link", exact: true }).first()).toBeVisible();
  });
});
