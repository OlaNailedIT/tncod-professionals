import { test, expect, type Page } from "@playwright/test";

/**
 * DEF-23C-01 — mobile drawer must navigate (URL + destination content), not only close.
 * Does not submit registration or mutate Production accounts.
 */

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

test.describe("DEF-23C-01 public mobile menu navigation", () => {
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

  test("tablet/desktop header nav still navigates", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: /^Menu$/i })).toHaveCount(0);

    const nav = page.getByRole("navigation", { name: "Public" });
    await expect(nav.getByRole("link", { name: "Join" })).toBeVisible();
    const main = page.locator("#main-content");
    await nav.getByRole("link", { name: "Join" }).click();
    await expect(page).toHaveURL(/\/join\/?$/);
    await expect(main.getByRole("heading", { name: "Join the Professionals community", level: 1 })).toBeVisible();
    await expect(main.getByLabel("Full name")).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await nav.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/sign-in\/?$/);
    await expect(main.getByRole("heading", { name: "Sign in", level: 1 })).toBeVisible();
    await expect(main.getByLabel("Email address")).toBeVisible();
  });

  test("desktop header nav opens Professionals directory content", async ({ page }) => {
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const nav = page.getByRole("navigation", { name: "Public" });
    await nav.getByRole("link", { name: "Professionals" }).click();
    await expect(page).toHaveURL(/\/professionals\/?$/);
    await expect(
      page.locator("#main-content").getByRole("heading", { name: "Professionals Directory", level: 1 }),
    ).toBeVisible();
  });
});

test.describe("DEF-23C-01 showcase button-mode drawer (design-system)", () => {
  test("member specimen menu still uses buttons and local pathname side effects", async ({
    page,
  }) => {
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
