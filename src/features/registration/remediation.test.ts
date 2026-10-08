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
  cleanupIdentity: vi.fn(),
  ensureProvisioning: vi.fn(),
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
vi.mock("@/features/registration/registration-cleanup", () => ({
  cleanupRegistrationIdentity: mocks.cleanupIdentity,
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
    $executeRaw: mocks.ensureProvisioning,
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
    mocks.cleanupIdentity.mockResolvedValue(true);
    mocks.ensureProvisioning.mockResolvedValue(0);
  });

  it("neutralizes duplicate membership without invoking Auth admin creation", async () => {
    mocks.duplicate.mockResolvedValue({ duplicate: true, kind: "email" });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result).toEqual({ ok: true, userId: "accepted", profileId: "accepted" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("neutralizes soft-deleted phone collisions the same way as email", async () => {
    mocks.duplicate.mockResolvedValue({ duplicate: true, kind: "phone" });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result).toEqual({ ok: true, userId: "accepted", profileId: "accepted" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("returns the same neutral accept for honeypot without creating Auth", async () => {
    const result = await registerProfessional(
      { ...valid, website: "https://bot.example" },
      { clientKey: "203.0.113.10" },
    );

    expect(result).toEqual({ ok: true, userId: "spam", profileId: "spam" });
    expect(mocks.duplicate).not.toHaveBeenCalled();
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("neutralizes Auth-admin already-exists without leaking provider detail", async () => {
    mocks.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: "A user with this email address has already been registered" },
    });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result).toEqual({ ok: true, userId: "accepted", profileId: "accepted" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("fails closed and invokes durable compensation after a domain transaction failure", async () => {
    mocks.transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") throw new Error("forced domain failure");
      return [];
    });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result.ok).toBe(false);
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        app_metadata: { registration_provisioning: true },
      }),
    );
    expect(mocks.cleanupIdentity).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
    expect(mocks.ensureProvisioning).toHaveBeenCalledOnce();
  });

  it("returns failure while leaving retry responsibility durable when immediate cleanup fails", async () => {
    mocks.transaction.mockImplementation(async (input: unknown) => {
      if (typeof input === "function") throw new Error("forced domain failure");
      return [];
    });
    mocks.cleanupIdentity.mockResolvedValue(false);

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result.ok).toBe(false);
    expect(mocks.cleanupIdentity).toHaveBeenCalledOnce();
  });

  it("tries compensation if the application-side provisioning guard fails", async () => {
    mocks.ensureProvisioning.mockRejectedValue(new Error("forced provisioning failure"));

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result.ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.cleanupIdentity).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("returns a real user/profile id on genuine successful registration", async () => {
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<string>) => {
      const tx = {
        user: {
          upsert: vi.fn(),
          update: vi.fn(),
        },
        role: { findUnique: vi.fn().mockResolvedValue({ id: "role-member" }) },
        userRole: { upsert: vi.fn() },
        profile: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "profile-1" }),
        },
        $executeRaw: vi.fn().mockResolvedValue(1),
      };
      return fn(tx);
    });

    const result = await registerProfessional(valid, { clientKey: "203.0.113.10" });

    expect(result).toEqual({
      ok: true,
      userId: "11111111-1111-4111-8111-111111111111",
      profileId: "profile-1",
      durationMs: expect.any(Number),
    });
    expect(mocks.cleanupIdentity).not.toHaveBeenCalled();
  });
});
