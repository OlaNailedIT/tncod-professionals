import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // No form submissions, CAPTCHA bypass, member data, or remote requests.
  await page.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    return url.hostname === "127.0.0.1" && ["GET", "HEAD"].includes(request.method())
      ? route.continue() : route.abort();
  });
});

for (const [path, heading] of [
  ["/", "TNCOD Professionals"], ["/join", "Join the Professionals community"], ["/sign-in", "Sign in"],
]) {
  test(`${path} has visible shared gutters and no horizontal overflow`, async ({ page }) => {
    await page.goto(path);
    const title = page.locator("#main-content").getByRole("heading", { name: heading, exact: true });
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(20);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    const containerPadding = await title.evaluate((element) => {
      const container = element.closest(".layout-container")!;
      return parseFloat(getComputedStyle(container).paddingLeft);
    });
    expect(containerPadding).toBeGreaterThanOrEqual(20);
    // Existing controls remain visible/reachable. Nothing is submitted.
    if (path === "/join") {
      const submit = page.locator('button[type="submit"]');
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      const submitBox = await submit.boundingBox();
      expect(submitBox!.x).toBeGreaterThanOrEqual(20);
      expect(submitBox!.x + submitBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 20);
    }
  });
}

test("home explains the current email-code flow and Join/Sign in navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#main-content")).toContainText("one-time code sent to your email");
  await expect(page.locator("#main-content")).not.toContainText("passwordless email link");
  await page.locator("#main-content").getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.locator("#main-content").getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  await page.goto("/");
  await page.locator("#main-content").getByRole("link", { name: "Join TNCOD Professionals", exact: true }).first().click();
  await expect(page).toHaveURL(/\/join$/);
  await expect(page.locator("#main-content").getByRole("heading", { name: "Join the Professionals community", exact: true })).toBeVisible();
});

test("public home link remains keyboard accessible", async ({ page }) => {
  await page.goto("/join");
  const home = page.getByRole("link", { name: "TNCOD Professionals home", exact: true });
  await page.keyboard.press("Tab"); // Skip link.
  await page.keyboard.press("Tab"); // Header logo.
  await expect(home).toBeFocused();
  expect(await home.evaluate((element) => getComputedStyle(element).outlineStyle === "none"
    && getComputedStyle(element).boxShadow === "none")).toBe(false);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("http://127.0.0.1:3116/");
  await expect(page.locator("#main-content").getByRole("heading", { name: "TNCOD Professionals", exact: true })).toBeVisible();
});

test("frame/nested containers avoid double gutters and full containers stay full width", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML = '<div class="layout-page"><div class="layout-container">framed</div></div>'
      + '<div class="layout-container"><div class="layout-container">nested</div></div>'
      + '<div class="layout-container layout-container-full">full</div>';
    document.body.append(host);
    const padding = (element: Element) => parseFloat(getComputedStyle(element).paddingLeft);
    const frame = host.children[0];
    const outer = host.children[1];
    const values = {
      frame: padding(frame), framed: padding(frame.children[0]),
      outer: padding(outer), nested: padding(outer.children[0]), full: padding(host.children[2]),
    };
    host.remove();
    return values;
  });
  expect(result.frame).toBeGreaterThanOrEqual(20);
  expect(result.framed).toBe(0);
  expect(result.outer).toBeGreaterThanOrEqual(20);
  expect(result.nested).toBe(0);
  expect(result.full).toBe(0);
});

test("EXCO showcase logo retains its button callback without route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/design-system", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "EXCO shell", exact: true }).click();
  const shell = page.locator('[data-shell="exco"]');
  await expect(shell).toBeVisible();
  await shell.getByRole("button", { name: "Professionals", exact: true }).click();
  await expect(page.getByText("Specimen pathname:")).toContainText("/exco/professionals");
  await shell.getByRole("button", { name: "EXCO home", exact: true }).click();
  await expect(page.getByText("Specimen pathname:")).toHaveText(/Specimen pathname:\s*\/exco\s*·/);
  await expect(page).toHaveURL(/\/design-system$/);
});
