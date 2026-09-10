import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { EXCO_PROFESSIONALS_PAGE_SIZE } from "../src/features/exco/professionals/query";

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

async function grantRole(email: string, roleName: "EXCO_VIEWER" | "EXCO_ADMIN" | "SUPER_ADMIN") {
  const user = await prisma.user.findFirst({ where: { email } });
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!user || !role) throw new Error(`grantRole missing ${email} ${roleName}`);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    create: { userId: user.id, roleId: role.id },
    update: {},
  });
}

test.describe("Phase 11 forensic closeout", () => {
  test.setTimeout(420_000);

  test("routes, authz, filters, record, adversarial, responsive, a11y", async ({
    page,
    browser,
  }) => {
    expect(EXCO_PROFESSIONALS_PAGE_SIZE).toBe(25);

    const stamp = Date.now();
    const memberEmail = `p11c-member-${stamp}@example.com`;
    const viewerEmail = `p11c-viewer-${stamp}@example.com`;
    const adminEmail = `p11c-admin-${stamp}@example.com`;
    const phoneM = `+2782${String(stamp).slice(-7)}`;
    const phoneV = `+2783${String(stamp).slice(-7)}`;
    const phoneA = `+2784${String(stamp).slice(-7)}`;

    // Routes: anonymous
    await page.goto("/exco/professionals", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });
    await page.goto("/admin/professionals", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^Professionals$/i })).toHaveCount(0);

    // MEMBER denied list + direct detail
    await registerViaUi(page, memberEmail, phoneM, "P11C Member");
    await establishSession(page, memberEmail);
    const memberUser = await prisma.user.findFirst({
      where: { email: memberEmail },
      include: { profile: true },
    });
    expect(memberUser?.profile).toBeTruthy();
    const profileId = memberUser!.profile!.id;

    await page.goto("/exco/professionals", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await page.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    // Seed: job seeker, OWNER + APPROVED biz, DIRECTOR-only sibling
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        professionalSituation: "Job seeker",
        location: "Accra Metro",
      },
    });
    await prisma.professionalDetails.update({
      where: { profileId },
      data: { profession: "Civil Engineer", lookingForSummary: "Work", offeringSummary: "Skills" },
    });
    await prisma.churchInformation.upsert({
      where: { profileId },
      create: { profileId, serviceArea: "Youth ministry" },
      update: { serviceArea: "Youth ministry" },
    });
    const biz = await prisma.business.create({
      data: {
        name: `P11C Biz ${stamp}`,
        businessStatus: "APPROVED",
        visibilityStatus: "PRIVATE",
      },
    });
    await prisma.businessProfessional.create({
      data: { businessId: biz.id, profileId, relationshipType: "OWNER" },
    });

    // EXCO_VIEWER
    const ctxV = await browser.newContext();
    const pageV = await ctxV.newPage();
    await registerViaUi(pageV, viewerEmail, phoneV, "P11C Viewer");
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await establishSession(pageV, viewerEmail);
    await pageV.goto("/exco/professionals", { waitUntil: "domcontentloaded" });
    await expect(pageV.getByRole("heading", { name: /^Professionals$/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageV.locator("[data-page-size]")).toHaveAttribute(
      "data-page-size",
      String(EXCO_PROFESSIONALS_PAGE_SIZE),
    );
    await expect(pageV.getByLabel(/Professional verification/i)).toBeVisible();
    await expect(pageV.getByLabel(/Directory visibility/i)).toBeVisible();
    await expect(pageV.getByLabel(/Profile completion/i)).toBeVisible();
    await expect(pageV.getByText(/^Status$/)).toHaveCount(0);

    // Filters: job seeker + profession contains (case)
    await expect(pageV.getByRole("button", { name: /Apply filters/i })).toBeEnabled({
      timeout: 30_000,
    });
    await pageV.getByLabel(/Profession \(contains\)/i).fill("civil");
    await pageV.locator('input[name="jobSeeker"]').check();
    await pageV.getByRole("button", { name: /Apply filters/i }).click();
    await expect(pageV.getByRole("link", { name: /P11C Member/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageV.getByText(/Job seeker/i).first()).toBeVisible();

    // Business owner filter
    await pageV.goto("/exco/professionals", { waitUntil: "domcontentloaded" });
    await expect(pageV.getByRole("button", { name: /Apply filters/i })).toBeEnabled();
    await pageV.locator('input[name="businessOwner"]').check();
    await pageV.getByRole("button", { name: /Apply filters/i }).click();
    await expect(pageV.getByRole("link", { name: /P11C Member/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageV.getByText(/Business owner/i).first()).toBeVisible();

    // Detail: Viewer projection, service_area, domain separation, no contact
    await pageV.getByRole("link", { name: /P11C Member/i }).click();
    await expect(pageV.getByRole("heading", { name: /P11C Member/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageV.getByText(/Professional:/i)).toBeVisible();
    await expect(pageV.getByText(/Directory:/i)).toBeVisible();
    await expect(pageV.getByText(/Business: Verified/i)).toBeVisible();
    await expect(
      pageV.getByText(/A verified business does not mean this professional is professionally verified/i),
    ).toBeVisible();
    // Professional should not show as professionally Verified solely from biz
    await expect(pageV.getByText(/Professional: Verified/i)).toHaveCount(0);
    await expect(pageV.getByText(/Youth ministry/i)).toBeVisible();
    await expect(pageV.getByText(/Restricted to EXCO Admin/i)).toBeVisible();
    await expect(pageV.getByText(memberEmail)).toHaveCount(0);
    await expect(pageV.getByRole("button", { name: /Verify|Publish|Edit profile/i })).toHaveCount(0);
    await expect(pageV.locator("main")).toBeVisible();
    await expect(pageV.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(pageV.getByRole("heading", { level: 2 }).first()).toBeVisible();

    // Guessed ID
    await pageV.goto("/exco/professionals/00000000-0000-4000-8000-000000000099", {
      waitUntil: "domcontentloaded",
    });
    await expect(pageV.getByRole("heading", { name: /P11C Member/i })).toHaveCount(0);

    // Query param / client trust: spoof role metadata in storage must not grant contact
    await pageV.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await pageV.evaluate(() => {
      localStorage.setItem("role", "EXCO_ADMIN");
      localStorage.setItem("user_metadata", JSON.stringify({ role: "SUPER_ADMIN" }));
    });
    await pageV.reload({ waitUntil: "domcontentloaded" });
    await expect(pageV.getByText(/Restricted to EXCO Admin/i)).toBeVisible();
    await expect(pageV.getByText(memberEmail)).toHaveCount(0);

    // EXCO_ADMIN + SUPER_ADMIN contact + dashboard regression smoke
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await registerViaUi(pageA, adminEmail, phoneA, "P11C Admin");
    await grantRole(adminEmail, "EXCO_ADMIN");
    await establishSession(pageA, adminEmail);
    await pageA.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await expect(pageA.getByText(memberEmail)).toBeVisible({ timeout: 60_000 });
    await grantRole(adminEmail, "SUPER_ADMIN");
    await pageA.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await expect(pageA.getByText(memberEmail)).toBeVisible({ timeout: 60_000 });

    await pageA.goto("/exco", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageA.getByRole("link", { name: /Find professionals/i })).toBeVisible();
    await pageA.getByRole("link", { name: /Find professionals/i }).click();
    await expect(pageA).toHaveURL(/\/exco\/professionals/, { timeout: 30_000 });

    // Responsive
    for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
      await pageA.setViewportSize({ width, height: 800 });
      await expect(pageA.getByRole("heading", { name: /^Professionals$/i })).toBeVisible();
      await expect(pageA.getByRole("button", { name: /Apply filters/i })).toBeVisible();
    }

    // A11y smoke
    await pageA.setViewportSize({ width: 1280, height: 800 });
    await expect(pageA.locator("main")).toBeVisible();
    await pageA.keyboard.press("Tab");
    await expect(pageA.locator(":focus")).toBeVisible();

    // No Phase 12 leak routes
    await pageA.goto("/exco/messaging", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /^Professionals$/i })).toHaveCount(0);
    await pageA.goto("/admin/professionals", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /^Professionals$/i })).toHaveCount(0);

    await ctxV.close();
    await ctxA.close();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
