import { describe, expect, it } from "vitest";
import {
  allowedExcoTransitions,
  businessVerificationLabel,
  memberMaySubmit,
} from "./verification-status";

describe("business verification transitions", () => {
  it("maps canonical statuses to member-facing labels", () => {
    expect(businessVerificationLabel("DRAFT")).toBe("Not submitted");
    expect(businessVerificationLabel("SUBMITTED")).toBe("Pending");
    expect(businessVerificationLabel("PENDING_REVIEW")).toBe("Under review");
    expect(businessVerificationLabel("APPROVED")).toBe("Verified");
    expect(businessVerificationLabel("NEEDS_CLARIFICATION")).toBe("Needs clarification");
    expect(businessVerificationLabel("REJECTED")).toBe("Rejected");
  });

  it("allows member submit only from draft/clarification/rejected", () => {
    expect(memberMaySubmit("DRAFT")).toBe(true);
    expect(memberMaySubmit("NEEDS_CLARIFICATION")).toBe(true);
    expect(memberMaySubmit("REJECTED")).toBe(true);
    expect(memberMaySubmit("SUBMITTED")).toBe(false);
    expect(memberMaySubmit("PENDING_REVIEW")).toBe(false);
    expect(memberMaySubmit("APPROVED")).toBe(false);
  });

  it("enforces EXCO transition matrix", () => {
    expect(allowedExcoTransitions("SUBMITTED", "start_review")).toBe("PENDING_REVIEW");
    expect(allowedExcoTransitions("SUBMITTED", "approve")).toBe("APPROVED");
    expect(allowedExcoTransitions("PENDING_REVIEW", "request_clarification")).toBe(
      "NEEDS_CLARIFICATION",
    );
    expect(allowedExcoTransitions("PENDING_REVIEW", "reject")).toBe("REJECTED");
    expect(allowedExcoTransitions("DRAFT", "approve")).toBeNull();
    expect(allowedExcoTransitions("APPROVED", "reject")).toBeNull();
  });
});
