/**
 * Disposable-DB reclaim boundary. Requires local DATABASE_URL with migrations applied.
 */
import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  reclaimSoftDeletedIdentifiers,
  reclaimTombstoneEmail,
  restoreFromReclaimSnapshot,
  writeReclaimSnapshot,
} from "@/features/registration/identifier-reclaim";

const prisma = new PrismaClient();
let dbReady = false;

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
    expect(dry1.would_change?.email_to).toBe(reclaimTombstoneEmail(id));

    const dry2 = await reclaimSoftDeletedIdentifiers({ userId: id });
    expect(dry2.ok).toBe(true);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reclaim-int-"));
    const { path: snapPath } = await writeReclaimSnapshot({ userId: id, dir });

    const applied = await reclaimSoftDeletedIdentifiers({
      userId: id,
      apply: true,
      snapshotFile: snapPath,
    });
    expect(applied.ok).toBe(true);
    expect(applied.changed).toBe(true);

    const again = await reclaimSoftDeletedIdentifiers({
      userId: id,
      apply: true,
      snapshotFile: snapPath,
    });
    expect(again.ok).toBe(true);
    expect(again.changed).toBe(false);
    expect(again.preflight.already_reclaimed).toBe(true);

    const row = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(row.email).toBe(reclaimTombstoneEmail(id));
    expect(row.phone).toBeNull();
    expect(row.deletedAt).not.toBeNull();

    // Point of no return: once claimed, restore is refused.
    const freshId = randomUUID();
    await prisma.user.create({
      data: {
        id: freshId,
        email,
        phone,
        accountStatus: "ACTIVE",
      },
    });

    const restoreBlocked = await restoreFromReclaimSnapshot({ snapshotFile: snapPath });
    expect(restoreBlocked.ok).toBe(false);
    expect(restoreBlocked.message).toContain("IDENTIFIERS_ALREADY_CLAIMED");

    await prisma.user.delete({ where: { id: freshId } });

    // After claim released, restore dry-run/apply works.
    const restoreDry = await restoreFromReclaimSnapshot({ snapshotFile: snapPath });
    expect(restoreDry.ok).toBe(true);
    expect(restoreDry.mode).toBe("restore-dry-run");

    const restored = await restoreFromReclaimSnapshot({
      snapshotFile: snapPath,
      apply: true,
    });
    expect(restored.ok).toBe(true);
    expect(restored.changed).toBe(true);

    const restoredRow = await prisma.user.findUniqueOrThrow({ where: { id } });
    expect(restoredRow.email).toBe(email);
    expect(restoredRow.phone).toBe(phone);

    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  });

  it("fails closed when guarded update matches zero rows", async () => {
    expect(dbReady).toBe(true);
    const id = randomUUID();
    const email = `reclaim-race-${id.slice(0, 8)}@example.com`;
    const phone = `23481${String(Date.now()).slice(-8)}`;

    await prisma.user.create({
      data: {
        id,
        email,
        phone,
        accountStatus: "DEACTIVATED",
        deletedAt: new Date(),
        profile: {
          create: {
            displayName: "Race Test",
            deletedAt: new Date(),
            verificationStatus: "NOT_REVIEWED",
            visibilityStatus: "PRIVATE",
            profileStatus: "REGISTERED",
          },
        },
      },
    });

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reclaim-race-"));
    const { path: snapPath } = await writeReclaimSnapshot({ userId: id, dir });

    // Mutate identifiers after snapshot so guarded WHERE fails.
    await prisma.user.update({
      where: { id },
      data: { email: `mutated-${id.slice(0, 8)}@example.com` },
    });

    const result = await reclaimSoftDeletedIdentifiers({
      userId: id,
      apply: true,
      snapshotFile: snapPath,
    });
    expect(result.ok).toBe(false);
    expect(result.changed).toBe(false);
    expect(result.message).toMatch(/SNAPSHOT_MISMATCH|ROW_CHANGED|Refused/);

    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
  });
});
