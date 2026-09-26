import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => {
    throw new Error("Auth cleanup must not run for an empty queue");
  },
}));

import { getPrisma } from "@/lib/prisma/client";
import { processRegistrationCleanupJobs } from "./registration-cleanup";

describe("registration cleanup database boundary", () => {
  it("executes an empty claim batch against Postgres without a parameter-type error", async () => {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*)::bigint AS count
      FROM app.registration_provisioning
    `;
    expect(rows[0]?.count).toBe(0n);

    await expect(processRegistrationCleanupJobs(1)).resolves.toEqual({
      claimed: 0,
      completed: 0,
      failed: 0,
    });
  });
});
