import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  profileDeleteMany: vi.fn(),
  roleDeleteMany: vi.fn(),
  userDeleteMany: vi.fn(),
  executeRaw: vi.fn(),
  queryRaw: vi.fn(),
  txQueryRaw: vi.fn(),
  transaction: vi.fn(),
  updateUserById: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: { findUnique: mocks.userFindUnique },
    $executeRaw: mocks.executeRaw,
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => ({
    auth: {
      admin: {
        updateUserById: mocks.updateUserById,
        deleteUser: mocks.deleteUser,
      },
    },
  }),
}));

import {
  cleanupRegistrationIdentity,
  processRegistrationCleanupJobs,
} from "@/features/registration/registration-cleanup";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const LEASE_TOKEN = "22222222-2222-4222-8222-222222222222";
const CLAIM = { user_id: USER_ID, lease_token: LEASE_TOKEN };

describe("durable registration compensation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.userFindUnique.mockResolvedValue({ accountStatus: "DEACTIVATED" });
    mocks.updateUserById.mockResolvedValue({ error: null });
    mocks.deleteUser.mockResolvedValue({ error: null });
    mocks.profileDeleteMany.mockResolvedValue({ count: 1 });
    mocks.roleDeleteMany.mockResolvedValue({ count: 1 });
    mocks.userDeleteMany.mockResolvedValue({ count: 1 });
    mocks.executeRaw.mockResolvedValue(1);
    mocks.queryRaw
      .mockResolvedValueOnce([CLAIM])
      .mockResolvedValue([{ owned: true }]);
    mocks.txQueryRaw
      .mockResolvedValueOnce([{ user_id: USER_ID }])
      .mockResolvedValue([{ account_status: "DEACTIVATED" }]);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        profile: { deleteMany: mocks.profileDeleteMany },
        userRole: { deleteMany: mocks.roleDeleteMany },
        user: { deleteMany: mocks.userDeleteMany },
        $queryRaw: mocks.txQueryRaw,
        $executeRaw: mocks.executeRaw,
      }),
    );
  });

  it("never deletes a SUSPENDED identity and marks it for manual review", async () => {
    mocks.userFindUnique.mockResolvedValue({ accountStatus: "SUSPENDED" });

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(false);

    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.executeRaw).toHaveBeenCalledOnce();
  });

  it("does nothing when a stale worker no longer owns the lease", async () => {
    mocks.queryRaw
      .mockReset()
      .mockResolvedValueOnce([CLAIM])
      .mockResolvedValueOnce([{ owned: false }]);

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(false);

    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("never deletes an ACTIVE identity and marks it for manual review", async () => {
    mocks.userFindUnique.mockResolvedValue({ accountStatus: "ACTIVE" });

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(false);

    expect(mocks.updateUserById).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.executeRaw).toHaveBeenCalledOnce();
  });

  it("persists a retry when Auth deletion fails even if banning also fails", async () => {
    mocks.updateUserById.mockResolvedValue({ error: { message: "temporary ban failure" } });
    mocks.deleteUser.mockResolvedValue({ error: { message: "temporary delete failure" } });

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(false);

    expect(mocks.updateUserById).toHaveBeenCalledOnce();
    expect(mocks.deleteUser).toHaveBeenCalledOnce();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.executeRaw).toHaveBeenCalledOnce();
  });

  it("keeps the durable job when domain cleanup fails after Auth deletion", async () => {
    mocks.transaction.mockRejectedValue(new Error("temporary database failure"));

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(false);

    expect(mocks.deleteUser).toHaveBeenCalledOnce();
    expect(mocks.executeRaw).toHaveBeenCalledOnce();
  });

  it("removes domain rows and the job only after Auth deletion succeeds", async () => {
    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(true);

    expect(mocks.profileDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(mocks.roleDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(mocks.userDeleteMany).toHaveBeenCalledWith({
      where: { id: USER_ID, accountStatus: "DEACTIVATED" },
    });
  });

  it("claims queued work and processes each claimed identity once", async () => {
    mocks.queryRaw
      .mockReset()
      .mockResolvedValueOnce([CLAIM])
      .mockResolvedValue([{ owned: true }]);

    await expect(processRegistrationCleanupJobs()).resolves.toEqual({
      claimed: 1,
      completed: 1,
      failed: 0,
    });
    expect(mocks.deleteUser).toHaveBeenCalledOnce();
  });

  it("treats an already-absent Auth identity as an idempotent retry", async () => {
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.deleteUser.mockResolvedValue({
      error: { message: "not present", code: "user_not_found", status: 404 },
    });
    mocks.userDeleteMany.mockResolvedValue({ count: 0 });
    mocks.txQueryRaw
      .mockReset()
      .mockResolvedValueOnce([{ user_id: USER_ID }])
      .mockResolvedValueOnce([]);

    await expect(cleanupRegistrationIdentity(USER_ID)).resolves.toBe(true);
    expect(mocks.deleteUser).toHaveBeenCalledOnce();
  });
});
