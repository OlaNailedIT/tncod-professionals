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
      await page.getByLabel(/What can you offer/i).fill("Mentorship");
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

async function fetchTestOtp(request: APIRequestContext, email: string): Promise<string | null> {
  const res = await request.post("/api/test/auth-otp", { data: { email } });
  if (!res.ok()) return null;
  const json = (await res.json()) as { otp?: string };
  return json.otp ?? null;
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
    // fall through — preserve UI OTP evidence path
  }

  const path = next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i })).toBeVisible({
    timeout: 30_000,
  });
  const emailBox = page.getByRole("textbox", { name: /email/i });
  const requestBtn = page.getByRole("button", { name: /Email me a sign-in code/i });
  // Wait for client hydration first — filling before hydrate is wiped by React defaultValues.
  await expect(requestBtn).toBeEnabled({ timeout: 30_000 });
  await emailBox.fill(email);
  await expect(emailBox).toHaveValue(email);
  await requestBtn.click();
  await expect(page.getByRole("heading", { name: /Enter your code/i })).toBeVisible({
    timeout: 30_000,
  });

  // Prefer local E2E helper (generateLink OTP). Fall back to Mailpit OTP / magic link.
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

test.describe("Phase 7 authentication & profile access", () => {
  test.describe.configure({ timeout: 180_000 });

  test("anonymous protected routes redirect to sign-in", async ({ page }) => {
    for (const path of ["/dashboard", "/profile", "/profile/edit"]) {
      await page.goto(path, { waitUntil: "load" });
      await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=`));
      expect(page.url()).toContain("next=");
    }
  });

  test("rejects external next redirect", async ({ page }) => {
    await page.goto("/sign-in?next=https://evil.example", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Access your TNCOD Professionals profile/i })).toBeVisible();
    expect(page.url()).toMatch(/127\.0\.0\.1:3000\/sign-in/);
  });

  test("passwordless sign-in, profile, edit, logout, refresh", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase7.e2e.${stamp}@tncod.test`;
    const phone = `082${String(stamp).slice(-7)}`;

    await registerViaUi(page, email, phone, "Phase7 Auth User");
    await signInPasswordless(page, request, email, "/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();
    await expect(page.getByText(/Profile: REGISTERED/i)).toBeVisible();
    await expect(page.getByText(/Verification: NOT_REVIEWED/i)).toBeVisible();
    await expect(page.getByText(/Directory: PRIVATE/i)).toBeVisible();

    await page.reload({ waitUntil: "load" });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Welcome/i })).toBeVisible();

    await page.goto("/profile", { waitUntil: "load" });
    await expect(page.getByText("Phase7 Auth User")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await page.goto("/profile/edit", { waitUntil: "load" });
    await page.getByLabel(/Preferred name|Full name/i).fill("Phase7 Auth User Edited");
    await page.getByRole("button", { name: /Save changes/i }).click();
    await expect(page).toHaveURL(/\/profile$/, { timeout: 30_000 });
    await expect(page.getByText("Phase7 Auth User Edited")).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole("button", { name: /^Account$/i }).first().click();
    await page.getByRole("menuitem", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });

    await page.goto("/dashboard", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("IDOR: claimed userId substitution denied", async ({ page, request, browser }) => {
    const stamp = Date.now();
    const emailA = `phase7.a.${stamp}@tncod.test`;
    const emailB = `phase7.b.${stamp}@tncod.test`;
    const phoneA = `083${String(stamp).slice(-7)}`;
    const phoneB = `084${String(stamp).slice(-7)}`;

    await registerViaUi(page, emailA, phoneA, "Member A");
    await registerViaUi(page, emailB, phoneB, "Member B");

    await signInPasswordless(page, request, emailA);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 60_000 });

    const me = await page.request.get("/api/member/profile");
    expect(me.status()).toBe(200);
    const meJson = (await me.json()) as { profile: { userId: string } };
    const userA = meJson.profile.userId;

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await signInPasswordless(pageB, request, emailB);
    await expect(pageB).toHaveURL(/\/dashboard/, { timeout: 60_000 });
    const other = await pageB.request.get("/api/member/profile");
    const otherJson = (await other.json()) as { profile: { userId: string } };
    const userB = otherJson.profile.userId;
    await contextB.close();

    expect(userA).not.toBe(userB);

    const forbidden = await page.request.get(`/api/member/profile?userId=${userB}`);
    expect(forbidden.status()).toBe(403);

    const patch = await page.request.patch("/api/member/profile", {
      data: {
        claimedUserId: userB,
        displayName: "Hijack",
        phone: phoneA,
        professionalSituation: "Employee",
        profession: "Engineer",
        lookingFor: "Peers",
        offering: "Help",
      },
    });
    expect(patch.status()).toBe(403);
  });

  test("sign-in next preserves internal destination", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `phase7.next.${stamp}@tncod.test`;
    const phone = `085${String(stamp).slice(-7)}`;
    await registerViaUi(page, email, phone, "Next Path User");
    await signInPasswordless(page, request, email, "/profile/edit");
    await expect(page).toHaveURL(/\/profile\/edit/, { timeout: 60_000 });
  });

  for (const width of [320, 375, 390, 430, 768, 1024, 1280] as const) {
    test(`sign-in responsive @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/sign-in", { waitUntil: "load" });
      const metrics = await page.evaluate(() => ({
        overflowDelta: document.documentElement.scrollWidth - window.innerWidth,
      }));
      expect(metrics.overflowDelta).toBeLessThanOrEqual(1);
    });
  }
});
