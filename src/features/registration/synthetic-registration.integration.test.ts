/**
 * Disposable full-Auth synthetic registrations.
 *
 * Opt-in only: PHASE4_DISPOSABLE_AUTH_TESTS=1
 * Requires caller-supplied local DATABASE_URL + NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY. No hard-coded personal paths. No implicit URL fallback.
 * Hosted/Production endpoints are rejected before any client is created.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerProfessional } from "@/features/registration/register";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  assertDisposableAuthEnv,
  DISPOSABLE_AUTH_OPT_IN,
} from "@/features/registration/disposable-env-gate";

let prisma: PrismaClient | null = null;
const createdUserIds: string[] = [];
const cleanupFailures: string[] = [];
let gateReason = "not evaluated";
let envReady = false;
let optedIn = false;

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

  const user = await prisma!.user.findUniqueOrThrow({
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
    optedIn = process.env[DISPOSABLE_AUTH_OPT_IN] === "1";

    // Fail closed before any Prisma/Auth client is constructed.
    const gate = assertDisposableAuthEnv(process.env);
    if (!gate.ok) {
      gateReason = gate.reason;
      envReady = false;
      return;
    }
    gateReason = "ok";
    process.env.DIRECT_URL = process.env.DIRECT_URL || gate.databaseUrl;

    try {
      prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      // Prove Auth Admin reaches the same disposable URL (getUserById on random id → not found).
      const probe = await createServiceRoleClient().auth.admin.getUserById(
        "00000000-0000-4000-8000-000000000000",
      );
      if (probe.error && !/not found/i.test(probe.error.message || "")) {
        throw probe.error;
      }
      envReady = true;
    } catch (e) {
      envReady = false;
      gateReason = e instanceof Error ? e.message : "disposable connectivity failed";
      if (prisma) {
        await prisma.$disconnect().catch(() => undefined);
        prisma = null;
      }
    }
  }, 30_000);

  afterAll(async () => {
    if (envReady && prisma && createdUserIds.length) {
      const admin = createServiceRoleClient();
      for (const id of createdUserIds) {
        try {
          await prisma.professionalDetails.deleteMany({
            where: { profile: { userId: id } },
          });
          await prisma.profile.deleteMany({ where: { userId: id } });
          await prisma.userRole.deleteMany({ where: { userId: id } });
          await prisma.user.deleteMany({ where: { id } });
          const del = await admin.auth.admin.deleteUser(id);
          if (del.error) {
            cleanupFailures.push(`${id}: auth delete ${del.error.message}`);
          }
        } catch (e) {
          cleanupFailures.push(
            `${id}: ${e instanceof Error ? e.message : "cleanup failed"}`,
          );
        }
      }
    }
    if (prisma) await prisma.$disconnect();
    if (cleanupFailures.length > 0) {
      throw new Error(
        `Synthetic cleanup left residues (${cleanupFailures.length}): ${cleanupFailures.join("; ")}`,
      );
    }
  }, 60_000);

  it("fails closed without opt-in / unverified disposable endpoints", () => {
    if (!optedIn) {
      expect(envReady).toBe(false);
      expect(gateReason).toMatch(DISPOSABLE_AUTH_OPT_IN);
      return;
    }
    expect(envReady, gateReason).toBe(true);
    expect(prisma).not.toBeNull();
  });

  it.skipIf(process.env[DISPOSABLE_AUTH_OPT_IN] !== "1")(
    "registers several distinct unused email/phone pairs with full identity graph",
    async () => {
      expect(envReady, gateReason).toBe(true);
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
    },
    120_000,
  );

  it.skipIf(process.env[DISPOSABLE_AUTH_OPT_IN] !== "1")(
    "soft-deleted email collision stays neutral and creates no Auth user",
    async () => {
      expect(envReady, gateReason).toBe(true);
      const payload = syntheticPayload(90);
      const { randomUUID } = await import("crypto");
      const tombstoneId = randomUUID();
      const { normalizePhone } = await import("@/features/registration/phone");
      const phone = normalizePhone(payload.phone)!;
      await prisma!.user.create({
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

      const authHits = await prisma!.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM auth.users WHERE lower(email) = lower(${payload.email}) LIMIT 5
      `;
      expect(authHits).toHaveLength(0);

      await prisma!.profile.deleteMany({ where: { userId: tombstoneId } });
      await prisma!.user.delete({ where: { id: tombstoneId } });
    },
    60_000,
  );
});
