/* eslint-disable no-console */
/**
 * Targeted #3: stale-session denial.
 * 1) Issue session for pinned ACTIVE identity via Admin generateLink + verifyOtp
 * 2) Prove /dashboard reachable with session cookies
 * 3) DEACTIVATE + ban
 * 4) Same cookies → /dashboard must redirect to sign-in (no 500)
 * 5) Restore ACTIVE
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const PINNED_USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";
const PINNED_EMAIL = "smiley7605+tncodphase4oct03@gmail.com";
const PINNED_EMAIL_PREFIX = "smiley7605+tncodphase4oct03@";
const PROD = "https://tncod-professionals-azure.vercel.app";
const LONG_BAN = "876000h";

function loadEnvFile(file) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    while (
      (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
      (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function resolveEnv() {
  const merged = Object.assign(
    {},
    loadEnvFile("../tncod-professional/.env"),
    loadEnvFile("../tncod-professional/.env.local"),
    loadEnvFile(".env"),
    loadEnvFile(".env.local"),
  );
  return {
    dbUrl: merged.PHASE18_IMPORT_DATABASE_URL || null,
    supabaseUrl: merged.PHASE18_IMPORT_SUPABASE_URL || null,
    serviceKey: merged.PHASE18_IMPORT_SERVICE_ROLE_KEY || null,
  };
}

async function extractAnon() {
  const html = await (await fetch(`${PROD}/sign-in`)).text();
  const scripts = [...html.matchAll(/\/_next\/static\/[^"]+\.js/g)].map((m) => m[0]);
  for (const s of scripts) {
    const js = await (await fetch(`${PROD}${s}`)).text();
    if (!js.includes("brpppukzqgpzxjelwwrj")) continue;
    const m = js.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    if (!m) continue;
    const payload = JSON.parse(
      Buffer.from(m[0].split(".")[1], "base64url").toString("utf8"),
    );
    if (payload.ref === "brpppukzqgpzxjelwwrj") return m[0];
  }
  return null;
}

function cookieHeaderFromSession(projectRef, session) {
  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type || "bearer",
    user: session.user,
  };
  const name = `sb-${projectRef}-auth-token`;
  const value = encodeURIComponent(JSON.stringify(payload));
  return `${name}=${value}`;
}

async function fetchDashboard(cookie) {
  const res = await fetch(`${PROD}/dashboard`, {
    method: "GET",
    redirect: "manual",
    headers: { cookie, accept: "text/html" },
  });
  const loc = res.headers.get("location") || "";
  return { status: res.status, location: loc };
}

async function setStatus(prisma, admin, nextStatus) {
  const nextBan = nextStatus === "ACTIVE" ? "none" : LONG_BAN;
  const { error } = await admin.auth.admin.updateUserById(PINNED_USER_ID, {
    ban_duration: nextBan,
  });
  if (error) throw new Error(`auth_ban: ${error.message}`);
  await prisma.user.update({
    where: { id: PINNED_USER_ID },
    data: { accountStatus: nextStatus },
  });
}

(async () => {
  const { dbUrl, supabaseUrl, serviceKey } = resolveEnv();
  if (!dbUrl || !supabaseUrl || !serviceKey) {
    console.log("ENV missing Production import credentials");
    process.exit(2);
  }
  const anon = await extractAnon();
  if (!anon) {
    console.log("ANON extract failed");
    process.exit(2);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const browser = createClient(supabaseUrl, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: PINNED_USER_ID },
      select: { email: true, accountStatus: true, deletedAt: true },
    });
    if (!user || user.deletedAt || !user.email.toLowerCase().startsWith(PINNED_EMAIL_PREFIX)) {
      console.log("TARGET mismatch — STOP");
      process.exit(3);
    }
    if (user.accountStatus !== "ACTIVE") {
      await setStatus(prisma, admin, "ACTIVE");
    }
    console.log("TARGET_OK ACTIVE");

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: PINNED_EMAIL,
    });
    if (linkErr || !linkData?.properties?.email_otp) {
      console.log("GENERATE_LINK_FAILED", linkErr?.message || "no otp");
      process.exit(4);
    }
    const token = linkData.properties.email_otp;
    const { data: verified, error: verErr } = await browser.auth.verifyOtp({
      email: PINNED_EMAIL,
      token,
      type: "email",
    });
    if (verErr || !verified.session) {
      console.log("VERIFY_FAILED", verErr?.message || "no session");
      process.exit(5);
    }
    console.log("SESSION_ISSUED_BEFORE_DEACTIVATION true");

    const cookie = cookieHeaderFromSession("brpppukzqgpzxjelwwrj", verified.session);
    const before = await fetchDashboard(cookie);
    console.log("DASHBOARD_BEFORE", before);
    const beforeOk =
      before.status === 200 ||
      (before.status >= 300 && before.status < 400 && !before.location.includes("/sign-in"));
    if (!beforeOk) {
      console.log("STALE_GATE FAIL — could not establish pre-deactivation dashboard access");
      process.exit(6);
    }

    await setStatus(prisma, admin, "DEACTIVATED");
    console.log("DEACTIVATED true");

    const after = await fetchDashboard(cookie);
    console.log("DASHBOARD_AFTER", after);
    const denied =
      (after.status >= 300 && after.status < 400 && after.location.includes("/sign-in")) ||
      after.status === 401 ||
      after.status === 403;
    const noServerError = after.status !== 500 && after.status !== 502 && after.status !== 503;
    console.log("DENIED_FAIL_CLOSED", denied);
    console.log("NO_5XX", noServerError);
    console.log("STALE_SESSION_GATE", denied && noServerError ? "PASS" : "FAIL");

    await setStatus(prisma, admin, "ACTIVE");
    console.log("RESTORED ACTIVE");
    process.exit(denied && noServerError ? 0 : 10);
  } finally {
    await prisma.$disconnect();
  }
})().catch(async (e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
