/* eslint-disable no-console */
/**
 * Phase 4 controlled-gate: grant or revoke EXCO_VIEWER for ONE pinned identity.
 * Refuses any other id/email. Never prints secrets or full phone.
 *
 * Usage:
 *   node scripts/phase4-controlled-exco-role.cjs grant
 *   node scripts/phase4-controlled-exco-role.cjs revoke
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const PINNED_USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";
const PINNED_EMAIL_PREFIX = "smiley7605+tncodphase4oct03@";

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

function resolveDbUrl() {
  const candidates = [
    loadEnvFile(".env.local"),
    loadEnvFile(".env"),
    loadEnvFile("../tncod-professional/.env.local"),
    loadEnvFile("../tncod-professional/.env"),
  ];
  for (const env of candidates) {
    const url =
      env.PHASE18_IMPORT_DATABASE_URL ||
      env.DATABASE_URL ||
      env.PRODUCTION_DATABASE_URL;
    if (url) return { url, keys: Object.keys(env).filter((k) => /DATABASE|SUPABASE|PHASE18/.test(k)) };
  }
  return { url: null, keys: [] };
}

async function main() {
  const mode = (process.argv[2] || "").toLowerCase();
  if (mode !== "grant" && mode !== "revoke") {
    console.log("USAGE: node scripts/phase4-controlled-exco-role.cjs grant|revoke");
    process.exit(1);
  }

  const { url } = resolveDbUrl();
  console.log("DATABASE_URL", url ? "configured" : "missing");
  if (!url) process.exit(2);

  const prisma = new PrismaClient({ datasources: { db: { url } } });
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
    if (user.id !== PINNED_USER_ID) {
      console.log("ID_MISMATCH — STOP");
      process.exit(5);
    }
    console.log("TARGET_OK", {
      id_prefix: user.id.slice(0, 8),
      status: user.accountStatus,
      email_prefix: PINNED_EMAIL_PREFIX,
    });

    const role = await prisma.role.findUnique({ where: { name: "EXCO_VIEWER" } });
    if (!role) {
      console.log("EXCO_VIEWER_ROLE=MISSING — STOP");
      process.exit(6);
    }

    const existing = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
    });

    if (mode === "grant") {
      if (existing) console.log("ASSIGNMENT=ALREADY_PRESENT");
      else {
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
        console.log("ASSIGNMENT=CREATED");
      }
    } else {
      if (!existing) console.log("ASSIGNMENT=ALREADY_ABSENT");
      else {
        await prisma.userRole.delete({
          where: { userId_roleId: { userId: user.id, roleId: role.id } },
        });
        console.log("ASSIGNMENT=REMOVED");
      }
    }

    const roles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { select: { name: true } } },
    });
    const names = roles.map((r) => r.role.name).sort();
    console.log("ROLES", names.join(","));
    console.log("HAS_EXCO_VIEWER", names.includes("EXCO_VIEWER"));
    console.log("MODE_OK", mode);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
