import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * DEF-23C-01 — mobile drawer must navigate (URL + destination content), not only close.
 * DEF-23C-02 — header Sign in at tablet/landscape widths.
 *
 * DEF-23C-02 limitation: resizing a touch phone preset (deviceScaleFactor 3) with
 * page.setViewportSize() and then calling locator.click() is not a physical tap.
 * On that combination the click can finish without a navigation request. The header
 * matrix uses the native iPad Pro 11 profile, an iPhone landscape context created at
 * 844×390 (the header is hidden below the md breakpoint; Playwright's built-in
 * landscape preset is 750×340), and locator.tap() when the project has touch.
 * A non-prefetch RSC request is not treated as navigation; each test asserts the URL
 * and unique #main-content. Navigations are not chained: a late client commit can
 * interrupt a following goto.
 *
 * Does not submit registration or mutate Production accounts.
 */

const HEADER_ASSERT_TIMEOUT = 15_000;

function isWideHeaderProject(name: string) {
  return name.includes("ipad") || name.includes("landscape") || name.includes("desktop");
}

const DESTINATIONS = [
  {
    label: "Professionals",
    path: "/professionals",
    mainHeading: "Professionals Directory",
  },
  {
    label: "Join",
    path: "/join",
    mainHeading: "Join the Professionals community",
  },
  {
    label: "Sign in",
    path: "/sign-in",
    mainHeading: "Sign in",
  },
] as const;

async function assertDrawerClosed(page: Page) {
  const openDialog = page.locator("dialog[open]");
  await expect(openDialog).toHaveCount(0);
}

async function openPublicMenu(page: Page) {
  const menu = page.getByRole("button", { name: /^Menu$/i });
  await expect(menu).toBeVisible();
  // Client shell: wait until React has attached the click handler.
  await page.waitForFunction(() => {
    const button = document.querySelector("header button");
    if (!button) return false;
    return Object.keys(button).some(
      (key) => key.startsWith("__reactFiber") || key.startsWith("__reactProps"),
    );
  });
  await menu.click();
  await expect(page.locator("dialog[open]")).toBeVisible();
}

async function activateHeaderLink(link: Locator) {
  const hasTouch = Boolean(test.info().project.use.hasTouch);
  if (hasTouch) await link.tap();
  else await link.click();
}

test.describe("DEF-23C-01 public mobile menu navigation", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      isWideHeaderProject(testInfo.project.name),
      "phone drawer is covered by the phone projects",
    );
  });

  for (const dest of DESTINATIONS) {
    test(`phone menu → ${dest.label} changes URL and shows destination`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await openPublicMenu(page);
      const dialog = page.locator("dialog[open]");
      const item = dialog.getByRole("link", { name: dest.label });
      await expect(item).toBeVisible();
      await expect(item).toHaveAttribute("href", dest.path);

      await Promise.all([
        page.waitForURL((url) => {
          const p = new URL(url).pathname.replace(/\/$/, "") || "/";
          const expected = dest.path.replace(/\/$/, "") || "/";
          return p === expected;
        }),
        item.click(),
      ]);

      await expect(page).toHaveURL(new RegExp(`${dest.path.replace("/", "\\/")}\\/?$`));
      await assertDrawerClosed(page);
      const main = page.locator("#main-content");
      await expect(main.getByRole("heading", { name: dest.mainHeading, level: 1 })).toBeVisible();
    });
  }

});

test.describe("DEF-23C-02 public header navigation", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      !isWideHeaderProject(testInfo.project.name),
      "header links are hidden below md; phone projects cover the drawer",
    );
  });

  for (const dest of DESTINATIONS) {
    test(`header → ${dest.label} changes URL and shows destination`, async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: /^Menu$/i })).toHaveCount(0);

      const link = page.getByRole("navigation", { name: "Public" }).getByRole("link", { name: dest.label });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", dest.path);
      await page.waitForFunction((label) => {
        const node = [...document.querySelectorAll('nav[aria-label="Public"] a')].find(
          (anchor) => (anchor.textContent || "").trim() === label,
        );
        if (!node) return false;
        return Object.keys(node).some(
          (key) => key.startsWith("__reactProps") || key.startsWith("__reactFiber"),
        );
      }, dest.label);

      await activateHeaderLink(link);
      await expect(page).toHaveURL(new RegExp(`${dest.path.replace("/", "\\/")}\\/?$`), {
        timeout: HEADER_ASSERT_TIMEOUT,
      });
      const main = page.locator("#main-content");
      await expect(main.getByRole("heading", { name: dest.mainHeading, level: 1 })).toBeVisible({
        timeout: HEADER_ASSERT_TIMEOUT,
      });
      if (dest.label === "Join") {
        await expect(main.getByLabel("Full name")).toBeVisible();
      }
      if (dest.label === "Sign in") {
        await expect(main.getByLabel("Email address")).toBeVisible();
      }
    });
  }
});

test.describe("DEF-23C-01 showcase button-mode drawer (design-system)", () => {
  test("member specimen menu still uses buttons and local pathname side effects", async ({
    page,
  }, testInfo) => {
    test.skip(
      isWideHeaderProject(testInfo.project.name),
      "showcase drawer is covered by the phone projects",
    );
    test.skip(process.env.VERCEL_ENV === "production", "design-system is 404 in Production");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/design-system", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Application shells/i })).toBeVisible({
      timeout: 30_000,
    });

    const section = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Application shells/i }),
    });

    const memberShell = section.getByRole("button", { name: "Member shell" });
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find((node) =>
        (node.textContent || "").includes("Member shell"),
      );
      if (!button) return false;
      return Object.keys(button).some(
        (key) => key.startsWith("__reactFiber") || key.startsWith("__reactProps"),
      );
    });
    await memberShell.click();
    await expect(memberShell).toHaveAttribute("aria-pressed", "true");
    await section.getByRole("button", { name: "Menu" }).click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.getByRole("button", { name: "Profile" })).toBeVisible();
    await dialog.getByRole("button", { name: "Profile" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(section.locator("code").filter({ hasText: /^\/profile$/ })).toBeVisible();
  });
});
