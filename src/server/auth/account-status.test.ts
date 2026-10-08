import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("@/server/authorization/require", () => ({
  requireRole: mocks.requireRole,
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: { findUnique: mocks.findUnique, update: mocks.update },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    auth: { admin: { updateUserById: mocks.updateUserById } },
  }),
}));

import { setAccountStatus } from "@/server/auth/account-status";

describe("account-status Auth synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue(undefined);
    mocks.findUnique.mockResolvedValue({ accountStatus: "ACTIVE" });
    mocks.updateUserById.mockResolvedValue({ error: null });
    mocks.update.mockResolvedValue({});
  });

  it("bans Auth before suspending the application account", async () => {
    await setAccountStatus("super-admin", "member", "SUSPENDED");

    expect(mocks.requireRole).toHaveBeenCalledWith("super-admin", "SUPER_ADMIN");
    expect(mocks.updateUserById).toHaveBeenCalledWith("member", {
      ban_duration: "876000h",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "member" },
      data: { accountStatus: "SUSPENDED" },
    });
    expect(mocks.updateUserById.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.update.mock.invocationCallOrder[0],
    );
  });

  it("restores the prior Auth state if the database transition fails", async () => {
    mocks.update.mockRejectedValue(new Error("database unavailable"));

    await expect(
      setAccountStatus("super-admin", "member", "DEACTIVATED"),
    ).rejects.toThrow("database unavailable");

    expect(mocks.updateUserById).toHaveBeenNthCalledWith(1, "member", {
      ban_duration: "876000h",
    });
    expect(mocks.updateUserById).toHaveBeenNthCalledWith(2, "member", {
      ban_duration: "none",
    });
  });

  it("does not change the database when the Auth transition is rejected", async () => {
    mocks.updateUserById.mockResolvedValue({ error: new Error("Auth unavailable") });

    await expect(
      setAccountStatus("super-admin", "member", "SUSPENDED"),
    ).rejects.toThrow("Could not synchronize account access");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
