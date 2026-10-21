import { test, expect } from "@playwright/test";

for (const [name, path, button] of [["Member", "/dashboard", "TNCOD Professionals home"], ["EXCO", "/exco", "EXCO home"]]) {
  test(`${name} brand and original logo button callback in the local showcase`, async ({ page }) => {
    await page.route("**/*", route => new URL(route.request().url()).origin === 'http://127.0.0.1:3116'
      && ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
    await page.goto("/design-system", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: `${name} shell`, exact: true }).click();
    const shell = page.locator(`[data-shell="${name.toLowerCase()}"]`);
    const logo = shell.getByRole("button", { name: button, exact: true });
    await expect(logo.locator('img[src="/brand/professionals-mark.jpg"]')).toBeVisible();
    if (name === 'EXCO') {
      await shell.getByRole("button", { name: "Professionals", exact: true }).click();
    } else {
      await shell.getByRole("button", { name: "Profile", exact: true }).first().click();
    }
    await logo.click();
    await expect(page.getByText("Specimen pathname:")).toContainText(path);
    await expect(page).toHaveURL(/\/design-system$/);
    const box = await logo.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(160);
  });
}
