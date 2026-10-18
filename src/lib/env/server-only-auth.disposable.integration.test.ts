import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { chromium, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { registerProfessional } from "@/features/registration/register";
import { assertDisposableAuthEnv } from "@/features/registration/disposable-env-gate";
import { uploadBusinessDocument } from "@/features/business/business-documents";

// Explicitly excluded from ordinary CI. The named local runner must opt in;
// once opted in, unsafe endpoints or unhealthy prerequisites FAIL, not skip.
describe.skipIf(process.env.PHASE4_DISPOSABLE_AUTH_TESTS !== "1")("server-only Auth real local application", () => {
  it("registers, signs in through email, persists profile, enforces roles and signs out", async () => {
    const gate = assertDisposableAuthEnv({ ...process.env, NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL });
    expect(gate.ok).toBe(true);
    for (const [raw, port] of [[process.env.DATABASE_URL, "54322"], [process.env.SUPABASE_URL, "54321"], [process.env.MAILPIT_URL, "54324"]]) {
      const url = new URL(raw!);
      expect(url.hostname).toBe("127.0.0.1"); expect(url.port).toBe(port);
    }
    expect(process.env.SUPABASE_AUTH_SERVER_ONLY).toBe("1");
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined();
    const checks: Array<{ name: string; pass: boolean }> = [];
    const check = (name: string, pass: boolean) => {
      checks.push({ name, pass }); expect(pass, name).toBe(true);
    };
    const prisma = new PrismaClient();
    let server: ReturnType<typeof spawn> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    // Synthetic fixtures are deliberately retained with their unique run tag.
    // No pre-existing local records, mail or roles are changed/deleted.
    const stamp = randomUUID().replaceAll("-", "");
    const email = `autha.local.${stamp}@example.invalid`;
    let failure: string | null = null;
    let fixtureId: string | undefined;
    let awaiting = "disposable prerequisites";
    try {
      const migrations = await prisma.$queryRaw<Array<{ present: string | null }>>`SELECT to_regclass('app.registration_provisioning')::text AS present`;
      check("required registration migration present before fixture writes", Boolean(migrations[0]?.present));
      const register = await registerProfessional({
        fullName: "Auth Candidate Synthetic", phone: `+23480${String(Date.now()).slice(-8)}`,
        email, professionalSituation: "Employee", profession: "Engineer", organisation: "Local Proof",
        lookingFor: "Peers", offering: "Mentorship", website: "", captchaToken: "test-turnstile-token",
      }, { clientKey: `autha-local-${stamp}` });
      check("real registration command succeeds (test CAPTCHA, not UI CAPTCHA evidence)", register.ok && register.userId !== "accepted" && register.userId !== "spam");
      if (!register.ok) throw new Error("registration boundary failed");
      const id = register.userId;
      fixtureId = id;
      const registered = await prisma.user.findUniqueOrThrow({ where: { id }, include: { profile: true, userRoles: { include: { role: true } } } });
      check("Auth-linked active application record, private profile and MEMBER role persisted", registered.accountStatus === "ACTIVE" && registered.profile?.visibilityStatus === "PRIVATE" && registered.userRoles.some(r => r.role.name === "MEMBER"));
      const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production", AUTH_E2E_HELPER: "0" };
      server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3000"], { env, stdio: "ignore" });
      let ready = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        try { ready = (await fetch("http://127.0.0.1:3000/sign-in")).status === 200; } catch { /* bounded startup wait */ }
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      check("actual production-mode app starts with private local keys", ready);
      browser = await chromium.launch();
      const context = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
      const page = await context.newPage();
      const helper = await page.request.post("/api/test/auth-session", { data: { email } });
      check("session shortcut disabled", helper.status() === 404);
      await page.goto("/exco");
      check("anonymous EXCO route denied", new URL(page.url()).pathname === "/sign-in");

      const requestEmail = async (target: Page, next: string, mailbox = email) => {
        await target.goto(`/sign-in?next=${encodeURIComponent(next)}`);
        const send = target.getByRole("button", { name: "Send sign-in code", exact: true });
        await send.waitFor({ state: "visible" });
        await expect.poll(() => send.isEnabled()).toBe(true);
        await target.getByLabel("Email address", { exact: false }).fill(mailbox);
        await send.click();
        await target.getByLabel("Sign-in code", { exact: false }).waitFor();
        const verifier = (await target.context().cookies()).some(cookie => cookie.name.includes("code-verifier"));
        check("real OTP endpoint writes PKCE verifier cookie", verifier);
        awaiting = "real local email delivery after OTP request";
        const deadline = Date.now() + 20_000;
        for (let attempt = 0; attempt < 40 && Date.now() < deadline; attempt++) {
          const list = await fetch(`${process.env.MAILPIT_URL}/api/v1/messages?limit=50`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
          const item = list.messages?.find(m => m.To?.some(to => to.Address === mailbox));
          if (item) {
            const message = await fetch(`${process.env.MAILPIT_URL}/api/v1/message/${item.ID}`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { Text?: string; HTML?: string };
            return `${message.Text ?? ""}\n${message.HTML ?? ""}`;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error("real local email did not arrive");
      };
      const mail = await requestEmail(page, "/profile/edit");
      awaiting = "browser PKCE callback and profile save";
      const magic = mail.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify\?[^\s"'<>]+/i)?.[0]?.replaceAll("&amp;", "&");
      check("real email includes a provider verification link", Boolean(magic));
      if (!magic) throw new Error("no magic link");
      const magicUrl = new URL(magic);
      check("verification link restricted to disposable Auth", magicUrl.hostname === "127.0.0.1" && magicUrl.port === "54321");
      await page.goto(magic);
      await page.waitForURL("**/profile/edit", { timeout: 30_000 });
      check("real browser PKCE callback establishes app session and honors internal next", new URL(page.url()).pathname === "/profile/edit");
      await page.getByLabel("Preferred name", { exact: false }).fill("Auth Candidate Saved");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await page.waitForURL("**/profile", { timeout: 30_000 });
      const saved = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
      check("browser save persisted without verification/publication side effects", saved.displayName === "Auth Candidate Saved" && saved.verificationStatus === registered.profile!.verificationStatus && saved.visibilityStatus === "PRIVATE" && saved.profileStatus !== "REGISTERED");
      await page.reload();
      const own = await page.request.get("/api/member/profile");
      const ownData = await own.json() as { profile?: { userId: string; displayName: string } };
      check("session survives reload and own-profile loader reads persisted value", own.status() === 200 && ownData.profile?.userId === id && ownData.profile?.displayName === "Auth Candidate Saved");
      const substitution = await page.request.get(`/api/member/profile?userId=${randomUUID()}`);
      check("direct identity substitution denied", substitution.status() === 403);
      await page.goto("/exco");
      check("MEMBER cannot enter EXCO", new URL(page.url()).pathname === "/dashboard");

      const otherEmail = `autha.other.${stamp}@example.invalid`;
      const other = await registerProfessional({ fullName: "Auth Candidate Other", phone: `+23481${String(Date.now()).slice(-8)}`,
        email: otherEmail, professionalSituation: "Employee", profession: "Engineer", lookingFor: "Peers", offering: "Help",
        website: "", captchaToken: "test-turnstile-token" }, { clientKey: `autha-other-${stamp}` });
      check("separate synthetic document owner registered", other.ok && other.userId !== "accepted");
      if (!other.ok) throw new Error("other registration failed");
      const otherContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
      const otherPage = await otherContext.newPage();
      const otherMail = await requestEmail(otherPage, "/dashboard", otherEmail);
      awaiting = "numerical OTP, refresh and Storage consumers";
      const otp = otherMail.match(/\b(\d{6,8})\b/)?.[1];
      check("real local email contains a numerical OTP", Boolean(otp));
      await otherPage.getByLabel("Sign-in code", { exact: false }).fill(otp!);
      await otherPage.waitForURL("**/dashboard", { timeout: 30_000 });
      check("numerical email OTP verifies through the actual UI and Server Action", new URL(otherPage.url()).pathname === "/dashboard");

      // Expire only the local cookie's expiry metadata. Do not invent a JWT or
      // bypass Auth: the server must use the real refresh token to renew it.
      const sessionCookies = (await otherContext.cookies()).filter(c => /-auth-token(?:\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name));
      const encoded = sessionCookies.map(c => c.value).join("");
      const session = JSON.parse(Buffer.from(encoded.replace(/^base64-/, ""), "base64url").toString()) as { expires_at: number; refresh_token: string };
      const oldRefresh = session.refresh_token;
      session.expires_at = Math.floor(Date.now() / 1000) - 120;
      const expired = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
      const cookieName = sessionCookies[0]!.name.replace(/\.\d+$/, "");
      for (const cookie of sessionCookies) await otherContext.clearCookies({ name: cookie.name });
      for (let offset = 0, chunk = 0; offset < expired.length; offset += 3000, chunk++) {
        await otherContext.addCookies([{ ...sessionCookies[0]!, name: `${cookieName}.${chunk}`, value: expired.slice(offset, offset + 3000) }]);
      }
      const refreshed = await otherPage.request.get("/api/member/profile");
      const renewedCookies = (await otherContext.cookies()).filter(c => /-auth-token(?:\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name));
      const renewed = JSON.parse(Buffer.from(renewedCookies.map(c => c.value).join("").replace(/^base64-/, ""), "base64url").toString()) as { expires_at: number; refresh_token: string };
      check("actual app refreshes an expired cookie session with the private publishable key", refreshed.status() === 200 && renewed.expires_at > Date.now() / 1000 && renewed.refresh_token !== oldRefresh);

      const businessResponse = await otherPage.request.post("/api/member/businesses", { data: { name: `Auth proof ${stamp}`, relationshipType: "OWNER" } });
      const business = await businessResponse.json() as { businessId?: string };
      check("authenticated business creation persists through the real API", businessResponse.status() === 200 && Boolean(business.businessId));
      const bytes = Buffer.from("%PDF-1.4\n% Synthetic Auth candidate document\n%%EOF\n");
      const uploaded = await uploadBusinessDocument({ authUserId: other.userId, businessId: business.businessId!, documentType: "BUSINESS_REGISTRATION", fileName: "synthetic.pdf", bytes, claimedMimeType: "application/pdf" });
      check("actual private document upload accepts the modern administrative key", uploaded.ok);
      if (!uploaded.ok) throw new Error("document upload failed");
      const doc = await prisma.document.findUniqueOrThrow({ where: { id: uploaded.documentId } });
      const publicRead = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/public/member-documents/${doc.storageKey}`);
      check("uploaded document is not publicly readable", !publicRead.ok);
      const ownedDownload = await otherPage.request.get(`/api/member/documents/${doc.id}/signed-url`);
      check("authorized document API signs and serves the exact private bytes", ownedDownload.status() === 200 && (await ownedDownload.body()).equals(bytes));
      const memberDownload = await page.request.get(`/api/member/documents/${doc.id}/signed-url`, { maxRedirects: 0 });
      check("unrelated MEMBER cannot obtain the document signed URL", memberDownload.status() === 403);
      for (const roleName of ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] as const) {
        const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
        await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
        await page.goto("/exco");
        check(`${roleName} reaches EXCO with a real authenticated session`, new URL(page.url()).pathname === "/exco" && await page.locator("#main-content").count() === 1);
        const download = await page.request.get(`/api/member/documents/${doc.id}/signed-url`, { maxRedirects: 0 });
        check(`${roleName} document review boundary enforced`, roleName === "EXCO_VIEWER" ? download.status() === 403 : download.status() === 307);
        await prisma.userRole.delete({ where: { userId_roleId: { userId: id, roleId: role.id } } });
      }
      await otherPage.request.post("/auth/sign-out", { maxRedirects: 0 });
      await otherContext.close();
      await prisma.user.update({ where: { id }, data: { accountStatus: "SUSPENDED" } });
      const suspended = await page.request.get("/api/member/profile");
      check("active-identity boundary rejects an existing suspended session", suspended.status() === 401);
      await prisma.user.update({ where: { id }, data: { accountStatus: "ACTIVE" } });
      const signout = await page.request.post("/auth/sign-out", { maxRedirects: 0 });
      const after = await page.request.get("/api/member/profile");
      check("sign-out redirects safely and protected API has no session", signout.status() === 303 && after.status() === 401);
      await context.close();
    } catch {
      // Do not serialize browser URLs, email bodies, cookies, keys or raw provider errors.
      failure = checks.find(c => !c.pass)?.name ?? awaiting;
      if (!checks.some(c => !c.pass)) checks.push({ name: failure, pass: false });
      throw new Error(failure);
    } finally {
      await browser?.close();
      server?.kill();
      if (fixtureId) {
        // Undo temporary test privileges/status only on the identity created
        // by this run. Never alter another local account or delete fixtures.
        try {
          await prisma.userRole.deleteMany({ where: { userId: fixtureId, role: { name: { in: ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] } } } });
          await prisma.user.updateMany({ where: { id: fixtureId, email }, data: { accountStatus: "ACTIVE" } });
        } catch {
          failure ??= "synthetic actor privilege/status cleanup";
          checks.push({ name: "synthetic actor privilege/status cleanup", pass: false });
          process.exitCode = 1;
        }
      }
      await prisma.$disconnect();
      const report = { source: "actual local application / strict server-only candidate", at: new Date().toISOString(),
        database: "127.0.0.1:54322", auth: "127.0.0.1:54321", productionChanged: false,
        testSessionShortcutUsed: false, registrationCaptcha: "test verifier (not UI/real CAPTCHA proof)",
        fixtures: "unique synthetic local records retained; no pre-existing records changed", checks,
        passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, completed: failure === null, failure };
      await mkdir(".cache/auth-a", { recursive: true });
      await writeFile(".cache/auth-a/local-application.json", JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report));
    }
    if (failure) throw new Error(failure);
  }, 180_000);
});
