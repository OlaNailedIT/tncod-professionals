import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  getUserById: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    auth: { admin: { getUserById: mocks.getUserById } },
  }),
}));

import {
  maskEmail,
  maskPhone,
  preflightIdentifierReclaim,
  reclaimSoftDeletedIdentifiers,
  reclaimTombstoneEmail,
} from "./identifier-reclaim";

const USER_ID = "df709e23-1a55-4ba4-bfac-dde6740512ff";

describe("identifier reclaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserById.mockResolvedValue({ data: { user: null }, error: { message: "User not found" } });
  });

  it("builds a deterministic tombstone email", () => {
    expect(reclaimTombstoneEmail(USER_ID)).toBe(
      "reclaimed+df709e231a554ba4bfacdde6740512ff@tombstone.invalid",
    );
  });

  it("masks email and phone without leaking full phone", () => {
    expect(maskEmail("smiley7605+tncodphase4oct03@gmail.com")).toMatch(/^s\*\*\*@gmail\.com$/);
    expect(maskPhone("2348012345678")).toMatch(/234…78 \(len=13\)/);
  });

  it("refuses when Auth still exists", async () => {
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: "smiley7605+tncodphase4oct03@gmail.com",
      phone: "2348012345678",
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED",
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    });
    mocks.getUserById.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("AUTH_STILL_PRESENT");
  });

  it("refuses active non-deleted rows", async () => {
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: "a@example.com",
      phone: null,
      deletedAt: null,
      accountStatus: "ACTIVE",
      profile: { deletedAt: null },
      userRoles: [{ roleId: "r1" }],
    });

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("NOT_SOFT_DELETED");
  });

  it("refuses when email is held by another identity", async () => {
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: "shared@example.com",
      phone: "2348012345678",
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED",
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    });
    mocks.findFirst.mockResolvedValueOnce({ id: "other-user" });

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("EMAIL_HELD_ELSEWHERE");
  });

  it("refuses when phone is held by another identity", async () => {
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: "alone@example.com",
      phone: "2348099999999",
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED",
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    });
    mocks.findFirst
      .mockResolvedValueOnce(null) // email elsewhere
      .mockResolvedValueOnce({ id: "other-user" }); // phone elsewhere

    const pre = await preflightIdentifierReclaim(USER_ID);
    expect(pre.refuse).toBe("PHONE_HELD_ELSEWHERE");
  });

  it("dry-run succeeds for soft-deleted Auth-absent tombstone", async () => {
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: "smiley7605+tncodphase4oct03@gmail.com",
      phone: "2348012345678",
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED",
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    });
    mocks.findFirst.mockResolvedValue(null);

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("dry-run");
    expect(result.changed).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("apply updates email to tombstone and clears phone", async () => {
    const soft = {
      id: USER_ID,
      email: "smiley7605+tncodphase4oct03@gmail.com",
      phone: "2348012345678",
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED" as const,
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    };
    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique
      .mockResolvedValueOnce(soft)
      .mockResolvedValueOnce({
        ...soft,
        email: tombstone,
        phone: null,
      });
    mocks.findFirst.mockResolvedValue(null);
    mocks.update.mockResolvedValue({});

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID, apply: true });
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { email: tombstone, phone: null },
    });
  });

  it("is idempotent when already reclaimed", async () => {
    const tombstone = reclaimTombstoneEmail(USER_ID);
    mocks.findUnique.mockResolvedValue({
      id: USER_ID,
      email: tombstone,
      phone: null,
      deletedAt: new Date("2026-10-08T00:00:00Z"),
      accountStatus: "DEACTIVATED",
      profile: { deletedAt: new Date("2026-10-08T00:00:00Z") },
      userRoles: [],
    });

    const result = await reclaimSoftDeletedIdentifiers({ userId: USER_ID, apply: true });
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.preflight.already_reclaimed).toBe(true);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
