import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({ user: { findFirst: mocks.findFirst } }),
}));

import { activeIdentityExists } from "@/server/auth/active-identity";

describe("central active-identity guard", () => {
  beforeEach(() => mocks.findFirst.mockReset());

  it("requires ACTIVE, non-deleted account and profile state", async () => {
    mocks.findFirst.mockResolvedValue({ id: "user-1" });
    await expect(activeIdentityExists("user-1")).resolves.toBe(true);
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "user-1",
        accountStatus: "ACTIVE",
        deletedAt: null,
        profile: { is: { deletedAt: null } },
      },
      select: { id: true },
    });
  });

  it("denies a missing, suspended, deactivated, deleted, or profile-less identity", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(activeIdentityExists("user-2")).resolves.toBe(false);
  });
});
