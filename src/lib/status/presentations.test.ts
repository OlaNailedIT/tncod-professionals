import { describe, expect, it } from "vitest";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
  presentBusinessStatus,
  presentOpportunityStatus,
} from "@/lib/status";

describe("status presentations", () => {
  it("keeps profile completeness independent of verification wording", () => {
    expect(presentProfileStatus("COMPLETE")).toEqual({
      intent: "success",
      label: "Complete",
    });
    expect(presentVerificationStatus("VERIFIED").label).toBe("Verified");
    expect(presentProfileStatus("COMPLETE").label).not.toBe(
      presentVerificationStatus("VERIFIED").label,
    );
  });

  it("does not treat PRIVATE visibility as rejection", () => {
    const priv = presentVisibilityStatus("PRIVATE");
    expect(priv.intent).toBe("neutral");
    expect(priv.label).toBe("Private");
    expect(presentVerificationStatus("REJECTED").intent).toBe("danger");
  });

  it("maps DIRECTORY as publication info, not verification success", () => {
    expect(presentVisibilityStatus("DIRECTORY")).toEqual({
      intent: "info",
      label: "Directory",
    });
    expect(presentVerificationStatus("VERIFIED").intent).toBe("success");
  });

  it("covers every locked professional enum value", () => {
    const profiles = ["REGISTERED", "INCOMPLETE", "COMPLETE", "SUBMITTED"] as const;
    const verifications = [
      "NOT_REVIEWED",
      "PENDING",
      "UNDER_REVIEW",
      "VERIFIED",
      "NEEDS_CLARIFICATION",
      "REJECTED",
    ] as const;
    const visibilities = ["PRIVATE", "MEMBERS_ONLY", "DIRECTORY"] as const;

    for (const s of profiles) {
      expect(presentProfileStatus(s).label.length).toBeGreaterThan(0);
    }
    for (const s of verifications) {
      expect(presentVerificationStatus(s).label.length).toBeGreaterThan(0);
    }
    for (const s of visibilities) {
      expect(presentVisibilityStatus(s).label.length).toBeGreaterThan(0);
    }
  });

  it("maps secondary schema domains without inventing values", () => {
    expect(presentBusinessStatus("APPROVED").intent).toBe("success");
    expect(presentOpportunityStatus("EXPIRED").intent).toBe("warning");
  });
});
