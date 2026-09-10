import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MAILPIT = process.env.INBUCKET_URL ?? process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

type MailpitMessageSummary = {
  ID: string;
  To?: Array<{ Address?: string }>;
};

async function latestAuthEmail(
  request: APIRequestContext,
  email: string,
): Promise<{ otp?: string; magicLink?: string }> {
  const normalized = email.toLowerCase();
  for (let attempt = 0; attempt < 40; attempt++) {
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
        if (otp || magicLink) {
          return { otp, magicLink };
        }
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No auth email found in Mailpit for ${email}`);
}

async function fetchTestOtp(request: APIRequestContext, email: string): Promise<string | null> {
  const res = await request.post("/api/test/auth-otp", { data: { email } });
  if (!res.ok()) return null;
  const json = (await res.json()) as { otp?: string };
  return json.otp ?? null;
}

async function forceStatus(
  profileId: string,
  verification: string,
  visibility: string,
  slug: string | null,
) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET verification_status = $1::"VerificationStatus",
           visibility_status = $2::"VisibilityStatus",
           public_slug = $3,
           location = 'Accra Metro'
       WHERE id = $4::uuid`,
      verification,
      visibility,
      slug,
      profileId,
    );
  });
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

async function signInPasswordless(
  page: Page,
  request: APIRequestContext,
  email: string,
  next?: string,
) {
  const path = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i }),
  ).toBeVisible({ timeout: 30_000 });
  const emailBox = page.getByRole("textbox", { name: /email/i });
  const requestBtn = page.getByRole("button", { name: /Email me a sign-in code/i });
  await expect(requestBtn).toBeEnabled({ timeout: 30_000 });
  await emailBox.fill(email);
  await requestBtn.click();
  await expect(page.getByRole("heading", { name: /Enter your code/i })).toBeVisible({
    timeout: 30_000,
  });

  let otp = await fetchTestOtp(request, email);
  if (!otp) {
    const authMail = await latestAuthEmail(request, email);
    otp = authMail.otp ?? null;
    if (!otp && authMail.magicLink) {
      await page.goto(authMail.magicLink, { waitUntil: "domcontentloaded" });
      return;
    }
  }
  if (!otp) throw new Error("Could not obtain OTP for passwordless sign-in");
  await page.getByRole("textbox", { name: /sign-in code/i }).fill(otp);
  const continueBtn = page.getByRole("button", { name: /^Continue$/i });
  await expect(continueBtn).toBeEnabled({ timeout: 30_000 });
  await continueBtn.click();
}

test.describe("Phase 14 forensic closeout", () => {
  test.setTimeout(420_000);

  test("privacy centre, persist, public withhold, negatives", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `p14c-${stamp}@example.com`;
    const phone = `+2784${String(stamp).slice(-7)}`;
    const slug = `p14c-${stamp}`;
    const name = "P14C Privacy Pro";

    await registerViaUi(page, email, phone, name);
    const user = await prisma.user.findFirst({
      where: { email },
      include: { profile: true },
    });
    expect(user?.profile).toBeTruthy();
    await forceStatus(user!.profile!.id, "VERIFIED", "DIRECTORY", slug);

    await signInPasswordless(page, request, email, "/settings/privacy");
    await expect(page).toHaveURL(/\/settings\/privacy/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /Privacy & visibility/i })).toBeVisible();
    await expect(page.getByText(/How visibility works/i)).toBeVisible();
    await expect(page.getByText(/not a legal consent form/i)).toBeVisible();

    const locationGroup = page.getByTestId("visibility-group-location");
    await locationGroup.getByLabel(/^Private —/i).click();
    await expect(locationGroup.getByLabel(/^Private —/i)).toBeChecked({ timeout: 30_000 });
    await expect(page.getByText(/Visibility preference saved/i)).toBeVisible({ timeout: 30_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(locationGroup.getByLabel(/^Private —/i)).toBeChecked();

    await page.goto(`/professionals/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Accra Metro/i)).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toMatch(/\+2784|@example\.com/i);

    await page.goto("/settings/privacy", { waitUntil: "domcontentloaded" });
    // Second group change via authoritative store (UI happy-path already proven on Location).
    await prisma.profileVisibilityPreference.upsert({
      where: {
        profileId_groupKey: { profileId: user!.profile!.id, groupKey: "professional" },
      },
      create: {
        profileId: user!.profile!.id,
        groupKey: "professional",
        preference: "PRIVATE",
      },
      update: { preference: "PRIVATE" },
    });

    await page.goto(`/professionals/${slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText(/\bEngineer\b/i)).toHaveCount(0);

    await page.goto("/settings/privacy", { waitUntil: "domcontentloaded" });
    const contactGroup = page.getByTestId("visibility-group-contact");
    await expect(contactGroup.getByLabel(/Public directory/i)).toHaveCount(0);
    await expect(contactGroup.getByLabel(/TNCOD members/i)).toHaveCount(0);

    await page.context().clearCookies();
    await page.goto("/settings/privacy", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    for (const width of [320, 375, 768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/professionals", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /Professionals Directory/i })).toBeVisible();
    }
  });
});
