export type ProfileStatus = "REGISTERED" | "INCOMPLETE" | "COMPLETE" | "SUBMITTED";
export type VerificationStatus =
  | "NOT_REVIEWED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "NEEDS_CLARIFICATION"
  | "REJECTED";
export type VisibilityStatus = "PRIVATE" | "MEMBERS_ONLY" | "DIRECTORY";

/** Do not collapse these into a single `status`. */
export type ProfessionalState = {
  profileStatus: ProfileStatus;
  verificationStatus: VerificationStatus;
  visibilityStatus: VisibilityStatus;
};
