/**
 * Disposable full-Auth synthetic registrations.
 * Requires local DATABASE_URL + Supabase Auth (service role) with migrations/seed.
 * Uses distinct synthetic emails/phones — no personal credentials.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerProfessional } from "@/features/registration/register";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const prisma = new PrismaClient();
const createdUserIds: string[] = [];
let envReady = false;

function unquote(value: string): string {
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1);
  }
  return current;
}

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = unquote(trimmed.slice(eq + 1));
    if (!process.env[key]) process.env[key] = value;
  }
}

function ensureDisposableAuthEnv() {
  // Prefer committed-local env files. Do not shell out to `supabase status`
  // here — it can hang under Windows and blow the Vitest hook timeout.
  loadEnvFile(resolve(process.cwd(), ".env"));
  loadEnvFile(resolve("C:/Users/O/Devs/tncod-professional/.env"));
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  }
  process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = unquote(process.env.NEXT_PUBLIC_SUPABASE_URL);
  }
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = unquote(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = unquote(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
}

function syntheticPayload(i: number) {
  const stamp = Date.now().toString(36);
  return {
    fullName: `Synthetic Reg ${i}`,
    phone: `0803${String(1000000 + i).slice(-7)}`,
    email: `synthetic.reg.${stamp}.${i}@example.invalid`,
    professionalSituation: "Employee",
    profession: "Engineer",
    organisation: "Lab",
    lookingFor: "Connections",
    offering: "Mentorship",
    website: "",
    captchaToken: "test-turnstile-token",
  };
}

async function assertFullIdentity(userId: string) {
  const auth = await createServiceRoleClient().auth.admin.getUserById(userId);
  expect(auth.data.user?.id).toBe(userId);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      profile: { include: { professionalDetails: true } },
      userRoles: { include: { role: true } },
    },
  });

  expect(user.deletedAt).toBeNull();
  expect(user.accountStatus).toBe("ACTIVE");
  expect(user.profile).toBeTruthy();
  expect(user.profile!.deletedAt).toBeNull();
  expect(user.profile!.visibilityStatus).toBe("PRIVATE");
  expect(user.profile!.verificationStatus).toBe("NOT_REVIEWED");
  expect(user.profile!.professionalDetails).toBeTruthy();
  expect(user.userRoles.some((r) => r.role.name === "MEMBER")).toBe(true);
}

describe("synthetic registration disposable full Auth", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    ensureDisposableAuthEnv();
    try {
      await prisma.$queryRaw`SELECT 1`;
      createServiceRoleClient();
      envReady = true;
    } catch {
      envReady = false;
    }
  }, 30_000);

  afterAll(async () => {
    if (envReady && createdUserIds.length) {
      const admin = createServiceRoleClient();
      for (const id of createdUserIds) {
        try {
          await prisma.professionalDetails.deleteMany({
            where: { profile: { userId: id } },
          });
          await prisma.profile.deleteMany({ where: { userId: id } });
          await prisma.userRole.deleteMany({ where: { userId: id } });
          await prisma.user.deleteMany({ where: { id } });
          await admin.auth.admin.deleteUser(id);
        } catch {
          /* best-effort cleanup of synthetics only */
        }
      }
    }
    await prisma.$disconnect();
  });

  it("requires disposable Auth + database", () => {
    expect(envReady).toBe(true);
  });

  it("registers several distinct unused email/phone pairs with full identity graph", async () => {
    expect(envReady).toBe(true);
    const count = 3;
    for (let i = 0; i < count; i += 1) {
      const payload = syntheticPayload(i);
      const result = await registerProfessional(payload, {
        clientKey: `synthetic-reg-${i}-${Date.now()}`,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.userId).not.toBe("accepted");
      expect(result.userId).not.toBe("spam");
      createdUserIds.push(result.userId);
      await assertFullIdentity(result.userId);
    }
    expect(createdUserIds).toHaveLength(count);
  }, 120_000);

  it("soft-deleted email collision stays neutral and creates no Auth user", async () => {
    expect(envReady).toBe(true);
    const payload = syntheticPayload(90);
    // Seed an Auth-absent soft-deleted occupant of the email/phone.
    const { randomUUID } = await import("crypto");
    const tombstoneId = randomUUID();
    const { normalizePhone } = await import("@/features/registration/phone");
    const phone = normalizePhone(payload.phone)!;
    await prisma.user.create({
      data: {
        id: tombstoneId,
        email: payload.email,
        phone,
        accountStatus: "DEACTIVATED",
        deletedAt: new Date(),
        profile: {
          create: {
            displayName: "Collision",
            deletedAt: new Date(),
            verificationStatus: "NOT_REVIEWED",
            visibilityStatus: "PRIVATE",
            profileStatus: "REGISTERED",
          },
        },
      },
    });

    const result = await registerProfessional(payload, {
      clientKey: `synthetic-collision-${Date.now()}`,
    });
    expect(result).toEqual({ ok: true, userId: "accepted", profileId: "accepted" });

    const authHits = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM auth.users WHERE lower(email) = lower(${payload.email}) LIMIT 5
    `;
    expect(authHits).toHaveLength(0);

    await prisma.profile.deleteMany({ where: { userId: tombstoneId } });
    await prisma.user.delete({ where: { id: tombstoneId } });
  }, 60_000);
});
