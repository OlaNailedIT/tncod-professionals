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

/** Seed 100% completion + verified + headshot key + interest for Spotlight eligibility. */
async function seedSpotlightEligible(email: string, displayName: string) {
  const user = await prisma.user.findFirst({
    where: { email },
    include: { profile: true },
  });
  if (!user?.profile) throw new Error(`missing profile for ${email}`);
  const profileId = user.profile.id;
  const industry = await prisma.industry.upsert({
    where: { slug: "technology" },
    create: { name: "Technology", slug: "technology", isActive: true },
    update: {},
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET display_name = $1,
           location = 'Lagos',
           bio = 'Bio text that is long enough for completion evidence.',
           professional_situation = 'Employee',
           verification_status = 'VERIFIED'::"VerificationStatus",
           visibility_status = 'PRIVATE'::"VisibilityStatus",
           spotlight_interest = true,
           profile_image_storage_key = $2
       WHERE id = $3::uuid`,
      displayName,
      `test-headshots/${profileId}.jpg`,
      profileId,
    );
  });

  await prisma.professionalDetails.upsert({
    where: { profileId },
    create: {
      profileId,
      profession: "Engineer",
      yearsExperience: 5,
      linkedinUrl: "https://www.linkedin.com/in/example",
      lookingForSummary: "Peers",
      offeringSummary: "Help",
      industryId: industry.id,
      opportunityPreferences: {
        collaboration: true,
        mentorship: true,
        referrals: true,
        training: true,
      },
    },
    update: {
      profession: "Engineer",
      yearsExperience: 5,
      linkedinUrl: "https://www.linkedin.com/in/example",
      lookingForSummary: "Peers",
      offeringSummary: "Help",
      industryId: industry.id,
      opportunityPreferences: {
        collaboration: true,
        mentorship: true,
        referrals: true,
        training: true,
      },
    },
  });

  await prisma.churchInformation.upsert({
    where: { profileId },
    create: { profileId, serviceArea: "Lagos" },
    update: { serviceArea: "Lagos" },
  });

  const expCount = await prisma.experience.count({ where: { profileId } });
  if (expCount === 0) {
    await prisma.experience.create({
      data: { profileId, role: "Engineer", organisation: "TNCOD" },
    });
  }

  const skillSlug = `p15e-${profileId.slice(0, 8)}-skill`;
  const serviceSlug = `p15e-${profileId.slice(0, 8)}-svc`;
  const skill = await prisma.skill.upsert({
    where: { slug: skillSlug },
    create: { name: `Skill ${profileId.slice(0, 6)}`, slug: skillSlug, isActive: true },
    update: {},
  });
  const service = await prisma.service.upsert({
    where: { slug: serviceSlug },
    create: { name: `Svc ${profileId.slice(0, 6)}`, slug: serviceSlug, isActive: true },
    update: {},
  });
  await prisma.profileSkill.upsert({
    where: { profileId_skillId: { profileId, skillId: skill.id } },
    create: { profileId, skillId: skill.id },
    update: {},
  });
  await prisma.profileService.upsert({
    where: { profileId_serviceId: { profileId, serviceId: service.id } },
    create: { profileId, serviceId: service.id },
    update: {},
  });

  return { userId: user.id, profileId };
}

test.describe("Phase 15 Spotlight closeout", () => {
  test.setTimeout(480_000);

  test("EXCO create, Viewer read-only, member interest, anon/admin route", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const candidateEmail = `p15c-${stamp}@example.com`;
    const candidatePhone = `+2785${String(stamp).slice(-7)}`;
    const candidateName = `P15C Candidate ${stamp}`;
    const adminEmail = `p15a-${stamp}@example.com`;
    const adminPhone = `+2786${String(stamp).slice(-7)}`;
    const viewerEmail = `p15v-${stamp}@example.com`;
    const viewerPhone = `+2787${String(stamp).slice(-7)}`;

    // Anonymous protection
    await page.goto("/exco/spotlight", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    // /admin/spotlight must not be a Spotlight product route
    const adminRes = await page.goto("/admin/spotlight", { waitUntil: "domcontentloaded" });
    expect(adminRes?.status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByRole("heading", { name: /^Spotlight$/i })).toHaveCount(0);

    // Member interest UX
    await registerViaUi(page, candidateEmail, candidatePhone, candidateName);
    await seedSpotlightEligible(candidateEmail, candidateName);
    await establishSession(page, candidateEmail);
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/settings/, { timeout: 60_000 });
    await expect(page.getByText(/Interested in being featured/i)).toBeVisible();
    await expect(page.getByTestId("spotlight-interest-form")).toHaveAttribute("data-hydrated", "true");
    await expect(page.getByTestId("spotlight-interest-status")).toHaveText("Yes");
    await page.getByTestId("spotlight-interest-withdraw").click();
    await expect
      .poll(
        async () => {
          const row = await prisma.user.findFirst({
            where: { email: candidateEmail },
            include: { profile: true },
          });
          return row?.profile?.spotlightInterest ?? true;
        },
        { timeout: 30_000 },
      )
      .toBe(false);
    await expect(page.getByTestId("spotlight-interest-status")).toHaveText("No", { timeout: 15_000 });
    await page.getByTestId("spotlight-interest-yes").click();
    await expect
      .poll(
        async () => {
          const row = await prisma.user.findFirst({
            where: { email: candidateEmail },
            include: { profile: true },
          });
          return row?.profile?.spotlightInterest ?? false;
        },
        { timeout: 30_000 },
      )
      .toBe(true);
    await expect(page.getByTestId("spotlight-interest-status")).toHaveText("Yes", { timeout: 15_000 });

    // Member cannot use EXCO Spotlight as creator surface
    await page.goto("/exco/spotlight", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    // EXCO_ADMIN workflow (fresh context so session is authoritative)
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await registerViaUi(adminPage, adminEmail, adminPhone, `P15C Admin ${stamp}`);
    await grantRole(adminEmail, "EXCO_ADMIN");
    await establishSession(adminPage, adminEmail);
    await adminPage.goto("/exco/spotlight", { waitUntil: "domcontentloaded" });
    await expect(adminPage).toHaveURL(/\/exco\/spotlight/, { timeout: 60_000 });
    await expect(adminPage.getByRole("heading", { name: /^Spotlight$/i })).toBeVisible();
    await expect(adminPage.getByRole("heading", { name: /Eligible professionals/i })).toBeVisible();
    await adminPage.getByLabel(/^Search$/i).fill(candidateName);
    await adminPage.getByRole("button", { name: /^Search$/i }).click();
    await expect(adminPage.getByText(candidateName)).toBeVisible({ timeout: 30_000 });
    const candidateCard = adminPage.locator("li").filter({ hasText: candidateName }).first();
    await expect(candidateCard.getByText(/Spotlight interest/i)).toBeVisible();
    await candidateCard.getByRole("button", { name: /Create Spotlight/i }).click();
    await expect(adminPage.getByText(/Spotlight created as draft/i)).toBeVisible({ timeout: 30_000 });
    await expect(candidateCard.getByText(/Already spotlighted/i)).toBeVisible({ timeout: 30_000 });
    await expect(candidateCard.getByRole("button", { name: /Create Spotlight/i })).toHaveCount(0);

    // EXCO_VIEWER: read yes, create no
    const viewerCtx = await browser.newContext();
    const viewerPage = await viewerCtx.newPage();
    await registerViaUi(viewerPage, viewerEmail, viewerPhone, `P15C Viewer ${stamp}`);
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await establishSession(viewerPage, viewerEmail);
    await viewerPage.goto("/exco/spotlight", { waitUntil: "domcontentloaded" });
    await expect(viewerPage).toHaveURL(/\/exco\/spotlight/, { timeout: 60_000 });
    await expect(viewerPage.getByRole("heading", { name: /^Spotlight$/i })).toBeVisible();
    await expect(viewerPage.getByRole("button", { name: /Create Spotlight/i })).toHaveCount(0);
    await viewerCtx.close();

    // Public Spotlight routes must not exist as product surfaces
    await adminPage.goto("/spotlight", { waitUntil: "domcontentloaded" });
    await expect(adminPage.getByRole("heading", { name: /^Spotlight$/i })).toHaveCount(0);
    await adminPage.goto("/professionals/spotlight", { waitUntil: "domcontentloaded" });
    await expect(adminPage.getByRole("heading", { name: /^Spotlight$/i })).toHaveCount(0);

    await adminCtx.close();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
