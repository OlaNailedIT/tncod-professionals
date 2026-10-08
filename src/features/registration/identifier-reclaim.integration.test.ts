/**
 * Disposable-DB reclaim boundary. Requires local DATABASE_URL with migrations applied.
 */
import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  reclaimSoftDeletedIdentifiers,
  reclaimTombstoneEmail,
} from "@/features/registration/identifier-reclaim";

const prisma = new PrismaClient();
let dbReady = false;

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    auth: {
      admin: {
        getUserById: async () => ({
          data: { user: null },
          error: { message: "User not found" },
        }),
      },
    },
  }),
}));

describe("identifier reclaim disposable boundary", () => {
  beforeAll(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbReady = true;
    } catch {
      dbReady = false;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("requires disposable database", () => {
    expect(dbReady).toBe(true);
  });

  it("releases email/phone then allows a new unique insert; dry-run and apply are idempotent", async () => {
    expect(dbReady).toBe(true);
    const id = randomUUID();
    const email = `reclaim-test-${id.slice(0, 8)}@example.com`;
    const phone = `23480${String(Date.now()).slice(-8)}`;

    await prisma.user.create({
      data: {
        id,
        email,
        phone,
        accountStatus: "DEACTIVATED",
        deletedAt: new Date(),
        profile: {
          create: {
            displayName: "Reclaim Test",
            deletedAt: new Date(),
            verificationStatus: "NOT_REVIEWED",
            visibilityStatus: "PRIVATE",
            profileStatus: "REGISTERED",
          },
        },
      },
    });

    const dry1 = await reclaimSoftDeletedIdentifiers({ userId: id });
    expect(dry1.ok).toBe(true);
    expect(dry1.changed).toBe(false);

    const dry2 = await reclaimSoftDeletedIdentifiers({ userId: id });
    expect(dry2.ok).toBe(true);

    const applied = await reclaimSoftDeletedIdentifiers({ userId: id, apply: true });
    expect(applied.ok).toBe(true);
    expect(applied.changed).toBe(true);

    const again = await reclaimSoftDeletedIdentifiers({ userId: id, apply: true });
    expect(again.ok).toBe(true);
    expect(again.changed).toBe(false);
    expect(again.preflight.already_reclaimed).toBe(true);

    const row = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(row.email).toBe(reclaimTombstoneEmail(id));
    expect(row.phone).toBeNull();
    expect(row.deletedAt).not.toBeNull();

    // Freed identifiers can be used by a new domain row (simulates post-/join unique insert).
    const freshId = randomUUID();
    await prisma.user.create({
      data: {
        id: freshId,
        email,
        phone,
        accountStatus: "ACTIVE",
      },
    });

    await prisma.user.delete({ where: { id: freshId } });
    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  });
});
