/**
 * Forensic Phase 6 clarification — Auth lifecycle, duplicates, phone index, rate limit.
 * Appended after Killcritic conditional review. No product redesign.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { normalizePhone } from "../src/features/registration/phone";

function unwrap(value: string): string {
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1).trim();
  }
  return current;
}

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      process.env[trimmed.slice(0, eq).trim()] = unwrap(trimmed.slice(eq + 1));
    }
  } catch {
    /* ignore */
  }
}

loadEnvFile();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return unwrap(v);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const service = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const prisma = new PrismaClient();
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stamp = Date.now();
  const email = `phase6.forensic.${stamp}@tncod.test`;
  const phoneA = "0821234567";
  const phoneB = "+27 82 123 4567";
  const phoneNorm = normalizePhone(phoneA);
  const phoneNormB = normalizePhone(phoneB);

  const phoneCanonEqual = phoneNorm === phoneNormB && phoneNorm === "27821234567";

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {},
  });
  if (error || !created.user) throw new Error(error?.message || "create failed");
  const userId = created.user.id;

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, phone: phoneNorm! },
    update: { email, phone: phoneNorm! },
  });

  // Duplicate phone via alternate formatting must hit unique index / app check
  let phoneDupSafe = false;
  let phoneDupRaw: string | null = null;
  try {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: `other.${stamp}@tncod.test`,
        phone: phoneNormB!,
      },
    });
  } catch (e) {
    phoneDupSafe = true;
    phoneDupRaw = e instanceof Error ? e.message : String(e);
  }

  // Email unique at DB
  let emailDupSafe = false;
  try {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        phone: null,
      },
    });
  } catch {
    emailDupSafe = true;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        forensic: {
          phoneCanonEqual,
          phoneNorm,
          phoneNormB,
          phoneDupSafe,
          phoneDupLooksLikeUnique:
            Boolean(phoneDupRaw && /unique|duplicate/i.test(phoneDupRaw)),
          emailDupSafe,
          sessionEstablishedByThisScript: false,
          note: "Registration path uses Admin createUser + optional OTP send; browser session is not set by /join.",
        },
      },
      null,
      2,
    ),
  );

  await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  await admin.auth.admin.deleteUser(userId).catch(() => undefined);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e) }));
  process.exit(1);
});
