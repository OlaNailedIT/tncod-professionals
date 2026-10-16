import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("@/server/authorization/require", () => ({
  loadRoleNames: vi.fn(),
}));

import { loadRoleNames } from "@/server/authorization/require";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import type { AppRoleName } from "@/security/permissions";

const EXCO_ROLES = ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] as const satisfies readonly AppRoleName[];

describe("hasExcoDashboardAccess", () => {
  beforeEach(() => {
    vi.mocked(loadRoleNames).mockReset();
  });

  it.each(EXCO_ROLES)("allows %s", async (role) => {
    vi.mocked(loadRoleNames).mockResolvedValue([role]);
    await expect(hasExcoDashboardAccess("user-1")).resolves.toBe(true);
  });

  it("denies MEMBER and anonymous role sets", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue(["MEMBER"]);
    await expect(hasExcoDashboardAccess("user-1")).resolves.toBe(false);
    vi.mocked(loadRoleNames).mockResolvedValue([]);
    await expect(hasExcoDashboardAccess("user-1")).resolves.toBe(false);
  });
});
