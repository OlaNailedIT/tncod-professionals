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

async function forceVerification(
  profileId: string,
  status: "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "NEEDS_CLARIFICATION" | "REJECTED",
) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles SET verification_status = $1::"VerificationStatus" WHERE id = $2::uuid`,
      status,
      profileId,
    );
  });
}

/** Seed fields so Phase 8 completion is 100% (Employee, non-business). Submit still goes through UI. */
async function seedProfileComplete100(userId: string, profileId: string) {
  const industry = await prisma.industry.upsert({
    where: { slug: "technology" },
    create: { name: "Technology", slug: "technology", isActive: true },
    update: {},
  });
  await prisma.profile.update({
    where: { id: profileId },
    data: {
      location: "Lagos",
      bio: "Bio text that is long enough for completion evidence.",
      professionalSituation: "Employee",
    },
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
  const skillSlug = `e2e-${profileId.slice(0, 8)}-skill`;
  const serviceSlug = `e2e-${profileId.slice(0, 8)}-svc`;
  const skill = await prisma.skill.upsert({
    where: { slug: skillSlug },
    create: { name: `Skill ${profileId.slice(0, 8)}`, slug: skillSlug, isActive: true },
    update: {},
  });
  const service = await prisma.service.upsert({
    where: { slug: serviceSlug },
    create: { name: `Svc ${profileId.slice(0, 8)}`, slug: serviceSlug, isActive: true },
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
  void userId;
}

test.describe("Phase 12 forensic closeout", () => {
  test.setTimeout(480_000);

  test("verification centre, lifecycle, permissions, responsive", async ({ page, browser }) => {
    const stamp = Date.now();
    const memberEmail = `p12c-member-${stamp}@example.com`;
    const viewerEmail = `p12c-viewer-${stamp}@example.com`;
    const adminEmail = `p12c-admin-${stamp}@example.com`;
    const subjectEmail = `p12c-subject-${stamp}@example.com`;
    const phoneM = `+2782${String(stamp).slice(-7)}`;
    const phoneV = `+2783${String(stamp).slice(-7)}`;
    const phoneA = `+2784${String(stamp).slice(-7)}`;
    const phoneS = `+2785${String(stamp).slice(-7)}`;

    // Anonymous denied
    await page.goto("/exco/verification", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });
    await page.goto("/admin/verification", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Verification centre/i })).toHaveCount(0);

    // MEMBER denied EXCO
    await registerViaUi(page, memberEmail, phoneM, "P12C Member");
    await establishSession(page, memberEmail);
    await page.goto("/exco/verification", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    const memberUser = await prisma.user.findFirst({
      where: { email: memberEmail },
      include: { profile: true },
    });
    expect(memberUser?.profile).toBeTruthy();
    const memberProfileId = memberUser!.profile!.id;

    // Incomplete: submit CTA must not appear (completion < 100)
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Profile \d+% complete/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /Submit for verification/i })).toHaveCount(0);

    // 100% complete → submit via real /profile UI
    await seedProfileComplete100(memberUser!.id, memberProfileId);
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Profile 100% complete/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /Submit for verification/i }).click();
    await expect(page.getByText(/Submitted for verification|pending EXCO/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect
      .poll(async () => {
        const row = await prisma.profile.findUniqueOrThrow({ where: { id: memberProfileId } });
        return `${row.profileStatus}:${row.verificationStatus}`;
      })
      .toBe("SUBMITTED:PENDING");

    // Subject professional for queue
    await registerViaUi(page, subjectEmail, phoneS, "P12C Subject");
    const subject = await prisma.user.findFirst({
      where: { email: subjectEmail },
      include: { profile: true },
    });
    expect(subject?.profile).toBeTruthy();
    const profileId = subject!.profile!.id;
    await forceVerification(profileId, "PENDING");

    // EXCO_VIEWER: can view queue, cannot mutate
    await registerViaUi(page, viewerEmail, phoneV, "P12C Viewer");
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await establishSession(page, viewerEmail);
    await page.goto("/exco/verification", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Verification centre/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("Professional verification").first()).toBeVisible();
    await page.goto(`/exco/professionals/${profileId}?from=verification`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/View only/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Verify professional/i })).toHaveCount(0);

    // EXCO_ADMIN: start review → verify
    await registerViaUi(page, adminEmail, phoneA, "P12C Admin");
    await grantRole(adminEmail, "EXCO_ADMIN");
    await establishSession(page, adminEmail);
    await page.goto("/exco/verification?tab=pending", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Verification centre/i })).toBeVisible();
    await page.getByRole("link", { name: /P12C Subject/i }).first().click();
    await expect(page).toHaveURL(new RegExp(`/exco/professionals/${profileId}`), {
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /Start review/i }).click();
    await expect(page.getByText(/Under review/i).first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /Verify professional/i }).click();
    await page.getByRole("button", { name: /Confirm verify/i }).click();
    await expect(page).toHaveURL(/\/exco\/verification/, { timeout: 60_000 });

    const afterVerify = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(afterVerify.verificationStatus).toBe("VERIFIED");
    expect(afterVerify.visibilityStatus).not.toBe("DIRECTORY");

    // Publish / unpublish on record
    await page.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Professional: Verified")).toBeVisible({ timeout: 30_000 });
    const publishBtn = page.getByRole("button", { name: /Publish to directory/i });
    await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
    await publishBtn.click();
    await expect(page.getByText("Directory: Directory")).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => {
        const row = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
        return row.visibilityStatus;
      })
      .toBe("DIRECTORY");
    const published = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(published.verificationStatus).toBe("VERIFIED");
    expect(published.publicSlug).toBeTruthy();

    const unpublishBtn = page.getByRole("button", { name: /^Unpublish$/i });
    await expect(unpublishBtn).toBeEnabled({ timeout: 15_000 });
    await unpublishBtn.click();
    await page.getByRole("button", { name: /Confirm unpublish/i }).click();
    await expect(page.getByText("Directory: Members only")).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(async () => {
        const row = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
        return row.visibilityStatus;
      })
      .toBe("MEMBERS_ONLY");
    const unpublished = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(unpublished.verificationStatus).toBe("VERIFIED");
    expect(unpublished.publicSlug).toBe(published.publicSlug);

    // Clarification / reject reason required (second subject path via seeded UNDER_REVIEW)
    await forceVerification(profileId, "UNDER_REVIEW");
    await page.goto(`/exco/professionals/${profileId}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Request clarification/i }).click();
    await expect(page.getByText(/Action blocked|required/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByLabel(/Member-facing reason/i).fill("Need more detail on experience.");
    await page.getByRole("button", { name: /Request clarification/i }).click();
    await expect(page.getByText(/Needs clarification/i).first()).toBeVisible({ timeout: 30_000 });
    const clarified = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
    expect(clarified.clarificationMessage).toContain("Need more detail");

    // Responsive widths
    for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/exco/verification", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Verification centre/i })).toBeVisible();
    }

    // Keyboard: tab filter focusable
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/exco/verification", { waitUntil: "domcontentloaded" });
    await page.getByRole("navigation", { name: /Verification filters/i }).getByRole("link").first().focus();
    await expect(
      page.getByRole("navigation", { name: /Verification filters/i }).getByRole("link").first(),
    ).toBeFocused();

    // Isolated browser: MEMBER still denied after admin work
    const memberCtx = await browser.newContext();
    const memberPage = await memberCtx.newPage();
    await establishSession(memberPage, memberEmail);
    await memberPage.goto("/exco/verification", { waitUntil: "domcontentloaded" });
    await expect(memberPage).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await memberCtx.close();
  });
});
