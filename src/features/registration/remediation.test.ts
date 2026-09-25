import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  captcha: vi.fn(),
  duplicate: vi.fn(),
  createUser: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
  transaction: vi.fn(),
  deleteRoles: vi.fn(),
  deleteUserRow: vi.fn(),
}));

vi.mock("@/features/registration/rate-limit", () => ({
  checkRegistrationRateLimit: mocks.rateLimit,
}));
vi.mock("@/features/registration/captcha", () => ({
  verifyRegistrationCaptcha: mocks.captcha,
}));
vi.mock("@/features/registration/duplicate", () => ({
  findRegistrationDuplicate: mocks.duplicate,
}));
vi.mock("@/features/registration/analytics", () => ({
  trackRegistrationEvent: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    auth: {
      admin: {
        createUser: mocks.createUser,
        updateUserById: mocks.updateUserById,
        deleteUser: mocks.deleteUser,
      },
    },
  }),
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    $transaction: mocks.transaction,
    userRole: { deleteMany: mocks.deleteRoles },
    user: { deleteMany: mocks.deleteUserRow },
  }),
}));

import { registerProfessional } from "@/features/registration/register";

const valid = {
  fullName: "Ada Example",
  phone: "08012345678",
  email: "ada@example.com",
  professionalSituation: "Employee",
  profession: "Software",
  organisation: "Lab",
  lookingFor: "Connections",
  offering: "Mentorship",
  website: "",
  captchaToken: "test-turnstile-token",
};

describe("Phase 4 registration remediation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true });
    mocks.captcha.mockResolvedValue(true);
    mocks.duplicate.mockResolvedValue({ duplicate: false });
    mocks.createUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mocks.updateUserById.mockResolvedValue({ data: {}, error: null });
    mocks.deleteUser.mockResolvedValue({ data: {}, error: null });
    mocks.deleteRoles.mockResolvedValue({ count: 1 });
    mocks.deleteUserRow.mockResolvedValue({ count: 1 });
  });

  it("neutralizes duplicate membership without invoking Auth admin creation", async () => {
    mocks.duplicate.mockResolvedValue({ duplicate: true, kind: "email" });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result).toEqual({ ok: true, userId: "accepted", profileId: "accepted" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("fails closed and compensates Auth plus domain rows after a domain transaction failure", async () => {
    mocks.transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") throw new Error("forced domain failure");
      return [];
    });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result.ok).toBe(false);
    expect(mocks.updateUserById).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
      { ban_duration: "876000h" },
    );
    expect(mocks.deleteUser).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
    expect(mocks.deleteRoles).toHaveBeenCalled();
    expect(mocks.deleteUserRow).toHaveBeenCalled();
  });
});
