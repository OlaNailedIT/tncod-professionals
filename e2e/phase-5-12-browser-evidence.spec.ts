import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 5.12 accessibility evidence", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const width of WIDTHS) {
    test(`a11y overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/design-system", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: /Design system/i })).toBeVisible({
        timeout: 30_000,
      });
      const delta = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(delta).toBeLessThanOrEqual(1);
    });
  }

  test("keyboard: skip link, shells, forms, dialog, toast", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });

    const shellSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });
    await shellSection.getByRole("button", { name: "Member shell" }).click();
    await expect(page.locator('[data-shell="member"]')).toBeVisible();

    // Skip link inside active shell
    const skip = page.locator('[data-shell="member"]').getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator('[data-shell="member"] #main-content')).toBeVisible();

    // Account menu: open, menuitem role, Escape restores focus
    const account = page.getByRole("button", { name: "Account" }).first();
    await account.click();
    await expect(page.getByRole("menu", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(account).toBeFocused();

    // Forms: labelled control + required + error alert
    const forms = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Forms/i }),
    });
    const name = forms.getByRole("textbox", { name: /Full name/i });
    await expect(name).toHaveAttribute("aria-required", "true");
    await expect(forms.getByRole("alert")).toContainText("Enter a valid email address.");

    // Dialog focus + Escape
    const feedback = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Feedback/i }),
    });
    await feedback.getByRole("button", { name: "Open confirmation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Toast live region
    await feedback.getByRole("button", { name: "Show success toast" }).click();
    await expect(page.locator('[aria-live="polite"]')).toContainText("Draft saved");

    // Status meaning is textual
    await expect(page.getByText("Profile incomplete").first()).toBeVisible();
  });

  test("mobile drawer keyboard and logo naming", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });

    const shellSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });
    await shellSection.getByRole("button", { name: "Public shell" }).click();
    await expect(page.getByRole("button", { name: "TNCOD Professionals home" })).toBeVisible();

    await shellSection.getByRole("button", { name: "Menu" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });

  test("reduced motion does not break dialog", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/design-system", { waitUntil: "load" });
    const feedback = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Feedback/i }),
    });
    await feedback.getByRole("button", { name: "Open confirmation" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
