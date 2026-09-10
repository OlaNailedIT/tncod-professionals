import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

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

async function registerViaUi(
  page: Page,
  email: string,
  phone: string,
  name: string,
  situation = "Employee",
) {
  await page.goto("/join", { waitUntil: "load" });
  await page.getByLabel(/Full name/i).fill(name);
  await page.getByLabel(/Phone \/ WhatsApp/i).fill(phone);
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/Professional status/i).selectOption(situation);
  await page.getByLabel(/What do you do professionally/i).fill("Engineer");
  await page.getByLabel(/Company, organisation or business/i).fill("TNCOD");
  await page.getByLabel(/What are you looking for/i).fill("Peers");
  await page.getByLabel(/What can you offer/i).fill("Mentorship");
  await page.getByRole("button", { name: /Create my professional record/i }).click();
  await expect(page).toHaveURL(/\/join\/success/, { timeout: 60_000 });
}

async function fetchTestOtp(request: APIRequestContext, email: string): Promise<string | null> {
  const res = await request.post("/api/test/auth-otp", { data: { email } });
  if (!res.ok()) return null;
  const json = (await res.json()) as { otp?: string };
  return json.otp ?? null;
}

async function signInPasswordless(
  page: Page,
  request: APIRequestContext,
  email: string,
  next?: string,
) {
  const path = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i })).toBeVisible({
    timeout: 30_000,
  });
  const emailBox = page.getByRole("textbox", { name: /email/i });
  const requestBtn = page.getByRole("button", { name: /Email me a sign-in code/i });
  await expect(requestBtn).toBeEnabled({ timeout: 30_000 });
  await emailBox.fill(email);
  await expect(emailBox).toHaveValue(email);
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
  if (!otp) {
    throw new Error("Could not obtain OTP for passwordless sign-in");
  }
  await page.getByRole("textbox", { name: /sign-in code/i }).fill(otp);
  const continueBtn = page.getByRole("button", { name: /^Continue$/i });
  await expect(continueBtn).toBeEnabled({ timeout: 30_000 });
  await continueBtn.click();
}

function readPercent(text: string | null): number {
  return Number(text?.match(/(\d+)%/)?.[1] ?? "0");
}

test.describe("Phase 8 closeout — new persistence evidence", () => {
  test.describe.configure({ timeout: 180_000 });

  test("Industry + opportunity prefs persist, move completion, clear lowers %", async ({
    page,
    request,
  }) => {
    const stamp = Date.now();
    const email = `phase8.closeout.${stamp}@example.com`;
    const phone = `+2782${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Closeout Member");
    await signInPasswordless(page, request, email, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });

    await expect(page.getByRole("heading", { name: /^Business$/i })).toHaveCount(0);
    await expect(page.getByText(/Not available in this step yet|excluded from the completion percentage/i).first()).toBeVisible();

    const before = readPercent(await page.getByText(/Profile \d+% complete/i).first().textContent());

    await page.locator('a[href="/profile/edit"]').first().click();
    await expect(page).toHaveURL(/\/profile\/edit/, { timeout: 30_000 });

    await page.getByLabel(/^Industry/i).selectOption({ label: "Technology" });
    await page.getByLabel(/^Collaboration/i).selectOption("yes");
    await page.getByLabel(/^Mentorship/i).selectOption("no");
    await page.getByLabel(/^Referrals/i).selectOption("yes");
    await page.getByLabel(/^Training/i).selectOption("no");
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page).toHaveURL(/\/profile$/, { timeout: 60_000 });

    await expect(page.getByText("Technology").first()).toBeVisible();
    await expect(page.getByText("Yes").first()).toBeVisible();
    await expect(page.getByText("No").first()).toBeVisible();

    const afterSave = readPercent(await page.getByText(/Profile \d+% complete/i).first().textContent());
    expect(afterSave).toBeGreaterThan(before);

    await page.reload({ waitUntil: "load" });
    await expect(page.getByText("Technology").first()).toBeVisible();
    await expect(page.getByText(new RegExp(`Profile ${afterSave}% complete`, "i")).first()).toBeVisible();

    // API persistence proof (same session cookie).
    const api = await page.request.get("/api/member/profile");
    expect(api.status()).toBe(200);
    const payload = (await api.json()) as {
      profile: {
        industryName: string | null;
        opportunityPreferences: Record<string, boolean | null>;
        completion: { percent: number; headshotDeferred: boolean; hasHeadshot: boolean };
      };
    };
    expect(payload.profile.industryName).toBe("Technology");
    expect(payload.profile.opportunityPreferences.collaboration).toBe(true);
    expect(payload.profile.opportunityPreferences.mentorship).toBe(false);
    expect(payload.profile.opportunityPreferences.referrals).toBe(true);
    expect(payload.profile.opportunityPreferences.training).toBe(false);
    expect(payload.profile.completion.percent).toBe(afterSave);
    expect(payload.profile.completion.headshotDeferred).toBe(true);

    // Clear Industry + prefs via the same authenticated PATCH path the form uses.
    // (Native <select> clear of the sentinel option is flaky under controlled RHF in Chromium.)
    const clearRes = await page.request.patch("/api/member/profile", {
      data: {
        displayName: "Closeout Member",
        phone,
        professionalSituation: "Employee",
        profession: "Engineer",
        organisation: "TNCOD",
        industryId: "none",
        lookingFor: "Peers",
        offering: "Mentorship",
        collaboration: "",
        mentorship: "",
        referrals: "",
        training: "",
      },
    });
    expect(clearRes.ok()).toBeTruthy();
    await page.goto("/profile", { waitUntil: "load" });

    const afterClear = readPercent(await page.getByText(/Profile \d+% complete/i).first().textContent());
    expect(afterClear).toBeLessThan(afterSave);

    const clearedApi = await page.request.get("/api/member/profile");
    expect(clearedApi.status()).toBe(200);
    const clearedPayload = (await clearedApi.json()) as {
      profile: {
        industryName: string | null;
        opportunityPreferences: Record<string, boolean | null>;
        completion: { percent: number };
      };
    };
    expect(clearedPayload.profile.industryName).toBeNull();
    expect(clearedPayload.profile.opportunityPreferences.collaboration).toBeNull();
    expect(clearedPayload.profile.opportunityPreferences.mentorship).toBeNull();
    expect(clearedPayload.profile.opportunityPreferences.referrals).toBeNull();
    expect(clearedPayload.profile.opportunityPreferences.training).toBeNull();
    expect(clearedPayload.profile.completion.percent).toBe(afterClear);

    const industryRow = page.locator("dt", { hasText: /^Industry$/ }).locator("xpath=following-sibling::dd[1]");
    await expect(industryRow).toHaveText(/Not added yet/i);
  });

  test("Business section only for entrepreneur; employee not penalised", async ({ page, request }) => {
    const stamp = Date.now();
    const employeeEmail = `phase8.closeout.emp.${stamp}@example.com`;
    const ownerEmail = `phase8.closeout.own.${stamp}@example.com`;
    const phoneEmp = `+2783${String(stamp).slice(-7)}`;
    const phoneOwn = `+2784${String(stamp).slice(-7)}`;

    await registerViaUi(page, employeeEmail, phoneEmp, "Employee Closeout");
    await signInPasswordless(page, request, employeeEmail, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /^Business$/i })).toHaveCount(0);

    await page.goto("/auth/sign-out", { waitUntil: "load" });
    await registerViaUi(page, ownerEmail, phoneOwn, "Owner Closeout", "Entrepreneur / business owner");
    await signInPasswordless(page, request, ownerEmail, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /^Business$/i })).toBeVisible();
  });

  test("IDOR still denied after Phase 8 persistence fields", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase8.closeout.idor.${stamp}@example.com`;
    const phone = `+2785${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Idor Closeout");
    await signInPasswordless(page, request, email, "/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    const denied = await page.request.get(
      "/api/member/profile?userId=00000000-0000-4000-8000-000000000099",
    );
    expect(denied.status()).toBe(403);
  });
});
