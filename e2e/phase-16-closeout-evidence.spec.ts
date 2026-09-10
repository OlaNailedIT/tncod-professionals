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

async function registerViaUi(page: Page, email: string, phone: string, name: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
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
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`registerViaUi failed for ${email}`);
}

async function grantRole(email: string, roleName: "EXCO_VIEWER" | "EXCO_ADMIN") {
  const user = await prisma.user.findFirst({ where: { email } });
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!user || !role) throw new Error(`grantRole missing ${email} ${roleName}`);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });
}

test.describe("Phase 16 Opportunities closeout", () => {
  test.setTimeout(480_000);

  test("EXCO create, member interest, viewer/member negatives, anon", async ({ page, browser }) => {
    const stamp = Date.now();
    const title = `P16C Opp ${stamp}`;
    const memberEmail = `p16m-${stamp}@example.com`;
    const adminEmail = `p16a-${stamp}@example.com`;
    const viewerEmail = `p16v-${stamp}@example.com`;

    await page.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    // EXCO_ADMIN create
    await registerViaUi(page, adminEmail, `+2791${String(stamp).slice(-7)}`, `P16C Admin ${stamp}`);
    await grantRole(adminEmail, "EXCO_ADMIN");
    await establishSession(page, adminEmail);
    await page.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^Opportunities$/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("create-opportunity-form")).toBeVisible();
    await page.locator("#create-opp-type").selectOption("TRAINING");
    await page.locator("#create-opp-title").fill(title);
    await page
      .locator("#create-opp-description")
      .fill("Phase 16 browser evidence opportunity description for training.");
    await page.getByTestId("create-opportunity-submit").click();
    await expect(page.getByTestId("create-opportunity-success")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(title)).toBeVisible({ timeout: 30_000 });

    // Member interest
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await registerViaUi(
      memberPage,
      memberEmail,
      `+2792${String(stamp).slice(-7)}`,
      `P16C Member ${stamp}`,
    );
    await establishSession(memberPage, memberEmail);
    await memberPage.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(memberPage.getByTestId("create-opportunity-form")).toHaveCount(0);
    await memberPage.getByLabel(/^Search$/i).fill(title);
    await memberPage.getByRole("button", { name: /^Apply$/i }).click();
    const card = memberPage.locator("li").filter({ hasText: title }).first();
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.getByTestId("express-interest").click();
    await expect(card.getByTestId("interest-state")).toHaveText(/Interested/i, { timeout: 30_000 });
    await memberPage.reload({ waitUntil: "domcontentloaded" });
    await memberPage.getByLabel(/^Search$/i).fill(title);
    await memberPage.getByRole("button", { name: /^Apply$/i }).click();
    const cardAfter = memberPage.locator("li").filter({ hasText: title }).first();
    await expect(cardAfter.getByTestId("interest-state")).toHaveText(/Interested/i, {
      timeout: 30_000,
    });

    const opp = await prisma.opportunity.findFirst({ where: { title } });
    expect(opp).toBeTruthy();
    const interests = await prisma.opportunityInterest.count({
      where: { opportunityId: opp!.id },
    });
    expect(interests).toBe(1);

    // Viewer cannot create
    const viewerCtx = await browser.newContext();
    const viewerPage = await viewerCtx.newPage();
    await registerViaUi(
      viewerPage,
      viewerEmail,
      `+2793${String(stamp).slice(-7)}`,
      `P16C Viewer ${stamp}`,
    );
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await establishSession(viewerPage, viewerEmail);
    await viewerPage.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(viewerPage.getByTestId("create-opportunity-form")).toHaveCount(0);

    await viewerCtx.close();
    await memberCtx.close();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
