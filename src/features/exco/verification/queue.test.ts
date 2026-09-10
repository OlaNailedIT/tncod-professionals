import { describe, expect, it } from "vitest";
import { parseVerificationTab, PROFESSIONAL_TAB, BUSINESS_TAB } from "./queue-model";

describe("verification queue tab mapping", () => {
  it("defaults to attention and accepts locked tabs", () => {
    expect(parseVerificationTab(undefined)).toBe("attention");
    expect(parseVerificationTab("pending")).toBe("pending");
    expect(parseVerificationTab("under_review")).toBe("under_review");
    expect(parseVerificationTab("needs_clarification")).toBe("needs_clarification");
    expect(parseVerificationTab("verified")).toBe("verified");
    expect(parseVerificationTab("rejected")).toBe("rejected");
    expect(parseVerificationTab("bogus")).toBe("attention");
  });

  it("maps tabs to separate professional and business canonical states", () => {
    expect(PROFESSIONAL_TAB.pending).toEqual(["PENDING"]);
    expect(BUSINESS_TAB.pending).toEqual(["SUBMITTED"]);
    expect(PROFESSIONAL_TAB.under_review).toEqual(["UNDER_REVIEW"]);
    expect(BUSINESS_TAB.under_review).toEqual(["PENDING_REVIEW"]);
    expect(PROFESSIONAL_TAB.verified).toEqual(["VERIFIED"]);
    expect(BUSINESS_TAB.verified).toEqual(["APPROVED"]);
  });
});
