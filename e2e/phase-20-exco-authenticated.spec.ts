import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function establishSession(page: Page, email: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await page.request.post("/api/test/auth-session", { data: { email } });
    if (res.ok()) {
      const json = (await res.json()) as { ok?: boolean };
      if (json.ok) return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Could not establish auth session for ${email}`);
}

async function registerMinimal(page: Page, email: string, phone: string, name: string) {
  await page.goto("/join", { waitUntil: "load" });
  await page.getByLabel(/Full name/i).fill(name);
  await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/Professional status/i).selectOption("Employee");
  await page.getByLabel(/What do you do professionally/i).fill("Engineer");
  await page.getByLabel(/Company, organisation or business/i).fill("TNCOD");
  await page.getByLabel(/What are you looking for/i).fill("Peers");
  await page.getByLabel(/What can you offer/i).fill("Help");
  await page.getByRole("button", { name: /Create my professional record/i }).click();
  await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });
}

async function grantRole(email: string, roleName: "EXCO_VIEWER" | "EXCO_ADMIN" | "SUPER_ADMIN") {
  const user = await prisma.user.findFirst({ where: { email } });
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!user || !role) throw new Error(`grantRole missing user/role ${email} ${roleName}`);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });
}

test.describe("Phase 20 authenticated EXCO analytics", () => {
  test.setTimeout(240_000);

  test("MEMBER denied; EXCO_VIEWER sees aggregate analytics without PII fields", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const memberEmail = `p20-member-${stamp}@example.com`;
    const viewerEmail = `p20-viewer-${stamp}@example.com`;

    await registerMinimal(page, memberEmail, `+234801${String(stamp).slice(-7)}`, "P20 Member");
    await establishSession(page, memberEmail);
    await page.goto("/exco/analytics", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);

    const viewerPage = await browser.newPage();
    await registerMinimal(
      viewerPage,
      viewerEmail,
      `+234802${String(stamp).slice(-7)}`,
      "P20 Viewer",
    );
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await establishSession(viewerPage, viewerEmail);
    await viewerPage.goto("/exco/analytics", { waitUntil: "domcontentloaded" });
    await expect(viewerPage).toHaveURL(/\/exco\/analytics/);
    await expect(
      viewerPage.getByRole("heading", { name: /Analytics & operational intelligence/i }),
    ).toBeVisible();
    await expect(viewerPage.locator("[data-metric=member-population]")).toBeVisible();
    await expect(viewerPage.locator("[data-metric=businesses-total]")).toBeVisible();
    await expect(viewerPage.getByRole("heading", { name: /^Community$/i })).toBeVisible();
    await expect(viewerPage.getByRole("heading", { name: /^Needs$/i })).toBeVisible();
    await expect(viewerPage.getByRole("heading", { name: /^Capacity$/i })).toBeVisible();
    await expect(viewerPage.getByRole("heading", { name: /System health/i })).toBeVisible();
    await expect(viewerPage.locator("[data-metric-unavailable=clients]")).toBeVisible();
    await expect(viewerPage.locator("[data-metric-unavailable=mentors]")).toBeVisible();

    // Apply an allowlisted filter and confirm page still renders aggregates
    await viewerPage.goto("/exco/analytics?situation=Employee", {
      waitUntil: "domcontentloaded",
    });
    await expect(viewerPage).toHaveURL(/situation=Employee/);
    await expect(viewerPage.locator("[data-metric=member-population]")).toBeVisible();
    await expect(
      viewerPage.getByRole("heading", { name: /Analytics & operational intelligence/i }),
    ).toBeVisible();
    await expect(viewerPage.getByLabel(/Professional situation/i)).toHaveValue("Employee");

    const body = await viewerPage.locator("body").innerText();
    expect(body.toLowerCase()).not.toContain(memberEmail.toLowerCase());
    expect(body).not.toMatch(/\+234\d{7,}/);

    await viewerPage.close();
  });
});
