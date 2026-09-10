import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

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

async function seedVerifiedMatchCandidate(stamp: number, skillName: string) {
  const id = randomUUID();
  const email = `p17pro-${stamp}@example.com`;
  await prisma.user.create({
    data: {
      id,
      email,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName: `P17C Pro ${stamp}`,
          location: "Cape Town",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: {
              profession: "Engineer",
              yearsExperience: 8,
            },
          },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  const memberRole = await prisma.role.findUniqueOrThrow({ where: { name: "MEMBER" } });
  await prisma.userRole.create({
    data: { userId: id, roleId: memberRole.id },
  });
  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    create: {
      name: skillName,
      slug: `p17e2e-${stamp}`,
      isActive: true,
    },
    update: { isActive: true },
  });
  await prisma.profileSkill.create({
    data: { profileId: profile.id, skillId: skill.id },
  });
  await prisma.experience.create({
    data: {
      profileId: profile.id,
      role: "Engineer",
      organisation: "TNCOD",
      employmentType: "FULL_TIME",
    },
  });
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles SET verification_status = 'VERIFIED'::"VerificationStatus" WHERE id = $1::uuid`,
      profile.id,
    );
  });
  return { email, profileId: profile.id, displayName: `P17C Pro ${stamp}` };
}

test.describe("Phase 17 Matching closeout", () => {
  test.setTimeout(480_000);

  test("EXCO matches UI; member denied panel; anon redirected", async ({ page, browser }) => {
    const stamp = Date.now();
    const title = `P17C Match Opp ${stamp}`;
    const skillName = `P17E2ESkill-${stamp}`;
    const adminEmail = `p17a-${stamp}@example.com`;
    const memberEmail = `p17m-${stamp}@example.com`;

    await seedVerifiedMatchCandidate(stamp, skillName);

    await page.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    await registerViaUi(page, adminEmail, `+2791${String(stamp).slice(-7)}`, `P17C Admin ${stamp}`);
    await grantRole(adminEmail, "EXCO_ADMIN");
    await establishSession(page, adminEmail);
    await page.goto("/opportunities", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("create-opportunity-form")).toBeVisible({ timeout: 60_000 });

    await page.locator("#create-opp-type").selectOption("JOBS");
    await page.locator("#create-opp-title").fill(title);
    await page
      .locator("#create-opp-description")
      .fill("Phase 17 browser evidence opportunity with matching criteria for EXCO review.");
    await page.locator("#create-opp-location").fill("Cape Town");
    await page.locator("#create-opp-profession").fill("Engineer");
    await page.locator("#create-opp-min-years").fill("3");
    await page.locator("#create-opp-employment-type").selectOption("FULL_TIME");
    await page.locator("#create-opp-skills").fill(skillName);
    await page.getByTestId("create-opportunity-submit").click();
    await expect(page.getByTestId("create-opportunity-success")).toBeVisible({ timeout: 30_000 });

    const opp = await prisma.opportunity.findFirst({ where: { title } });
    expect(opp).toBeTruthy();

    await page.goto(`/opportunities/${opp!.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("potential-matches-panel")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("matches-list")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("match-card").first()).toContainText(`P17C Pro ${stamp}`);
    await expect(page.getByTestId("potential-matches-panel")).not.toContainText(/@example\.com/);
    await expect(page.getByTestId("potential-matches-panel")).not.toContainText(/\+27/);

    // Member must not see matches panel
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await registerViaUi(
      memberPage,
      memberEmail,
      `+2792${String(stamp).slice(-7)}`,
      `P17C Member ${stamp}`,
    );
    await establishSession(memberPage, memberEmail);
    await memberPage.goto(`/opportunities/${opp!.id}`, { waitUntil: "domcontentloaded" });
    await expect(memberPage.getByRole("heading", { name: title })).toBeVisible({
      timeout: 60_000,
    });
    await expect(memberPage.getByTestId("potential-matches-panel")).toHaveCount(0);

    await memberCtx.close();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
