import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
    },
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
    $transaction: mocks.transaction,
  }),
}));

import {
  maskEmail,
  maskPhone,
  preflightIdentifierReclaim,
  publicReclaimPreflight,
  readReclaimSnapshot,
  reclaimSoftDeletedIdentifiers,
  reclaimTombstoneEmail,
  restoreFromReclaimSnapshot,
  writeReclaimSnapshot,
} from "./identifier-reclaim";

const USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";
const EMAIL = "smiley7605+tncodphase4oct03@gmail.com";
const PHONE = "2348012345678";

function softDeletedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: EMAIL,
    phone: PHONE,
    deletedAt: new Date("2026-10-08T00:00:00Z"),
    accountStatus: "DEACTIVATED" as const,
    profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
    userRoles: [],
    ...overrides,
  };
}

describe("identifier reclaim", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: no auth.users rows (by id or email)
    mocks.queryRaw.mockResolvedValue([]);
    mocks.findFirst.mockResolvedValue(null);
  });

  it("builds a deterministic tombstone email", () => {
    expect(reclaimTombstoneEmail(USER_ID)).toBe(
      "reclaimed+df709e231a554ba4bfacdde6740512ff@tombstone.invalid",
    );
  });

  it("masks email and phone without leaking full phone", () => {
    expect(maskEmail(EMAIL)).toMatch(/^s\*\*\*@gmail\.com$/);
    expect(maskPhone(PHONE)).toMatch(/234…78 \(len=13\)/);
  });

  it("refuses when Auth still exists by UUID", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());
    mocks.queryRaw.mockResolvedValueOnce([{ id: USER_ID }]);

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("AUTH_STILL_PRESENT");
    expect(pre.auth_exists_by_id).toBe(true);
  });

  it("refuses when Auth still exists by original email", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());
    mocks.queryRaw
      .mockResolvedValueOnce([]) // by id
      .mockResolvedValueOnce([{ id: "other-auth-id" }]); // by email

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("AUTH_EMAIL_STILL_PRESENT");
    expect(pre.auth_exists_by_email).toBe(true);
  });

  it("refuses active non-deleted rows", async () => {
    mocks.findUnique.mockResolvedValue(
      softDeletedRow({
        deletedAt: null,
        accountStatus: "ACTIVE",
        profile: { deletedAt: null },
        phone: null,
      }),
    );

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("NOT_SOFT_DELETED");
  });

  it("refuses when email is held by another identity", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow({ email: "shared@example.com" }));
    mocks.findFirst.mockResolvedValueOnce({ id: "other-user" });

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("EMAIL_HELD_ELSEWHERE");
  });

  it("refuses when phone is held by another identity", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow({ email: "alone@example.com" }));
    mocks.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "other-user" });

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("PHONE_HELD_ELSEWHERE");
  });

  it("dry-run succeeds for soft-deleted Auth-absent tombstone", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("dry-run");
    expect(result.changed).toBe(false);
    expect(result.would_change?.email_to).toBe(reclaimTombstoneEmail(USER_ID));
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("apply refuses without snapshot", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID, apply: true });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("SNAPSHOT_REQUIRED");
  });

  it("apply uses guarded transaction and requires exactly one updated row", async () => {
    const soft = softDeletedRow();
    const tombstone = reclaimTombstoneEmail(USER_ID);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reclaim-snap-"));

    mocks.findUnique.mockResolvedValue(soft);
    const { path: snapPath } = await writeReclaimSnapshot({ userId: USER_ID, dir });

    mocks.findUnique
      .mockResolvedValueOnce(soft)
      .mockResolvedValueOnce({
        ...soft,
        email: tombstone,
        phone: null,
      });

    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<number>) => {
      const tx = {
        $queryRaw: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: USER_ID,
              email: EMAIL,
              phone: PHONE,
              deleted_at: soft.deletedAt,
              account_status: "DEACTIVATED",
              profile_active: false,
            },
          ])
          // auth by id + auth by email inside transaction
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        $executeRaw: vi.fn().mockResolvedValue(1),
      };
      return fn(tx);
    });

    const result = await reclaimSoftDeletedIdentifiers({
      userId: USER_ID,
      apply: true,
      snapshotFile: snapPath,
    });
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.message).toMatch(/guarded update/);
    expect(mocks.transaction).toHaveBeenCalled();
  });

  it("already-reclaimed succeeds only in safe resting state", async () => {
    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique.mockResolvedValue(
      softDeletedRow({ email: tombstone, phone: null }),
    );

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID, apply: true });
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.preflight.already_reclaimed).toBe(true);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("tombstone email with phone remaining is not safe success", async () => {
    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique.mockResolvedValue(softDeletedRow({ email: tombstone, phone: PHONE }));

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("RECLAIM_INCOMPLETE");
    expect(pre.already_reclaimed).toBe(false);

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID });
    expect(result.ok).toBe(false);
  });

  it("tombstone email with Auth present is not safe success", async () => {
    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique.mockResolvedValue(
      softDeletedRow({ email: tombstone, phone: null }),
    );
    mocks.queryRaw.mockResolvedValueOnce([{ id: USER_ID }]);

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("AUTH_STILL_PRESENT");
    expect(pre.already_reclaimed).toBe(false);
  });

  it("strips full identifiers from public preflight", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());
    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre._email).toBe(EMAIL);
    const pub = publicReclaimPreflight(pre);
    expect(pub._email).toBeUndefined();
    expect(JSON.stringify(pub)).not.toContain(EMAIL);
    expect(JSON.stringify(pub)).not.toContain(PHONE);
  });

  it("writes and reads an integrity-checked snapshot", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reclaim-snap-"));
    const { path: snapPath } = await writeReclaimSnapshot({ userId: USER_ID, dir });
    const snap = readReclaimSnapshot(snapPath);
    expect(snap.email).toBe(EMAIL);
    expect(snap.phone).toBe(PHONE);
    expect(snap.userId).toBe(USER_ID);
  });

  it("restore dry-run refuses when identifiers already claimed", async () => {
    mocks.findUnique.mockResolvedValue(softDeletedRow());
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reclaim-snap-"));
    const { path: snapPath } = await writeReclaimSnapshot({ userId: USER_ID, dir });

    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique.mockResolvedValue(
      softDeletedRow({ email: tombstone, phone: null }),
    );
    mocks.findFirst.mockResolvedValueOnce({ id: "new-owner" });

    const result = await restoreFromReclaimSnapshot({ snapshotFile: snapPath });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("IDENTIFIERS_ALREADY_CLAIMED");
  });
});
