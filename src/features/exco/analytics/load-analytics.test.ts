import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("@/server/authorization/require", () => ({
  loadRoleNames: vi.fn(),
}));

vi.mock("@/features/exco/analytics/compute-analytics", () => ({
  computeExcoAnalytics: vi.fn(async () => ({ ok: true })),
}));

import { loadRoleNames } from "@/server/authorization/require";
import { loadExcoAnalytics } from "@/features/exco/analytics/load-analytics";
import { AppError } from "@/lib/errors";

const emptyQuery = {
  situation: null,
  industry: null,
  verification: null,
  directoryEffective: null,
  registrationDays: 30,
} as const;

describe("Phase 20 analytics authorization", () => {
  beforeEach(() => {
    vi.mocked(loadRoleNames).mockReset();
  });

  it("denies MEMBER", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue(["MEMBER"]);
    await expect(loadExcoAnalytics("user-1", emptyQuery)).rejects.toBeInstanceOf(AppError);
  });

  it("allows EXCO_VIEWER", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue(["EXCO_VIEWER"]);
    await expect(loadExcoAnalytics("user-1", emptyQuery)).resolves.toEqual({ ok: true });
  });

  it("allows EXCO_ADMIN", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue(["EXCO_ADMIN"]);
    await expect(loadExcoAnalytics("user-1", emptyQuery)).resolves.toEqual({ ok: true });
  });

  it("allows SUPER_ADMIN", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue(["SUPER_ADMIN"]);
    await expect(loadExcoAnalytics("user-1", emptyQuery)).resolves.toEqual({ ok: true });
  });

  it("denies empty roles (forged client claim irrelevant)", async () => {
    vi.mocked(loadRoleNames).mockResolvedValue([]);
    await expect(loadExcoAnalytics("user-1", emptyQuery)).rejects.toBeInstanceOf(AppError);
  });
});
