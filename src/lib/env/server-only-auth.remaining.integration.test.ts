import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { assertDisposableAuthEnv } from "@/features/registration/disposable-env-gate";
import { registerProfessional } from "@/features/registration/register";
import { uploadBusinessDocument } from "@/features/business/business-documents";

describe.skipIf(process.env.PHASE4_DISPOSABLE_AUTH_TESTS !== "1")("remaining server-only Auth browser acceptance", () => {
  it("uses one real emailed code, refreshes the session and downloads through the signed-document API", async () => {
    expect(assertDisposableAuthEnv({ ...process.env, NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL }).ok).toBe(true);
    for (const [raw, port] of [[process.env.DATABASE_URL, "54322"], [process.env.SUPABASE_URL, "54321"], [process.env.MAILPIT_URL, "54324"]]) {
      const url = new URL(raw!); expect(url.hostname).toBe("127.0.0.1"); expect(url.port).toBe(port);
    }
    expect(process.env.SUPABASE_AUTH_SERVER_ONLY).toBe("1");
    expect(process.env.AUTH_E2E_HELPER).toBe("0");
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined();
    const prisma = new PrismaClient();
    const checks: Array<{ name: string; pass: boolean }> = [];
    const check = (name: string, pass: boolean) => { checks.push({ name, pass }); expect(pass, name).toBe(true); };
    let stage = "disposable prerequisites", failure: string | null = null;
    let server: ReturnType<typeof spawn> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      const schema = await prisma.$queryRaw<Array<{ present: string | null }>>`SELECT to_regclass('app.registration_provisioning')::text AS present`;
      check("required registration schema exists", Boolean(schema[0]?.present));
      const stamp = randomUUID().replaceAll("-", "");
      const email = `autha.remaining.${stamp}@example.invalid`;
      const registered = await registerProfessional({ fullName: "Auth Remaining Synthetic", email,
        phone: `+23484${String(Date.now()).slice(-8)}`, professionalSituation: "Employee", profession: "Engineer",
        lookingFor: "Peers", offering: "Help", website: "", captchaToken: "test-turnstile-token" }, { clientKey: `remaining-${stamp}` });
      check("synthetic registration succeeds without an email/session shortcut", registered.ok && registered.userId !== "accepted" && registered.userId !== "spam");
      if (!registered.ok) throw new Error("registration failed");
      const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: "production", AUTH_E2E_HELPER: "0" };
      server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3000"], { env, stdio: "ignore" });
      let ready = false;
      for (let attempt = 0; attempt < 40; attempt++) {
        try { ready = (await fetch("http://127.0.0.1:3000/sign-in", { signal: AbortSignal.timeout(2000) })).status === 200; } catch { /* bounded readiness */ }
        if (ready) break; await new Promise(resolve => setTimeout(resolve, 500));
      }
      check("strict production-mode local app is ready", ready);
      browser = await chromium.launch();
      const context = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
      const page = await context.newPage();
      const helper = await page.request.post("/api/test/auth-session", { data: { email } });
      check("session shortcut remains disabled", helper.status() === 404);
      stage = "real email OTP request and delivery";
      await page.goto("/sign-in");
      const send = page.getByRole("button", { name: "Send sign-in code", exact: true });
      await expect.poll(() => send.isEnabled()).toBe(true);
      await page.getByLabel("Email address", { exact: false }).fill(email);
      await send.click();
      await page.getByLabel("Sign-in code", { exact: false }).waitFor();
      const deadline = Date.now() + 20_000;
      let otp: string | undefined;
      while (!otp && Date.now() < deadline) {
        const messages = await fetch(`${process.env.MAILPIT_URL}/api/v1/messages?limit=50`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
        const item = messages.messages?.find(m => m.To?.some(to => to.Address.toLowerCase() === email));
        if (item) {
          const body = await fetch(`${process.env.MAILPIT_URL}/api/v1/message/${item.ID}`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { Text?: string; HTML?: string };
          otp = `${body.Text ?? ""}\n${body.HTML ?? ""}`.match(/\b(\d{6,8})\b/)?.[1];
        }
        if (!otp) await new Promise(resolve => setTimeout(resolve, 500));
      }
      check("single genuine OTP email received in the local mailbox", Boolean(otp));
      stage = "numerical OTP verification through actual Server Action";
      await page.getByLabel("Sign-in code", { exact: false }).fill(otp!);
      await page.waitForURL("**/dashboard", { timeout: 30_000 });
      const own = await page.request.get("/api/member/profile");
      const ownBody = await own.json() as { profile?: { userId: string } };
      check("typed OTP creates the correct authenticated application session", own.status() === 200 && ownBody.profile?.userId === registered.userId);

      stage = "real refresh token renewal in app middleware";
      const cookies = (await context.cookies()).filter(c => /-auth-token(?:\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name));
      const session = JSON.parse(Buffer.from(cookies.map(c => c.value).join("").replace(/^base64-/, ""), "base64url").toString()) as { expires_at: number; refresh_token: string };
      const originalRefresh = session.refresh_token;
      session.expires_at = Math.floor(Date.now() / 1000) - 120;
      const expired = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
      const name = cookies[0]!.name.replace(/\.\d+$/, "");
      for (const cookie of cookies) await context.clearCookies({ name: cookie.name });
      for (let offset = 0, chunk = 0; offset < expired.length; offset += 3000, chunk++) {
        await context.addCookies([{ ...cookies[0]!, name: `${name}.${chunk}`, value: expired.slice(offset, offset + 3000) }]);
      }
      const refreshed = await page.request.get("/api/member/profile");
      const after = (await context.cookies()).filter(c => /-auth-token(?:\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name));
      const renewed = JSON.parse(Buffer.from(after.map(c => c.value).join("").replace(/^base64-/, ""), "base64url").toString()) as { expires_at: number; refresh_token: string };
      check("app middleware renews the real session and rotates refresh credentials", refreshed.status() === 200 && renewed.expires_at > Date.now() / 1000 && renewed.refresh_token !== originalRefresh);

      stage = "authenticated signed-document HTTP route";
      const created = await page.request.post("/api/member/businesses", { data: { name: `Auth Remaining ${stamp}`, relationshipType: "OWNER" } });
      const business = await created.json() as { businessId?: string };
      check("authenticated API creates business for current member", created.status() === 200 && Boolean(business.businessId));
      const bytes = Buffer.from("%PDF-1.4\n% Remaining Auth HTTP synthetic document\n%%EOF\n");
      const upload = await uploadBusinessDocument({ authUserId: registered.userId, businessId: business.businessId!, documentType: "BUSINESS_REGISTRATION", fileName: "synthetic.pdf", bytes, claimedMimeType: "application/pdf" });
      check("synthetic private document is available for HTTP acceptance", upload.ok);
      if (!upload.ok) throw new Error("upload failed");
      const signed = await page.request.get(`/api/member/documents/${upload.documentId}/signed-url`, { maxRedirects: 0 });
      const location = signed.headers().location;
      check("session-bound document route issues an authorized redirect", signed.status() === 307 && Boolean(location));
      const destination = new URL(location!);
      check("signed redirect targets disposable Storage only", destination.hostname === "127.0.0.1" && destination.port === "54321");
      const download = await fetch(location!, { signal: AbortSignal.timeout(5000) });
      check("signed-document HTTP flow returns exact private bytes", download.ok && Buffer.from(await download.arrayBuffer()).equals(bytes));
      await page.request.post("/auth/sign-out", { maxRedirects: 0 });
      const denied = await page.request.get(`/api/member/documents/${upload.documentId}/signed-url`, { maxRedirects: 0 });
      check("same document endpoint denies a signed-out actor", denied.status() === 401);
      await context.close();
    } catch {
      failure = checks.find(c => !c.pass)?.name ?? stage;
      if (!checks.some(c => !c.pass)) checks.push({ name: failure, pass: false });
    } finally {
      await browser?.close(); server?.kill(); await prisma.$disconnect();
      const report = { scope: "Focused actual local browser numeric OTP, session renewal and signed-document HTTP; not Production acceptance", at: new Date().toISOString(),
        auth: "127.0.0.1:54321", database: "127.0.0.1:54322", productionChanged: false, testSessionShortcutUsed: false,
        registrationCaptcha: "existing test verifier, not real CAPTCHA", fixtures: "unique synthetic records retained; no privileged role assigned", checks,
        passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, completed: failure === null, failure };
      await mkdir(".cache/auth-a", { recursive: true }); await writeFile(".cache/auth-a/local-remaining.json", JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
    }
    if (failure) throw new Error(failure);
  }, 120_000);
});
