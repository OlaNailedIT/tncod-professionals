import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  active: vi.fn(),
  findMany: vi.fn(),
}));
vi.mock("@/server/auth/active-identity", () => ({
  activeIdentityExists: mocks.active,
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({ userRole: { findMany: mocks.findMany } }),
}));

import { loadPermissionKeys, loadRoleNames } from "@/server/authorization/require";

describe("active identity authorization boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes roles and permissions immediately for inactive identities", async () => {
    mocks.active.mockResolvedValue(false);
    await expect(loadRoleNames("inactive-user")).resolves.toEqual([]);
    await expect(loadPermissionKeys("inactive-user")).resolves.toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("loads EXCO roles only after the active-identity guard passes", async () => {
    mocks.active.mockResolvedValue(true);
    mocks.findMany.mockResolvedValue([{ role: { name: "EXCO_ADMIN" } }]);
    await expect(loadRoleNames("active-user")).resolves.toEqual(["EXCO_ADMIN"]);
  });
});
