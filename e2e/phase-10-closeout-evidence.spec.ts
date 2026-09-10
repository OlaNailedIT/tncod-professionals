import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { registrationWindowStartUtc } from "../src/features/exco/metric-window";

const MAILPIT = process.env.INBUCKET_URL ?? process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const prisma = new PrismaClient();

type MailpitMessageSummary = { ID: string; To?: Array<{ Address?: string }> };

async function latestAuthEmail(request: APIRequestContext, email: string) {
  const normalized = email.toLowerCase();
  for (let attempt = 0; attempt < 12; attempt++) {
    const list = await request.get(`${MAILPIT}/api/v1/messages?limit=50`);
    if (list.ok()) {
      const payload = (await list.json()) as { messages?: MailpitMessageSummary[] };
      for (const summary of (payload.messages ?? []).filter((m) =>
        (m.To ?? []).some((t) => (t.Address ?? "").toLowerCase() === normalized),
      )) {
        const msg = await request.get(`${MAILPIT}/api/v1/message/${summary.ID}`);
        if (!msg.ok()) continue;
        const body = (await msg.json()) as { Text?: string; HTML?: string };
        const text = `${body.Text ?? ""}\n${body.HTML ?? ""}`;
        const otp = text.match(/\b(\d{6,8})\b/)?.[1];
        const magicLink =
          text.match(/https?:\/\/[^\s"']+\/auth\/v1\/verify\?[^\s"']+/i)?.[0]?.replace(/&amp;/g, "&") ??
          text.match(/\((https?:\/\/[^)\s]+)\)/)?.[1];
        if (otp || magicLink) return { otp, magicLink };
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No auth email for ${email}`);
}

async function registerViaUi(
  page: Page,
  email: string,
  phone: string,
  name: string,
  situation = "Employee",
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/join", { waitUntil: "load" });
      await page.getByLabel(/Full name/i).fill(name);
      await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
      await page.getByLabel(/^Email/i).fill(email);
      await page.getByLabel(/Professional status/i).selectOption(situation);
      await page.getByLabel(/What do you do professionally/i).fill("Engineer");
      await page.getByLabel(/Company, organisation or business/i).fill("TNCOD");
      await page.getByLabel(/What are you looking for/i).fill("Peers");
      await page.getByLabel(/What can you offer/i).fill("Help");
      await page.getByRole("button", { name: /Create my professional record/i }).click();
      await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`registerViaUi failed for ${email}`);
}

async function fetchTestAuth(request: APIRequestContext, email: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request.post("/api/test/auth-otp", { data: { email } });
    if (res.ok()) {
      const json = (await res.json()) as { otp?: string; actionLink?: string };
      if (json.otp || json.actionLink) return json;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

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

async function signInPasswordless(
  page: Page,
  request: APIRequestContext,
  email: string,
  next?: string,
) {
  const destination = next ?? "/dashboard";
  // Preferred local evidence path: server-set Auth cookies (no magic-link hop).
  try {
    await establishSession(page, email);
    await page.goto(destination, { waitUntil: "domcontentloaded" });
    return;
  } catch {
    // fall through to UI + helper OTP/link path
  }

  await page.goto(`/sign-in?next=${encodeURIComponent(destination)}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i }),
  ).toBeVisible({ timeout: 30_000 });
  const emailBox = page.getByRole("textbox", { name: /email/i });
  const requestBtn = page.getByRole("button", { name: /Email me a sign-in code/i });
  await expect(requestBtn).toBeEnabled({ timeout: 30_000 });
  await emailBox.click();
  await emailBox.fill("");
  await emailBox.fill(email);
  await expect(emailBox).toHaveValue(email);
  await requestBtn.click();
  await expect(page.getByRole("heading", { name: /Enter your code/i })).toBeVisible({
    timeout: 30_000,
  });

  const auth = await fetchTestAuth(request, email);
  if (auth?.actionLink) {
    await page.goto(auth.actionLink, { waitUntil: "domcontentloaded" });
    await page.goto(destination, { waitUntil: "domcontentloaded" });
    return;
  }

  try {
    const mail = await latestAuthEmail(request, email);
    if (mail.magicLink) {
      await page.goto(mail.magicLink, { waitUntil: "domcontentloaded" });
      await page.goto(destination, { waitUntil: "domcontentloaded" });
      return;
    }
    if (mail.otp) {
      await page.getByRole("textbox", { name: /sign-in code/i }).fill(mail.otp);
      await page.getByRole("button", { name: /^Continue$/i }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 60_000 });
      if (!page.url().includes(destination.split("?")[0]!)) {
        await page.goto(destination, { waitUntil: "domcontentloaded" });
      }
      return;
    }
  } catch {
    // fall through
  }
  throw new Error(`No session/OTP for passwordless sign-in (${email})`);
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

function metricValue(page: Page, key: string) {
  return page.locator(`[data-metric-value="${key}"]`);
}

test.describe("Phase 10 EXCO dashboard closeout", () => {
  test.setTimeout(360_000);

  test("authz + metrics + deep link + domain separation", async ({ page, request, browser }) => {
    const stamp = Date.now();
    const memberEmail = `p10-member-${stamp}@example.com`;
    const viewerEmail = `p10-viewer-${stamp}@example.com`;
    const adminEmail = `p10-admin-${stamp}@example.com`;
    const phoneM = `+2782${String(stamp).slice(-7)}`;
    const phoneV = `+2783${String(stamp).slice(-7)}`;
    const phoneA = `+2784${String(stamp).slice(-7)}`;

    // 1) Anonymous
    await page.goto("/exco", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    // 2) Member denied
    await registerViaUi(page, memberEmail, phoneM, "P10 Member");
    await signInPasswordless(page, request, memberEmail, "/exco");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /Operational overview/i })).toHaveCount(0);
    await page.goto("/exco/businesses", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Business review/i })).toHaveCount(0);

    // Seed deterministic metric rows (DB) then verify UI for EXCO
    const now = new Date();
    const windowStart = registrationWindowStartUtc(now, 30);
    const beforeCounts = {
      seeker: await prisma.profile.count({
        where: { deletedAt: null, professionalSituation: "Job seeker" },
      }),
      pendingBiz: await prisma.business.count({
        where: { deletedAt: null, businessStatus: { in: ["SUBMITTED", "PENDING_REVIEW"] } },
      }),
      verifiedBiz: await prisma.business.count({
        where: { deletedAt: null, businessStatus: "APPROVED" },
      }),
      pendingPro: await prisma.profile.count({
        where: { deletedAt: null, verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      verifiedPro: await prisma.profile.count({
        where: { deletedAt: null, verificationStatus: "VERIFIED" },
      }),
      businesses: await prisma.business.count({ where: { deletedAt: null } }),
      newReg: await prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: windowStart },
          profile: { is: { deletedAt: null } },
        },
      }),
    };

    const seekerUser = await prisma.user.findFirst({
      where: { email: memberEmail },
      include: { profile: true },
    });
    expect(seekerUser?.profile).toBeTruthy();
    // Only touch member-writable fields via Prisma. verification_status is
    // privileged (DB trigger) — elevate briefly for deterministic pending-pro proof.
    await prisma.profile.update({
      where: { id: seekerUser!.profile!.id },
      data: { professionalSituation: "Job seeker" },
    });
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
      await tx.$executeRawUnsafe(
        `UPDATE profiles SET verification_status = $1::"VerificationStatus" WHERE id = $2::uuid`,
        "PENDING",
        seekerUser!.profile!.id,
      );
    });
    const biz = await prisma.business.create({
      data: {
        name: `P10 Closeout Biz ${stamp}`,
        businessStatus: "SUBMITTED",
        visibilityStatus: "PRIVATE",
      },
    });

    // 3) EXCO_VIEWER
    const ctxViewer = await browser.newContext();
    const pageV = await ctxViewer.newPage();
    await registerViaUi(pageV, viewerEmail, phoneV, "P10 Viewer");
    await grantRole(viewerEmail, "EXCO_VIEWER");
    await signInPasswordless(pageV, pageV.request, viewerEmail, "/exco");
    await expect(pageV.getByRole("heading", { name: /Operational overview/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(pageV.getByText("New registrations (last 30 days)")).toBeVisible();
    await expect(pageV.getByText("Verified professionals")).toBeVisible();
    await expect(pageV.getByText("Verified businesses")).toBeVisible();
    await expect(pageV.getByText(/^Verified$/)).toHaveCount(0);

    const seekerUi = Number(await metricValue(pageV, "seeking-employment").innerText());
    const pendingBizUi = Number(await metricValue(pageV, "pending-business-verification").innerText());
    const pendingProUi = Number(
      await metricValue(pageV, "pending-professional-verification").innerText(),
    );
    expect(seekerUi).toBeGreaterThanOrEqual(beforeCounts.seeker + 1);
    expect(pendingBizUi).toBeGreaterThanOrEqual(beforeCounts.pendingBiz + 1);
    expect(pendingProUi).toBeGreaterThanOrEqual(beforeCounts.pendingPro + 1);

    // Deep link
    await pageV.getByRole("link", { name: /View businesses/i }).click();
    await expect(pageV).toHaveURL(/\/exco\/businesses/, { timeout: 30_000 });
    await expect(pageV.getByRole("heading", { name: /Business review/i })).toBeVisible();

    // 4) EXCO_ADMIN
    const ctxAdmin = await browser.newContext();
    const pageA = await ctxAdmin.newPage();
    await registerViaUi(pageA, adminEmail, phoneA, "P10 Admin");
    await grantRole(adminEmail, "EXCO_ADMIN");
    await signInPasswordless(pageA, pageA.request, adminEmail, "/exco");
    await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toBeVisible({
      timeout: 60_000,
    });

    // Adversarial: business verify must not collapse into professional verified UI meaning
    const verifiedProBefore = Number(
      await metricValue(pageA, "verified-professionals").innerText(),
    );
    await prisma.business.update({
      where: { id: biz.id },
      data: { businessStatus: "APPROVED" },
    });
    await pageA.reload({ waitUntil: "domcontentloaded" });
    const verifiedProAfter = Number(
      await metricValue(pageA, "verified-professionals").innerText(),
    );
    const verifiedBizAfter = Number(await metricValue(pageA, "verified-businesses").innerText());
    expect(verifiedProAfter).toBe(verifiedProBefore);
    expect(verifiedBizAfter).toBeGreaterThanOrEqual(beforeCounts.verifiedBiz + 1);

    // SUPER_ADMIN (existing hierarchy — no new roles)
    await grantRole(adminEmail, "SUPER_ADMIN");
    await pageA.goto("/exco", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toBeVisible({
      timeout: 60_000,
    });

    // Responsive smoke (locked Phase 10 viewport set)
    for (const width of [320, 375, 390, 430, 768, 1024, 1280]) {
      await pageA.setViewportSize({ width, height: 800 });
      await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toBeVisible();
      await expect(metricValue(pageA, "new-registrations-30d")).toBeVisible();
    }

    // A11y basics
    await pageA.setViewportSize({ width: 1280, height: 800 });
    await expect(pageA.locator("main, [role='main'], #main-content").first()).toBeVisible();
    await expect(pageA.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(pageA.getByRole("heading", { level: 2, name: /Needs attention/i })).toBeVisible();
    await pageA.keyboard.press("Tab");
    await expect(pageA.locator(":focus")).toBeVisible();

    // No /admin or /exco/dashboard
    await pageA.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toHaveCount(0);
    await pageA.goto("/exco/dashboard", { waitUntil: "domcontentloaded" });
    await expect(pageA.getByRole("heading", { name: /Operational overview/i })).toHaveCount(0);

    await ctxViewer.close();
    await ctxAdmin.close();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
