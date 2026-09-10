import { test, expect } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280] as const;

test.describe("Phase 6 quick registration", () => {
  test.describe.configure({ timeout: 90_000 });

  for (const width of WIDTHS) {
    test(`join form overflow @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/join", { waitUntil: "load" });
      await expect(page.getByRole("heading", { name: /Join TNCOD Professionals/i })).toBeVisible({
        timeout: 30_000,
      });
      const metrics = await page.evaluate(() => {
        const innerWidth = window.innerWidth;
        return { overflowDelta: document.documentElement.scrollWidth - innerWidth };
      });
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }

  test("landing CTA and register redirect", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: /Join TNCOD Professionals/i }).first()).toBeVisible();
    await page.getByRole("link", { name: /Join TNCOD Professionals/i }).first().click();
    await expect(page).toHaveURL(/\/join$/);
    await page.goto("/register", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/join$/);
  });

  test("validation errors are associated and keyboard reachable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/join", { waitUntil: "load" });
    await page.getByRole("button", { name: /Create my professional record/i }).click();
    await expect(page.getByText(/required|Select a professional status|valid email/i).first()).toBeVisible();
    const name = page.getByLabel(/Full name/i);
    await name.focus();
    await expect(name).toBeFocused();
  });

  test("success page does not promise verification or directory", async ({ page }) => {
    await page.goto("/join/success", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /You are registered/i })).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body.toLowerCase()).toContain("does not mean you are verified");
    expect(body.toLowerCase()).toContain("directory");
  });

  test("valid submission creates record and lands on success", async ({ page }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const email = `phase6.e2e.${stamp}@tncod.test`;
    const phone = `082${String(stamp).slice(-7)}`;

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/join", { waitUntil: "load" });
    await page.getByLabel(/Full name/i).fill("E2E Proof User");
    await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
    await page.getByLabel(/Email/i).fill(email);
    await page.getByLabel(/Professional status/i).selectOption("Employee");
    await page.getByLabel(/What do you do professionally/i).fill("Facilitator");
    await page.getByLabel(/Company, organisation or business/i).fill("TNCOD Lab");
    await page.getByLabel(/What are you looking for/i).fill("Collaborators");
    await page.getByLabel(/What can you offer/i).fill("Workshop facilitation");
    await page.getByRole("button", { name: /Create my professional record/i }).click();
    await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /You are registered/i })).toBeVisible();
    await expect(page.getByText(/does not sign you in/i)).toBeVisible();
  });

  test("duplicate email returns neutral message without raw DB errors", async ({ page }) => {
    test.setTimeout(180_000);
    const stamp = Date.now();
    const email = `phase6.dup.${stamp}@tncod.test`;
    const phone1 = `083${String(stamp).slice(-7)}`;
    const phone2 = `084${String(stamp).slice(-7)}`;

    async function fillAndSubmit(phone: string) {
      await page.goto("/join", { waitUntil: "load" });
      await page.getByLabel(/Full name/i).fill("Duplicate Probe");
      await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
      await page.getByLabel(/Email/i).fill(email);
      await page.getByLabel(/Professional status/i).selectOption("Employee");
      await page.getByLabel(/What do you do professionally/i).fill("Analyst");
      await page.getByLabel(/What are you looking for/i).fill("Connections");
      await page.getByLabel(/What can you offer/i).fill("Advice");
      await page.getByRole("button", { name: /Create my professional record/i }).click();
    }

    await fillAndSubmit(phone1);
    await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });

    await fillAndSubmit(phone2);
    await expect(
      page.getByText(/may already have a Professionals profile/i),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/23505|PGRST|Postgres|unique constraint/i)).toHaveCount(0);
    await expect(page).not.toHaveURL(/\/join\/success/);
  });
});
