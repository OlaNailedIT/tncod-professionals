import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { registerProfessional } from "@/features/registration/register";
import { assertDisposableAuthEnv } from "@/features/registration/disposable-env-gate";

// Run only through the guarded existing local runner. No hosted credentials,
// session shortcuts, pre-existing member mutations, or deletion of fixtures.
describe.skipIf(process.env.PHASE4_DISPOSABLE_AUTH_TESTS !== "1")("profile review actual local browser journey", () => {
  it("saves and submits through the real UI, including without hydration", async () => {
    expect(assertDisposableAuthEnv({ ...process.env, NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL }).ok).toBe(true);
    for (const [raw, port] of [[process.env.DATABASE_URL, "54322"], [process.env.SUPABASE_URL, "54321"], [process.env.MAILPIT_URL, "54324"]]) {
      const url = new URL(raw!);
      expect(url.hostname).toBe("127.0.0.1"); expect(url.port).toBe(port);
    }
    expect(process.env.SUPABASE_AUTH_SERVER_ONLY).toBe("1");
    expect(process.env.AUTH_E2E_HELPER).toBe("0");
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
    const prisma = new PrismaClient();
    const checks: Array<{ name: string; pass: boolean }> = [];
    const check = (name: string, pass: boolean) => { checks.push({ name, pass }); expect(pass, name).toBe(true); };
    let stage = "local prerequisites", failure: string | null = null;
    let server: ReturnType<typeof spawn> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      const schema = await prisma.$queryRaw<Array<{ present: string | null }>>`SELECT to_regclass('app.registration_provisioning')::text AS present`;
      check("required local registration schema exists", Boolean(schema[0]?.present));
      // A fresh CI database has schema but no optional development seed.
      // Create only this reference role if absent; existing roles are unchanged.
      await prisma.role.upsert({ where: { name: "MEMBER" }, create: { name: "MEMBER" }, update: {} });
      server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3000"], {
        env: { ...process.env, NODE_ENV: "production", AUTH_E2E_HELPER: "0" }, stdio: "ignore",
      });
      let ready = false;
      for (let attempt = 0; attempt < 40; attempt++) {
        try { ready = (await fetch("http://127.0.0.1:3000/sign-in", { signal: AbortSignal.timeout(2000) })).status === 200; } catch { /* bounded startup */ }
        if (ready) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      check("optimized local application starts", ready);
      browser = await chromium.launch(process.env.CI ? {} : { channel: "chrome" });

      async function signIn(page: Page, email: string) {
        await page.goto("/sign-in?next=%2Fprofile");
        const send = page.getByRole("button", { name: "Send sign-in code", exact: true });
        await expect.poll(() => send.isEnabled()).toBe(true);
        await page.getByLabel("Email address", { exact: false }).fill(email);
        await send.click();
        await page.getByLabel("Sign-in code", { exact: false }).waitFor();
        let otp: string | undefined;
        for (let attempt = 0; attempt < 30; attempt++) {
          const list = await fetch(`${process.env.MAILPIT_URL}/api/v1/messages?limit=50`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
          const item = list.messages?.find(m => m.To?.some(to => to.Address === email));
          if (item) {
            const message = await fetch(`${process.env.MAILPIT_URL}/api/v1/message/${item.ID}`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()) as { Text?: string; HTML?: string };
            otp = `${message.Text ?? ""}\n${message.HTML ?? ""}`.match(/\b(\d{6,8})\b/)?.[1];
            if (otp) break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!otp) throw new Error("local email code missing");
        await page.getByLabel("Sign-in code", { exact: false }).fill(otp);
        await page.waitForURL("**/profile", { timeout: 30_000 });
      }

      for (const scenario of ["desktop", "phone", "no-javascript", "blocked-profile-script", "network-error", "stale-completion"] as const) {
        stage = `${scenario}: synthetic registration and real email-code sign-in`;
        const tag = randomUUID().replaceAll("-", "");
        const email = `profile.review.${tag}@example.invalid`;
        const registered = await registerProfessional({ fullName: "Profile Review Synthetic", email,
          phone: `+23485${String(Date.now()).slice(-8)}`, professionalSituation: "Employee", profession: "Engineer",
          lookingFor: "Peers", offering: "Help", website: "", captchaToken: "test-turnstile-token" }, { clientKey: `profile-review-${tag}` });
        check(`${scenario}: synthetic registration creates own private record`, registered.ok && registered.userId !== "accepted" && registered.userId !== "spam");
        if (!registered.ok) throw new Error("local registration failed");
        const id = registered.userId;
        let blockedProfileScripts = 0;
        let context: BrowserContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000", viewport: scenario === "phone" ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
        let page = await context.newPage();
        await signIn(page, email);
        check(`${scenario}: real code establishes own session`, (await page.request.get("/api/member/profile")).status() === 200);
        const shortcut = await page.request.post("/api/test/auth-session", { data: { email } });
        check(`${scenario}: session shortcut remains disabled`, shortcut.status() === 404);
        check(`${scenario}: incomplete profile has no submit control`, await page.getByRole("button", { name: "Submit for verification", exact: true }).count() === 0);
        stage = `${scenario}: complete and save profile through actual form`;
        await page.goto("/profile/edit");
        await page.getByLabel("Location", { exact: false }).fill("Synthetic City");
        await page.getByLabel("Bio", { exact: false }).fill("Synthetic browser test profile for review submission.");
        const industry = await prisma.industry.findFirst({ where: { isActive: true }, select: { id: true } });
        if (!industry) throw new Error("no existing local industry fixture");
        await page.getByLabel("Industry", { exact: false }).selectOption(industry.id);
        await page.getByLabel("Years of experience", { exact: false }).fill("5");
        await page.getByLabel("Skills", { exact: false }).fill(`Synthetic skill ${tag}`);
        await page.getByLabel("Services", { exact: false }).fill(`Synthetic service ${tag}`);
        await page.getByLabel("LinkedIn", { exact: false }).fill("https://www.linkedin.com/in/synthetic-profile-review");
        await page.getByLabel("Areas of service", { exact: false }).fill("Synthetic service team");
        for (const label of ["Collaboration", "Mentorship", "Referrals", "Training"]) await page.getByLabel(label, { exact: false }).selectOption("no");
        await page.getByRole("button", { name: "Save changes", exact: true }).click();
        await page.waitForURL("**/profile", { timeout: 30_000 });
        await page.getByRole("heading", { name: "Profile 100% complete", exact: true }).waitFor();
        const before = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
        check(`${scenario}: save is complete and still unverified/private`, before.profileStatus === "COMPLETE" && before.verificationStatus === "NOT_REVIEWED" && before.visibilityStatus === "PRIVATE");
        if (scenario === "no-javascript" || scenario === "blocked-profile-script") {
          const state = await context.storageState(); // Session stays in memory; never serialized to evidence.
          await context.close();
          context = await browser.newContext({ baseURL: "http://127.0.0.1:3000", javaScriptEnabled: scenario !== "no-javascript", storageState: state });
          page = await context.newPage();
          if (scenario === "blocked-profile-script") {
            await page.route("**/_next/static/chunks/app/profile/page-*.js", route => { blockedProfileScripts++; return route.abort("failed"); });
          }
          await page.goto("/profile");
          if (scenario === "blocked-profile-script") check("blocked-profile-script: actual profile bundle request was blocked", blockedProfileScripts > 0);
        }
        stage = `${scenario}: activate submit and verify persisted review queue`;
        const submit = page.getByRole("button", { name: "Submit for verification", exact: true });
        await mkdir(".cache/profile-review", { recursive: true });
        if (scenario === "no-javascript") await page.screenshot({ path: `.cache/profile-review/no-javascript-${tag}.png` });
        check(`${scenario}: submission is enabled and reachable`, await submit.isEnabled());
        if (scenario === "network-error") {
          await page.route("http://127.0.0.1:3000/profile", route => route.request().method() === "POST" ? route.abort("failed") : route.continue());
          await submit.click();
          await page.getByRole("alert").getByText("Submission could not be confirmed", { exact: true }).waitFor();
          const unaffected = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
          check("network-error: failed transport shows recovery and leaves record unchanged", unaffected.verificationStatus === "NOT_REVIEWED" && unaffected.visibilityStatus === "PRIVATE");
          await page.unroute("http://127.0.0.1:3000/profile");
          await page.getByRole("link", { name: "Refresh profile", exact: true }).click();
          await page.getByRole("heading", { name: "Profile 100% complete", exact: true }).waitFor();
        }
        if (scenario === "stale-completion") {
          await prisma.profile.update({ where: { userId: id }, data: { bio: null } });
          await submit.click();
          await page.getByRole("alert").getByText(/100% complete before submission/).waitFor();
          const refused = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
          check("stale-completion: server rechecks completion and rejects without publication", refused.verificationStatus === "NOT_REVIEWED" && refused.visibilityStatus === "PRIVATE");
          check("stale-completion: rejected submission writes no success audit", await prisma.auditLog.count({ where: { actorId: id, action: "professional.verification.submit" } }) === 0);
          await context.close();
          continue;
        }
        if (scenario === "desktop") {
          await page.route("http://127.0.0.1:3000/profile", async route => {
            if (route.request().method() === "POST") await new Promise(resolve => setTimeout(resolve, 2000));
            await route.continue();
          });
        }
        await submit.click();
        if (scenario === "desktop") {
          const pending = page.getByRole("button", { name: "Submitting…", exact: true });
          await expect.poll(() => pending.getAttribute("aria-busy")).toBe("true");
          check("desktop: visible progress prevents duplicate activation", !(await pending.isEnabled()));
        }
        await expect.poll(async () => {
          const row = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
          return `${row.profileStatus}:${row.verificationStatus}:${row.visibilityStatus}`;
        }, { timeout: 30_000 }).toBe("SUBMITTED:PENDING:PRIVATE");
        await page.reload();
        check(`${scenario}: persisted queue confirmation replaces the submit control`, await page.getByText(/already in the verification queue/).isVisible() && await page.getByRole("button", { name: "Submit for verification", exact: true }).count() === 0);
        const audits = await prisma.auditLog.count({ where: { actorId: id, action: "professional.verification.submit" } });
        check(`${scenario}: one audited submission and no automatic publication`, audits === 1);
        if (scenario === "no-javascript") await page.screenshot({ path: `.cache/profile-review/no-javascript-queued-${tag}.png` });
        await context.close();
      }
    } catch {
      failure = checks.find(c => !c.pass)?.name ?? stage;
      if (!checks.some(c => !c.pass)) checks.push({ name: failure, pass: false });
      throw new Error(failure);
    } finally {
      await browser?.close(); server?.kill(); await prisma.$disconnect();
      const report = { at: new Date().toISOString(), source: "actual optimized local app / Playwright Chrome", database: "127.0.0.1:54322", auth: "127.0.0.1:54321",
        productionChanged: false, sessionShortcutUsed: false, fixtures: "new synthetic local records retained; no pre-existing records changed", checks,
        passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, completed: failure === null, failure };
      await mkdir(".cache/profile-review", { recursive: true });
      const evidenceName = `local-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.json`;
      await writeFile(`.cache/profile-review/${evidenceName}`, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report));
    }
  }, 300_000);
});
