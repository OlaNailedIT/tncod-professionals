import { describe, expect, it } from "vitest";
import {
  allowedExcoProfessionalTransitions,
  memberMaySubmitVerification,
  professionalVerificationLabel,
} from "./verification-status";
import { nextSlugCandidate, slugifyPublicName } from "./slug";

describe("professional verification transitions", () => {
  it("maps canonical statuses to labels", () => {
    expect(professionalVerificationLabel("NOT_REVIEWED")).toBe("Not reviewed");
    expect(professionalVerificationLabel("PENDING")).toBe("Pending");
    expect(professionalVerificationLabel("UNDER_REVIEW")).toBe("Under review");
    expect(professionalVerificationLabel("VERIFIED")).toBe("Verified");
    expect(professionalVerificationLabel("NEEDS_CLARIFICATION")).toBe("Needs clarification");
    expect(professionalVerificationLabel("REJECTED")).toBe("Rejected");
  });

  it("allows member submit only from not reviewed / clarification / rejected", () => {
    expect(memberMaySubmitVerification("NOT_REVIEWED")).toBe(true);
    expect(memberMaySubmitVerification("NEEDS_CLARIFICATION")).toBe(true);
    expect(memberMaySubmitVerification("REJECTED")).toBe(true);
    expect(memberMaySubmitVerification("PENDING")).toBe(false);
    expect(memberMaySubmitVerification("UNDER_REVIEW")).toBe(false);
    expect(memberMaySubmitVerification("VERIFIED")).toBe(false);
  });

  it("requires start_review before terminal EXCO actions", () => {
    expect(allowedExcoProfessionalTransitions("PENDING", "start_review")).toBe("UNDER_REVIEW");
    expect(allowedExcoProfessionalTransitions("PENDING", "verify")).toBeNull();
    expect(allowedExcoProfessionalTransitions("PENDING", "reject")).toBeNull();
    expect(allowedExcoProfessionalTransitions("UNDER_REVIEW", "verify")).toBe("VERIFIED");
    expect(allowedExcoProfessionalTransitions("UNDER_REVIEW", "request_clarification")).toBe(
      "NEEDS_CLARIFICATION",
    );
    expect(allowedExcoProfessionalTransitions("UNDER_REVIEW", "reject")).toBe("REJECTED");
    expect(allowedExcoProfessionalTransitions("VERIFIED", "reject")).toBeNull();
    expect(allowedExcoProfessionalTransitions("NOT_REVIEWED", "start_review")).toBeNull();
  });
});

describe("public slug foundation", () => {
  it("slugifies display names and avoids reserved bases", () => {
    expect(slugifyPublicName("Ada Lovelace")).toBe("ada-lovelace");
    expect(slugifyPublicName("  Admin  ")).toBe("professional");
    expect(slugifyPublicName("")).toBe("professional");
  });

  it("uses deterministic collision candidates", () => {
    expect(nextSlugCandidate("ada-lovelace", 1)).toBe("ada-lovelace");
    expect(nextSlugCandidate("ada-lovelace", 2)).toBe("ada-lovelace-2");
    expect(nextSlugCandidate("ada-lovelace", 3)).toBe("ada-lovelace-3");
  });
});
