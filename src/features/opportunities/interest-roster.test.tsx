import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InterestRosterPanel } from "@/features/opportunities/interest-roster-panel";
import {
  assertInterestRosterItem,
  INTEREST_ROSTER_FORBIDDEN_KEYS,
  type InterestRosterItem,
} from "@/features/opportunities/interest-roster";

const item: InterestRosterItem = {
  displayName: "Ada Okonkwo",
  expressedAt: "2026-10-16T08:00:00.000Z",
  professionalHref: "/exco/professionals/11111111-1111-1111-1111-111111111111",
};

describe("interest roster projection", () => {
  it("accepts only the operational fields", () => {
    expect(() => assertInterestRosterItem(item)).not.toThrow();
  });

  it("rejects contact and identity fields", () => {
    for (const key of INTEREST_ROSTER_FORBIDDEN_KEYS) {
      expect(() => assertInterestRosterItem({ ...item, [key]: "secret" })).toThrow(/forbidden/);
    }
  });
});

describe("interest roster panel", () => {
  it("labels current interest and keeps it apart from potential matches", () => {
    const html = renderToStaticMarkup(
      <InterestRosterPanel
        result={{
          ok: true,
          opportunityId: "opp-1",
          opportunityStatus: "ACTIVE",
          items: [item],
        }}
      />,
    );
    expect(html).toContain("Expressed interest");
    expect(html).toContain("Ada Okonkwo");
    expect(html).toContain('href="/exco/professionals/11111111-1111-1111-1111-111111111111"');
    expect(html).toContain('dateTime="2026-10-16T08:00:00.000Z"');
    expect(html).not.toContain("Potential match");
    expect(html).not.toContain("secret@example.com");
  });

  it("shows an empty current list without a match heading", () => {
    const html = renderToStaticMarkup(
      <InterestRosterPanel
        result={{ ok: true, opportunityId: "opp-1", opportunityStatus: "ACTIVE", items: [] }}
      />,
    );
    expect(html).toContain("No members currently have an expressed interest.");
    expect(html).not.toContain("Potential match");
  });

  it("keeps current interest visible when the opportunity is closed", () => {
    const html = renderToStaticMarkup(
      <InterestRosterPanel
        result={{
          ok: true,
          opportunityId: "opp-1",
          opportunityStatus: "CLOSED",
          items: [item],
        }}
      />,
    );
    expect(html).toContain("This opportunity is closed.");
    expect(html).toContain("Ada Okonkwo");
  });

  it("does not invent a roster for a missing opportunity", () => {
    const html = renderToStaticMarkup(
      <InterestRosterPanel result={{ ok: false, code: "NOT_FOUND", message: "Opportunity not found" }} />,
    );
    expect(html).toContain("Opportunity not found");
    expect(html).not.toContain("Ada Okonkwo");
  });
});
