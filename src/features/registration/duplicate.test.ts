import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: { findFirst: mocks.findFirst },
  }),
}));

import { findRegistrationDuplicate } from "./duplicate";

describe("registration duplicate boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a soft-deleted email row as a duplicate before Auth creation", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "existing-domain-user" }).mockResolvedValueOnce(null);

    const result = await findRegistrationDuplicate({
      email: " Existing@Example.com ",
      phone: "+234 801 234 5678",
    });

    expect(result).toEqual({ duplicate: true, kind: "email" });
    expect(mocks.findFirst).toHaveBeenNthCalledWith(1, {
      where: { email: "existing@example.com" },
      select: { id: true },
    });
  });

  it("treats a soft-deleted phone row as a duplicate", async () => {
    mocks.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "phone-tombstone" });

    const result = await findRegistrationDuplicate({
      email: "fresh@example.com",
      phone: "08012345678",
    });

    expect(result).toEqual({ duplicate: true, kind: "phone" });
    expect(mocks.findFirst).toHaveBeenNthCalledWith(2, {
      where: { phone: "2348012345678" },
      select: { id: true },
    });
  });
});
