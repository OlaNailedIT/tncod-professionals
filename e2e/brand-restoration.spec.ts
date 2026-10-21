import { createHash } from "node:crypto";
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const request = route.request();
    return new URL(request.url()).origin === "http://127.0.0.1:3116" && ["GET", "HEAD"].includes(request.method())
      ? route.continue() : route.abort();
  });
});

test("public brand, original mark ratio, gutters, favicon and attribution", async ({ page }, testInfo) => {
  for (const path of ["/", "/join", "/sign-in"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const header = page.locator('[data-shell="public"] > header');
    const mark = header.locator('img[src="/brand/professionals-mark.jpg"]');
    await expect(mark).toBeVisible();
    const image = await mark.evaluate((element: HTMLImageElement) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight };
    });
    expect(image.naturalWidth).toBe(204);
    expect(image.naturalHeight).toBe(192);
    expect(image.width / image.height).toBeCloseTo(204 / 192, 2);
    await expect(header.getByRole("link", { name: "TNCOD Professionals home", exact: true })
      .getByText("Professionals", { exact: true })).toBeVisible();
    await expect(header.locator('img[src*="tncod-logo"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(250, 249, 246)");
    const title = page.locator("#main-content h1");
    const box = await title.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(20);
    await expect(page.locator("footer")).toContainText("Part of Triumphant Nation City of David.");
    await expect(page.locator('footer a[href="/privacy"]')).toBeVisible();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer img')).toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    if (path === "/") {
      await expect(page.locator("#main-content img")).toHaveCount(0);
      await expect(page.locator("#main-content")).toContainText("one-time code sent to your email");
    }
    await page.screenshot({ path: testInfo.outputPath(`${path === '/' ? 'home' : path.slice(1)}.png`), fullPage: true });
  }
  const markResponse = await page.request.get("/brand/professionals-mark.jpg");
  expect(createHash("sha256").update(await markResponse.body()).digest("hex"))
    .toBe("eaded3ebaa8dcff17ce00df0227bda3cd32183b92a729161742962dc52324b05");
  const icon = page.locator('link[rel="icon"][href^="/icon.jpg"]');
  await expect(icon).toHaveCount(1);
  const iconResponse = await page.request.get((await icon.getAttribute("href"))!);
  expect(createHash("sha256").update(await iconResponse.body()).digest("hex"))
    .toBe("eaded3ebaa8dcff17ce00df0227bda3cd32183b92a729161742962dc52324b05");
});

test("unchanged public menu/header and home navigation for the pointer profile", async ({ page }, testInfo) => {
  const touch = testInfo.project.use.isMobile;
  for (const [path, heading] of [["/join", "Join the Professionals community"], ["/sign-in", "Sign in"]]) {
    await page.goto("/", { waitUntil: "networkidle" });
    if (page.viewportSize()!.width < 768) {
      const menu = page.getByRole("button", { name: "Menu", exact: true });
      if (touch) await menu.tap(); else await menu.click();
      const link = page.getByRole("dialog").getByRole("link", { name: path === '/join' ? 'Join' : 'Sign in', exact: true });
      if (touch) await link.tap(); else await link.click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    } else {
      await page.locator('header nav').getByRole("link", { name: path === '/join' ? 'Join' : 'Sign in', exact: true }).click();
    }
    // Matched native WebKit probes of the unchanged released tree committed at
    // 7.8–9.7s. Keep a bounded touch-emulation wait; require URL + unique content.
    await expect(page).toHaveURL(new RegExp(`${path}$`), { timeout: touch ? 20_000 : 5_000 });
    await expect(page.locator("#main-content").getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await page.goto("/join", { waitUntil: "networkidle" });
  const home = page.getByRole("link", { name: "TNCOD Professionals home", exact: true });
  if (touch) {
    await home.tap();
  } else {
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(home).toBeFocused();
    await page.keyboard.press("Enter");
  }
  await expect(page).toHaveURL("http://127.0.0.1:3116/", { timeout: touch ? 20_000 : 5_000 });
});
