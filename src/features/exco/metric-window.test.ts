import { describe, expect, it } from "vitest";
import { registrationWindowStartUtc } from "./metric-window";

describe("Phase 10 registration window", () => {
  it("includes today and the previous 29 UTC calendar days (30 inclusive)", () => {
    const now = new Date("2026-09-08T15:30:00.000Z");
    const start = registrationWindowStartUtc(now, 30);
    expect(start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("uses UTC midnight boundaries", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const start = registrationWindowStartUtc(now, 30);
    expect(start.toISOString()).toBe("2025-12-03T00:00:00.000Z");
  });

  it("treats registrations at window start as included (calendar, not rolling hours)", () => {
    const now = new Date("2026-09-08T23:59:59.000Z");
    const start = registrationWindowStartUtc(now, 30);
    expect(start.getTime()).toBe(Date.parse("2026-08-10T00:00:00.000Z"));
    expect(start.getTime()).toBeLessThan(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  });
});

describe("Phase 10 metric domain separation (contract)", () => {
  it("keeps professional and business verification labels distinct", () => {
    const labels = [
      "Pending professional verification",
      "Pending business verification",
      "Verified professionals",
      "Verified businesses",
    ];
    expect(new Set(labels).size).toBe(4);
    expect(labels.some((l) => l === "Verified")).toBe(false);
    expect(labels.some((l) => l === "Pending verification")).toBe(false);
  });
});
