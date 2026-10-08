/* eslint-disable no-console */
/**
 * Phase 4 — cleanup + residue-zero for ONE pinned controlled identity.
 * Modes:
 *   verify-alive  — confirm ACTIVE/MEMBER before post-merge sign-in
 *   post-merge-signin — admin OTP session → GET /dashboard on azure (no inbox)
 *   cleanup       — Auth delete + domain soft-delete/tombstone; print residue-zero
 *   residue       — read-only residue check
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const PINNED_USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";
const PINNED_EMAIL = "smiley7605+tncodphase4oct03@gmail.com";
const PINNED_EMAIL_PREFIX = "smiley7605+tncodphase4oct03@";
const PROD = "https://tncod-professionals-azure.vercel.app";
const REF = "brpppukzqgpzxjelwwrj";

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

function cookieHeaderFromSession(session) {
  const payload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type || "bearer",
    user: session.user,
  };
  const name = `sb-${REF}-auth-token`;
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${name}=${encoded}`;
}

async function residue(prisma, admin) {
  const user = await prisma.user.findUnique({
    where: { id: PINNED_USER_ID },
    select: {
      id: true,
      email: true,
      deletedAt: true,
      accountStatus: true,
      profile: { select: { id: true, deletedAt: true, publicSlug: true } },
    },
  });
  const roles = user
    ? await prisma.userRole.count({ where: { userId: PINNED_USER_ID } })
    : 0;
  const auth = await admin.auth.admin.getUserById(PINNED_USER_ID);
  const authExists = Boolean(auth.data?.user) && !auth.error;
  const activeProduct =
    Boolean(user) &&
    user.deletedAt == null &&
    user.profile &&
    user.profile.deletedAt == null;
  const out = {
    domain_user_row: Boolean(user),
    user_deleted_at: user?.deletedAt ? "set" : null,
    account_status: user?.accountStatus || null,
    profile_deleted_at: user?.profile?.deletedAt ? "set" : null,
    public_slug: user?.profile?.publicSlug || null,
    role_assignments: roles,
    auth_exists: authExists,
    active_product: activeProduct,
  };
  const residueZero =
    (!user || user.deletedAt != null) &&
    (!user?.profile || user.profile.deletedAt != null) &&
    roles === 0 &&
    !authExists &&
    !activeProduct;
  console.log("RESIDUE", out);
  console.log("RESIDUE_ZERO", residueZero);
  return residueZero;
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (!["verify-alive", "post-merge-signin", "cleanup", "residue"].includes(mode)) {
    console.log(
      "USAGE: node scripts/phase4-controlled-identity-lifecycle.cjs verify-alive|post-merge-signin|cleanup|residue",
    );
    process.exit(1);
  }

  const { dbUrl, supabaseUrl, serviceKey } = resolveEnv();
  if (!dbUrl || !supabaseUrl || !serviceKey || !supabaseUrl.includes(REF)) {
    console.log("ENV_STOP");
    process.exit(2);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: PINNED_USER_ID },
      select: {
        id: true,
        email: true,
        deletedAt: true,
        accountStatus: true,
        profile: { select: { id: true, deletedAt: true } },
      },
    });

    if (mode === "residue") {
      const ok = await residue(prisma, admin);
      process.exit(ok ? 0 : 10);
    }

    if (!user || !user.email.toLowerCase().startsWith(PINNED_EMAIL_PREFIX)) {
      console.log("TARGET_MISMATCH");
      process.exit(3);
    }
    console.log("TARGET_OK", {
      id_prefix: user.id.slice(0, 8),
      status: user.accountStatus,
      deleted: Boolean(user.deletedAt),
    });

    if (mode === "verify-alive") {
      const roles = await prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: { select: { name: true } } },
      });
      const names = roles.map((r) => r.role.name).sort();
      const ok =
        user.deletedAt == null &&
        user.accountStatus === "ACTIVE" &&
        user.profile &&
        user.profile.deletedAt == null &&
        names.includes("MEMBER") &&
        !names.includes("EXCO_VIEWER");
      console.log("ROLES", names.join(","));
      console.log("ALIVE_FOR_POST_MERGE", ok);
      process.exit(ok ? 0 : 10);
    }

    if (mode === "post-merge-signin") {
      if (user.deletedAt || user.accountStatus !== "ACTIVE") {
        console.log("NOT_ACTIVE — STOP");
        process.exit(4);
      }
      // Anon key is no longer required in the client bundle after same-origin OTP.
      // Verify via service-role client (trusted admin path) then hit Production /dashboard.
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: PINNED_EMAIL,
      });
      if (linkErr || !linkData?.properties?.email_otp) {
        console.log("GENERATE_LINK_FAILED", linkErr?.message || "no otp");
        process.exit(6);
      }
      const { data: verified, error: verErr } = await admin.auth.verifyOtp({
        email: PINNED_EMAIL,
        token: linkData.properties.email_otp,
        type: "email",
      });
      if (verErr || !verified.session) {
        console.log("VERIFY_FAILED", verErr?.message || "no session");
        process.exit(7);
      }
      const cookie = cookieHeaderFromSession(verified.session);
      const res = await fetch(`${PROD}/dashboard`, {
        method: "GET",
        redirect: "manual",
        headers: { cookie, accept: "text/html" },
      });
      const loc = res.headers.get("location") || "";
      console.log("DASHBOARD", { status: res.status, location: loc });
      const ok =
        res.status === 200 ||
        (res.status >= 300 && res.status < 400 && !loc.includes("/sign-in"));
      console.log("POST_MERGE_SIGNIN", ok ? "PASS" : "FAIL");
      process.exit(ok ? 0 : 10);
    }

    if (mode === "cleanup") {
      // Soft-delete profile + user; clear roles; delete Auth user.
      await prisma.userRole.deleteMany({ where: { userId: PINNED_USER_ID } });
      const now = new Date();
      await prisma.profile.updateMany({
        where: { userId: PINNED_USER_ID, deletedAt: null },
        data: { deletedAt: now, publicSlug: null },
      });
      await prisma.user.update({
        where: { id: PINNED_USER_ID },
        data: { deletedAt: now, accountStatus: "DEACTIVATED" },
      });
      const { error: banErr } = await admin.auth.admin.updateUserById(PINNED_USER_ID, {
        ban_duration: "876000h",
      });
      if (banErr) console.log("AUTH_BAN_WARN", banErr.message);
      const { error: delErr } = await admin.auth.admin.deleteUser(PINNED_USER_ID);
      if (delErr) {
        console.log("AUTH_DELETE_FAILED", delErr.message);
        process.exit(8);
      }
      console.log("CLEANUP_WRITES_DONE");
      const ok = await residue(prisma, admin);
      process.exit(ok ? 0 : 10);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
