import { describe, expect, it } from "vitest";
import {
  ANALYTICS_SUPPRESSION_THRESHOLD,
  suppressBreakdown,
} from "@/features/exco/analytics/privacy";
import { parseAnalyticsQuery } from "@/features/exco/analytics/query";

describe("Phase 20 analytics privacy", () => {
  it("passes through groups at or above threshold", () => {
    const out = suppressBreakdown([
      { key: "Engineering", count: 3 },
      { key: "Law", count: 5 },
    ]);
    expect(out).toEqual([
      { key: "Law", count: 5, suppressed: false },
      { key: "Engineering", count: 3, suppressed: false },
    ]);
  });

  it("buckets groups below threshold without revealing keys", () => {
    const out = suppressBreakdown([
      { key: "Rare A", count: 1 },
      { key: "Rare B", count: 2 },
      { key: "Common", count: 4 },
    ]);
    expect(out.find((r) => r.key === "Rare A")).toBeUndefined();
    expect(out.find((r) => r.key === "Rare B")).toBeUndefined();
    expect(out).toContainEqual({ key: "Common", count: 4, suppressed: false });
    expect(out).toContainEqual({ key: "(suppressed)", count: 3, suppressed: true });
  });

  it("uses locked threshold of 3", () => {
    expect(ANALYTICS_SUPPRESSION_THRESHOLD).toBe(3);
    const at = suppressBreakdown([{ key: "X", count: 3 }]);
    const below = suppressBreakdown([{ key: "Y", count: 2 }]);
    expect(at[0]?.suppressed).toBe(false);
    expect(below[0]?.key).toBe("(suppressed)");
  });
});

describe("Phase 20 analytics query parsing", () => {
  it("accepts allowlisted filters only", () => {
    const q = parseAnalyticsQuery({
      situation: "Job seeker",
      industry: "Finance",
      verification: "VERIFIED",
      directory: "published",
      days: "7",
    });
    expect(q).toEqual({
      situation: "Job seeker",
      industry: "Finance",
      verification: "VERIFIED",
      directoryEffective: "published",
      registrationDays: 7,
    });
  });

  it("rejects forged / unsafe filter values", () => {
    const q = parseAnalyticsQuery({
      situation: "Hacker",
      verification: "EVERYONE",
      directory: "all",
      days: "999",
      industry: "x".repeat(200),
    });
    expect(q.situation).toBeNull();
    expect(q.verification).toBeNull();
    expect(q.directoryEffective).toBeNull();
    expect(q.registrationDays).toBe(30);
    expect(q.industry).toBeNull();
  });
});
