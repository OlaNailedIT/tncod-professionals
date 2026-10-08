/* eslint-disable no-console */
/**
 * Phase 4 controlled-gate: set ACTIVE | SUSPENDED | DEACTIVATED for ONE pinned identity.
 * Auth ban first, then DB status (same order as setAccountStatus). Never prints secrets.
 *
 * Usage:
 *   node scripts/phase4-controlled-account-status.cjs DEACTIVATED
 *   node scripts/phase4-controlled-account-status.cjs ACTIVE
 *   node scripts/phase4-controlled-account-status.cjs SUSPENDED
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const PINNED_USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";
const PINNED_EMAIL_PREFIX = "smiley7605+tncodphase4oct03@";
const LONG_BAN = "876000h";
const ALLOWED = new Set(["ACTIVE", "SUSPENDED", "DEACTIVATED"]);

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
  const candidates = [
    loadEnvFile(".env.local"),
    loadEnvFile(".env"),
    loadEnvFile("../tncod-professional/.env.local"),
    loadEnvFile("../tncod-professional/.env"),
  ];
  const merged = {};
  for (const env of candidates) Object.assign(merged, env);

  // Production gate: prefer Phase 18 import Production credentials; refuse localhost Auth.
  const dbUrl =
    merged.PHASE18_IMPORT_DATABASE_URL ||
    merged.PRODUCTION_DATABASE_URL ||
    null;
  const supabaseUrl =
    merged.PHASE18_IMPORT_SUPABASE_URL ||
    merged.PRODUCTION_SUPABASE_URL ||
    null;
  const serviceKey =
    merged.PHASE18_IMPORT_SERVICE_ROLE_KEY ||
    merged.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY ||
    null;

  if (supabaseUrl && /127\.0\.0\.1|localhost/i.test(supabaseUrl)) {
    return { dbUrl: null, supabaseUrl: null, serviceKey: null, refused: "localhost_supabase" };
  }
  if (dbUrl && /127\.0\.0\.1|localhost/i.test(dbUrl)) {
    return { dbUrl: null, supabaseUrl: null, serviceKey: null, refused: "localhost_database" };
  }

  return { dbUrl, supabaseUrl, serviceKey, refused: null };
}

async function main() {
  const nextStatus = (process.argv[2] || "").toUpperCase();
  if (!ALLOWED.has(nextStatus)) {
    console.log("USAGE: node scripts/phase4-controlled-account-status.cjs ACTIVE|SUSPENDED|DEACTIVATED");
    process.exit(1);
  }

  const { dbUrl, supabaseUrl, serviceKey, refused } = resolveEnv();
  if (refused) {
    console.log("REFUSED", refused);
    process.exit(2);
  }
  console.log("DATABASE_URL", dbUrl ? "configured" : "missing");
  console.log(
    "SUPABASE_URL",
    supabaseUrl ? `configured host=${new URL(supabaseUrl).host}` : "missing",
  );
  console.log("SERVICE_ROLE", serviceKey ? "configured" : "missing");
  if (!dbUrl || !supabaseUrl || !serviceKey) process.exit(2);

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: PINNED_USER_ID },
      select: { id: true, email: true, accountStatus: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      console.log("TARGET=MISSING_OR_DELETED — STOP");
      process.exit(3);
    }
    if (!user.email.toLowerCase().startsWith(PINNED_EMAIL_PREFIX)) {
      console.log("EMAIL_MISMATCH — STOP");
      process.exit(4);
    }
    console.log("TARGET_OK", {
      id_prefix: user.id.slice(0, 8),
      from: user.accountStatus,
      to: nextStatus,
      email_prefix: PINNED_EMAIL_PREFIX,
    });

    if (user.accountStatus === nextStatus) {
      console.log("STATUS=ALREADY", nextStatus);
      process.exit(0);
    }

    const nextBan = nextStatus === "ACTIVE" ? "none" : LONG_BAN;
    const rollbackBan = user.accountStatus === "ACTIVE" ? "none" : LONG_BAN;

    const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
      ban_duration: nextBan,
    });
    if (authError) {
      console.log("AUTH_BAN_FAILED", authError.message);
      process.exit(5);
    }
    console.log("AUTH_BAN", nextBan === "none" ? "cleared" : "set");

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { accountStatus: nextStatus },
      });
    } catch (dbErr) {
      await admin.auth.admin.updateUserById(user.id, { ban_duration: rollbackBan });
      console.log("DB_UPDATE_FAILED_AUTH_ROLLED_BACK", dbErr instanceof Error ? dbErr.message : dbErr);
      process.exit(6);
    }

    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: { accountStatus: true },
    });
    console.log("STATUS_NOW", after?.accountStatus);
    console.log("MODE_OK", nextStatus);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
