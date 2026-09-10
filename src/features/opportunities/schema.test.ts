import { describe, expect, it } from "vitest";
import {
  OPPORTUNITY_TYPES,
  parseOpportunitiesQuery,
  sanitizeOpportunityText,
  opportunityStatusLabel,
} from "@/features/opportunities/schema";
import {
  assertOpportunityProjection,
  OPPORTUNITY_FORBIDDEN_KEYS,
  summarizeDescription,
} from "@/features/opportunities/projection";

describe("Phase 16 opportunity schema helpers", () => {
  it("exposes exactly six V1.1 types", () => {
    expect([...OPPORTUNITY_TYPES]).toEqual([
      "JOBS",
      "BUSINESS",
      "COLLABORATION",
      "TRAINING",
      "MENTORSHIP",
      "OTHER",
    ]);
  });

  it("parses URL query safely", () => {
    expect(parseOpportunitiesQuery({ type: "training", page: "2", q: "design" })).toEqual({
      type: "TRAINING",
      page: 2,
      q: "design",
    });
    expect(parseOpportunitiesQuery({ type: "INVALID", page: "-1" })).toEqual({
      type: "ALL",
      page: 1,
      q: "",
    });
    expect(parseOpportunitiesQuery({ q: "<script>x</script>" }).q).toBe("<script>x</script>");
  });

  it("sanitizes opportunity text", () => {
    expect(sanitizeOpportunityText("Hello <script>alert(1)</script>")).toBe(
      "Hello scriptalert(1)/script",
    );
    expect(opportunityStatusLabel("ACTIVE")).toBe("Open");
    expect(opportunityStatusLabel("CLOSED")).toBe("Closed");
  });

  it("rejects forbidden projection keys", () => {
    const good = {
      id: "1",
      type: "JOBS",
      typeLabel: "Jobs",
      title: "T",
      summary: "S",
      location: null,
      status: "ACTIVE",
      statusLabel: "Open",
      publishedAt: null,
      createdAt: new Date().toISOString(),
      interested: false,
    };
    expect(() => assertOpportunityProjection(good)).not.toThrow();
    for (const key of OPPORTUNITY_FORBIDDEN_KEYS) {
      expect(() => assertOpportunityProjection({ ...good, [key]: "x" })).toThrow(/forbidden/);
    }
  });

  it("summarizes descriptions", () => {
    expect(summarizeDescription("Short")).toBe("Short");
    expect(summarizeDescription("a".repeat(200)).endsWith("…")).toBe(true);
  });
});
