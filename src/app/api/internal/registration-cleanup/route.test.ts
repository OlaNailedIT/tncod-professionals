import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ process: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/features/registration/registration-cleanup", () => ({
  processRegistrationCleanupJobs: mocks.process,
}));

import { GET } from "@/app/api/internal/registration-cleanup/route";

const SECRET = "a-secure-cron-secret-with-at-least-32-chars";

describe("registration cleanup cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", SECRET);
    mocks.process.mockResolvedValue({ claimed: 0, completed: 0, failed: 0 });
  });

  it("rejects a missing or incorrect secret", async () => {
    const missing = await GET(new Request("https://example.test/api/internal/registration-cleanup"));
    const wrong = await GET(
      new Request("https://example.test/api/internal/registration-cleanup", {
        headers: { authorization: "Bearer wrong-secret" },
      }),
    );

    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("runs only with the exact bearer secret and returns aggregate counts", async () => {
    const response = await GET(
      new Request("https://example.test/api/internal/registration-cleanup", {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      claimed: 0,
      completed: 0,
      failed: 0,
    });
    expect(mocks.process).toHaveBeenCalledOnce();
  });

  it("returns a failure status when any durable cleanup remains pending", async () => {
    mocks.process.mockResolvedValue({ claimed: 1, completed: 0, failed: 1 });

    const response = await GET(
      new Request("https://example.test/api/internal/registration-cleanup", {
        headers: { authorization: `Bearer ${SECRET}` },
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      claimed: 1,
      completed: 0,
      failed: 1,
    });
  });
});
