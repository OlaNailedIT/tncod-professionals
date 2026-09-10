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

test.describe("Phase 8 profile completion", () => {
  test.describe.configure({ timeout: 180_000 });

  test("anonymous cannot access /profile", async ({ page }) => {
    await page.goto("/profile", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/sign-in\?next=/);
  });

  test("member sees derived completion, edits, and persistence", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase8.complete.${stamp}@example.com`;
    const phone = `+2782${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Phase Eight Member");
    await signInPasswordless(page, request, email, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });

    await expect(page.getByText(/Profile \d+% complete/i).first()).toBeVisible();
    await expect(page.getByText(/Verification:/i).first()).toBeVisible();
    await expect(page.getByText(/Visibility:/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /About you/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Professional/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Community/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Opportunities/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Business$/i })).toHaveCount(0);

    const beforeText = await page.getByText(/Profile \d+% complete/i).first().textContent();
    const beforePercent = Number(beforeText?.match(/(\d+)%/)?.[1] ?? "0");

    await page.locator('a[href="/profile/edit"]').first().click();
    await expect(page).toHaveURL(/\/profile\/edit/, { timeout: 30_000 });

    await page.getByLabel(/^Location/i).fill("Johannesburg");
    await page.getByLabel(/^Bio/i).fill("Building community through technology.");
    await page.getByLabel(/^Industry/i).selectOption({ label: "Technology" });
    await page.getByLabel(/Years of experience/i).fill("5");
    await page.getByLabel(/^Skills/i).fill("TypeScript, Mentoring");
    await page.getByLabel(/^Services/i).fill("Consulting");
    await page.getByLabel(/^LinkedIn/i).fill("https://www.linkedin.com/in/phase8-member");
    await page.getByLabel(/Areas of service/i).fill("Youth and media");
    await page.getByLabel(/^Collaboration/i).selectOption("yes");
    await page.getByLabel(/^Mentorship/i).selectOption("no");
    await page.getByLabel(/^Referrals/i).selectOption("yes");
    await page.getByLabel(/^Training/i).selectOption("no");
    await page.getByRole("button", { name: /Save changes/i }).click();

    await expect(page).toHaveURL(/\/profile$/, { timeout: 60_000 });
    await expect(page.getByText(/Johannesburg/i).first()).toBeVisible();
    await expect(page.getByText(/Building community through technology/i).first()).toBeVisible();
    await expect(page.getByText(/TypeScript/i).first()).toBeVisible();
    await expect(page.getByText(/Technology/i).first()).toBeVisible();
    await expect(page.getByText(/Not available in this step yet/i).first()).toBeVisible();

    const afterText = await page.getByText(/Profile \d+% complete/i).first().textContent();
    const afterPercent = Number(afterText?.match(/(\d+)%/)?.[1] ?? "0");
    expect(afterPercent).toBeGreaterThan(beforePercent);
    expect(afterPercent).toBeLessThanOrEqual(100);

    await page.reload({ waitUntil: "load" });
    await expect(page.getByText(new RegExp(`Profile ${afterPercent}% complete`, "i")).first()).toBeVisible();

    const progress = page.getByRole("progressbar").first();
    await expect(progress).toHaveAttribute("aria-valuenow", String(afterPercent));
    await expect(progress).toHaveAttribute("aria-valuemin", "0");
    await expect(progress).toHaveAttribute("aria-valuemax", "100");
  });

  test("business section appears for entrepreneur situation without penalizing employees", async ({
    page,
    request,
  }) => {
    const stamp = Date.now();
    const email = `phase8.biz.${stamp}@example.com`;
    const phone = `+2783${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Biz Owner Member", "Entrepreneur / business owner");
    await signInPasswordless(page, request, email, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /^Business$/i })).toBeVisible();
    await expect(page.getByText(/linked business relationships/i)).toBeVisible();
  });

  test("IDOR: claimed other userId is forbidden", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase8.idor.${stamp}@example.com`;
    const phone = `+2784${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Idor Member");
    await signInPasswordless(page, request, email, "/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    const res = await page.request.get(
      `/api/member/profile?userId=00000000-0000-4000-8000-000000000099`,
    );
    expect(res.status()).toBe(403);
  });

  test("responsive profile at narrow viewport", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase8.mobile.${stamp}@example.com`;
    const phone = `+2785${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Mobile Member");
    await signInPasswordless(page, request, email, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 60_000 });

    await page.setViewportSize({ width: 320, height: 720 });
    await expect(page.getByText(/Profile \d+% complete/i).first()).toBeVisible();
    const overflow = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return true;
      return main.scrollWidth > main.clientWidth + 1;
    });
    expect(overflow).toBe(false);
  });
});
