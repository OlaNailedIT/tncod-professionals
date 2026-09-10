import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const MAILPIT = process.env.INBUCKET_URL ?? process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const prisma = new PrismaClient();

type MailpitMessageSummary = {
  ID: string;
  To?: Array<{ Address?: string }>;
};

async function latestAuthEmail(
  request: APIRequestContext,
  email: string,
): Promise<{ otp?: string; magicLink?: string }> {
  const normalized = email.toLowerCase();
  for (let attempt = 0; attempt < 12; attempt++) {
    const list = await request.get(`${MAILPIT}/api/v1/messages?limit=50`);
    if (list.ok()) {
      const payload = (await list.json()) as { messages?: MailpitMessageSummary[] };
      const candidates = (payload.messages ?? []).filter((m) =>
        (m.To ?? []).some((t) => (t.Address ?? "").toLowerCase() === normalized),
      );
      for (const summary of candidates) {
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
  throw new Error(`No auth email found in Mailpit for ${email}`);
}

async function registerViaUi(
  page: Page,
  email: string,
  phone: string,
  name: string,
  situation = "Entrepreneur / business owner",
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto("/join", { waitUntil: "load" });
      await page.getByLabel(/Full name/i).fill(name);
      await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
      await page.getByLabel(/^Email/i).fill(email);
      await page.getByLabel(/Professional status/i).selectOption(situation);
      await page.getByLabel(/What do you do professionally/i).fill("Founder");
      await page.getByLabel(/Company, organisation or business/i).fill("TNCOD");
      await page.getByLabel(/What are you looking for/i).fill("Clients");
      await page.getByLabel(/What can you offer/i).fill("Services");
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

async function fetchTestAuth(
  request: APIRequestContext,
  email: string,
): Promise<{ otp?: string; actionLink?: string } | null> {
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
  try {
    await establishSession(page, email);
    await page.goto(destination, { waitUntil: "domcontentloaded" });
    return;
  } catch {
    // fall through to UI OTP path
  }

  const path = `/sign-in?next=${encodeURIComponent(destination)}`;
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i })).toBeVisible({
    timeout: 30_000,
  });
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
  let otp = auth?.otp ?? null;
  if (!otp) {
    try {
      const authMail = await latestAuthEmail(request, email);
      otp = authMail.otp ?? null;
      if (!otp && authMail.magicLink) {
        await page.goto(authMail.magicLink, { waitUntil: "domcontentloaded" });
        await page.goto(destination, { waitUntil: "domcontentloaded" });
        return;
      }
    } catch {
      // fall through
    }
  }
  if (!otp) {
    throw new Error(`Could not obtain OTP for passwordless sign-in (${email})`);
  }
  await page.getByRole("textbox", { name: /sign-in code/i }).fill(otp);
  const continueBtn = page.getByRole("button", { name: /^Continue$/i });
  await expect(continueBtn).toBeEnabled({ timeout: 30_000 });
  await continueBtn.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 60_000 });
  if (page.url().includes(destination.split("?")[0]!) === false && next) {
    await page.goto(destination, { waitUntil: "domcontentloaded" });
  }
}

function tinyPdf(): Buffer {
  // Minimal PDF with %PDF magic
  return Buffer.from("%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
}

test.describe("Phase 9 business profile & verification closeout", () => {
  test.setTimeout(360_000);

  test("member create → persist → submit → EXCO decide → IDOR denied", async ({ page, request, browser }) => {
    const stamp = Date.now();
    const emailA = `p9a-${stamp}@example.com`;
    const emailB = `p9b-${stamp}@example.com`;
    const emailExco = `p9exco-${stamp}@example.com`;
    const phoneA = `+2782${String(stamp).slice(-7)}`;
    const phoneB = `+2783${String(stamp).slice(-7)}`;
    const phoneExco = `+2784${String(stamp).slice(-7)}`;
    const businessName = `Phase9 Biz ${stamp}`;
    const cacNumber = `CAC-${stamp}`;

    await registerViaUi(page, emailA, phoneA, "Phase Nine Alpha");
    await signInPasswordless(page, request, emailA, "/businesses/new");

    await expect(page.getByRole("heading", { name: /Add a business/i })).toBeVisible({ timeout: 30_000 });
    // Wait for client hydration before filling — React defaultValues wipe pre-hydrate input.
    await expect(page.getByRole("button", { name: /Create business/i })).toBeEnabled({
      timeout: 30_000,
    });
    await page.getByLabel(/^Business name/i).fill(businessName);
    await page.getByLabel(/^Description/i).fill("Company profile for verification.");
    await page.getByLabel(/^Location/i).fill("Lagos");
    await page.getByLabel(/Business phone/i).fill(phoneA);
    await page.getByLabel(/Business email/i).fill(emailA);
    await page.getByLabel(/^Website/i).fill("https://phase9.example");
    await page.getByLabel(/^Services offered/i).fill("Consulting, Training");
    await expect(page.getByLabel(/^Business name/i)).toHaveValue(businessName);
    await page.getByRole("button", { name: /Create business/i }).click();
    await expect(page.getByText(/Could not save|Please correct/i)).toHaveCount(0);
    await expect(page).toHaveURL(/\/businesses\/[0-9a-f-]{36}/, { timeout: 60_000 });

    const businessUrl = page.url();
    const businessId = businessUrl.split("/businesses/")[1]!.split(/[/?#]/)[0]!;

    const dbBiz = await prisma.business.findUnique({ where: { id: businessId } });
    expect(dbBiz?.name).toBe(businessName);
    expect(dbBiz?.businessStatus).toBe("DRAFT");
    expect(dbBiz?.visibilityStatus).toBe("PRIVATE");

    const userA = await prisma.user.findFirst({
      where: { email: emailA },
      include: { profile: true },
    });
    expect(userA?.profile).toBeTruthy();
    const link = await prisma.businessProfessional.findUnique({
      where: {
        businessId_profileId: { businessId, profileId: userA!.profile!.id },
      },
    });
    expect(link?.relationshipType).toBe("OWNER");

    const profBefore = {
      verificationStatus: userA!.profile!.verificationStatus,
      visibilityStatus: userA!.profile!.visibilityStatus,
    };

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: businessName })).toBeVisible();

    await page.goto(`/businesses/${businessId}/verification`);
    await page.getByLabel(/Registered with CAC/i).selectOption("yes");
    await page.getByLabel(/^CAC number/i).fill(cacNumber);

    const pdf = tinyPdf();
    await page.setInputFiles('input[type="file"]', {
      name: "cac.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await page.getByRole("button", { name: /Upload document/i }).click();
    await expect(page.getByText(/cac\.pdf/i)).toBeVisible({ timeout: 90_000 });

    const docs = await prisma.document.findMany({ where: { businessId } });
    expect(docs.length).toBeGreaterThan(0);
    const storageKey = docs[0]!.storageKey;
    expect(storageKey.startsWith(`documents/${userA!.id}/`)).toBe(true);

    const storageObjects = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM storage.objects WHERE bucket_id = 'member-documents' AND name = $1`,
      storageKey,
    );
    expect(storageObjects.length).toBe(1);

    await page.getByRole("button", { name: /Submit for verification/i }).click();
    await expect(page.getByText(/^Pending$/)).toBeVisible({ timeout: 60_000 });

    const afterSubmit = await prisma.business.findUnique({ where: { id: businessId } });
    expect(afterSubmit?.businessStatus).toBe("SUBMITTED");
    expect(afterSubmit?.cacNumber).toBe(cacNumber);

    // Self-verify attempt via API must fail validation / not set APPROVED
    const forge = await page.request.patch("/api/member/businesses", {
      data: {
        businessId,
        action: "update",
        name: businessName,
        businessStatus: "APPROVED",
      },
    });
    const still = await prisma.business.findUnique({ where: { id: businessId } });
    expect(still?.businessStatus).toBe("SUBMITTED");
    expect(forge.status()).not.toBe(500);

    // Member B IDOR
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await registerViaUi(pageB, emailB, phoneB, "Phase Nine Beta", "Employee");
    await signInPasswordless(pageB, pageB.request, emailB, "/dashboard");
    const idorGet = await pageB.request.get(`/api/member/businesses?id=${businessId}`);
    expect(idorGet.status()).toBe(403);
    const idorPatch = await pageB.request.patch("/api/member/businesses", {
      data: { businessId, name: "Hijacked", action: "update" },
    });
    expect(idorPatch.status()).toBe(403);
    const idorDoc = await pageB.request.get(`/api/member/documents/${docs[0]!.id}/signed-url`, {
      maxRedirects: 0,
    });
    expect([401, 403]).toContain(idorDoc.status());
    await contextB.close();

    // Grant EXCO_ADMIN to reviewer (separate browser context)
    const contextExco = await browser.newContext();
    const pageExco = await contextExco.newPage();
    await registerViaUi(pageExco, emailExco, phoneExco, "Phase Nine Exco", "Employee");
    const excoUser = await prisma.user.findFirst({ where: { email: emailExco } });
    const excoRole = await prisma.role.findUnique({ where: { name: "EXCO_ADMIN" } });
    expect(excoUser && excoRole).toBeTruthy();
    await prisma.userRole.create({
      data: { userId: excoUser!.id, roleId: excoRole!.id },
    });

    await signInPasswordless(pageExco, pageExco.request, emailExco, `/exco/businesses/${businessId}`);
    await expect(pageExco.getByRole("heading", { name: businessName })).toBeVisible({ timeout: 60_000 });
    await expect(pageExco.getByRole("button", { name: /Verify business/i })).toBeEnabled({
      timeout: 30_000,
    });
    await pageExco.getByLabel(/Member-facing reason/i).fill("Looks good.");
    await pageExco.getByRole("button", { name: /Verify business/i }).click();
    await expect(pageExco.getByText("Verified").first()).toBeVisible({ timeout: 30_000 });

    const verified = await prisma.business.findUnique({ where: { id: businessId } });
    expect(verified?.businessStatus).toBe("APPROVED");
    expect(verified?.visibilityStatus).toBe("PRIVATE");

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: businessId, action: "business.verification.approve" },
    });
    expect(audit).toBeTruthy();

    const vr = await prisma.verificationRecord.findFirst({
      where: { businessId, decision: "APPROVED" },
    });
    expect(vr).toBeTruthy();

    const profAfter = await prisma.profile.findUnique({ where: { id: userA!.profile!.id } });
    expect(profAfter?.verificationStatus).toBe(profBefore.verificationStatus);
    expect(profAfter?.visibilityStatus).toBe(profBefore.visibilityStatus);

    await prisma.business.update({
      where: { id: businessId },
      data: { businessStatus: "SUBMITTED" },
    });
    const clarify = await pageExco.request.post(`/api/exco/businesses/${businessId}`, {
      data: {
        action: "request_clarification",
        memberFacingMessage: "Please re-upload CAC.",
        internalNote: "Internal only",
      },
    });
    expect(clarify.ok()).toBeTruthy();
    const clarified = await prisma.business.findUnique({ where: { id: businessId } });
    expect(clarified?.businessStatus).toBe("NEEDS_CLARIFICATION");
    expect(clarified?.clarificationMessage).toBe("Please re-upload CAC.");

    // Member A session should still be active on `page`.
    await page.goto(`/businesses/${businessId}/verification`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Please re-upload CAC/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Resubmit for verification/i })).toBeVisible();

    const resubmit = await page.request.patch("/api/member/businesses", {
      data: {
        businessId,
        action: "submit_verification",
        cacRegistered: "yes",
        cacNumber,
      },
    });
    expect(resubmit.ok()).toBeTruthy();
    await expect
      .poll(async () => {
        const row = await prisma.business.findUnique({ where: { id: businessId } });
        return row?.businessStatus ?? null;
      }, { timeout: 30_000 })
      .toBe("SUBMITTED");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Pending/i).first()).toBeVisible({ timeout: 30_000 });

    await contextExco.close();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });
});
