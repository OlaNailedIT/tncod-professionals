import "server-only";

import type { SpotlightStatus, VerificationStatus } from "@prisma/client";
import {
  calculateProfileCompletion,
  toCompletionInput,
  type ProfileCompletionInput,
} from "@/features/profile/completion";

export type SpotlightEligibilityInput = {
  spotlightInterest: boolean;
  verificationStatus: VerificationStatus | string;
  deletedAt: Date | null;
  accountStatus: string;
  hasHeadshot: boolean;
  completionInput: ProfileCompletionInput;
};

export type SpotlightEligibilityResult = {
  eligible: boolean;
  interest: boolean;
  profileComplete: boolean;
  headshotAvailable: boolean;
  verified: boolean;
  accountActive: boolean;
  completionPercent: number;
};

/** Authoritative headshot availability for Phase 15 — metadata key present. Upload UX deferred. */
export function isAuthoritativeHeadshotAvailable(profileImageStorageKey: string | null | undefined): boolean {
  return Boolean(profileImageStorageKey && profileImageStorageKey.trim().length > 0);
}

/**
 * Single eligibility calculator. Client flags must never be passed as truth —
 * callers must derive inputs from authoritative DB rows.
 */
export function evaluateSpotlightEligibility(
  input: SpotlightEligibilityInput,
): SpotlightEligibilityResult {
  const completion = calculateProfileCompletion(input.completionInput);
  const interest = input.spotlightInterest === true;
  const profileComplete = completion.percent === 100;
  const headshotAvailable = input.hasHeadshot === true;
  const verified = input.verificationStatus === "VERIFIED";
  const accountActive = input.accountStatus === "ACTIVE" && input.deletedAt == null;

  return {
    eligible: interest && profileComplete && headshotAvailable && verified && accountActive,
    interest,
    profileComplete,
    headshotAvailable,
    verified,
    accountActive,
    completionPercent: completion.percent,
  };
}

export function isActiveSpotlightStatus(status: SpotlightStatus | string): boolean {
  return status !== "ARCHIVED";
}

export { toCompletionInput };
