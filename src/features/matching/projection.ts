import type { DimensionResult, MatchOutcome } from "@/features/matching/rules";

/**
 * EXCO-facing potential match projection.
 * No contact, auth IDs, interest history, or private consent data.
 */
export type PotentialMatchProjection = {
  profileId: string;
  displayName: string;
  profession: string | null;
  location: string | null;
  yearsExperience: number | null;
  skillNames: string[];
  verificationStatus: string;
  outcome: MatchOutcome;
  dimensions: DimensionResult[];
};

export const MATCH_FORBIDDEN_KEYS = [
  "email",
  "phone",
  "whatsapp",
  "userId",
  "user_id",
  "storageKey",
  "profileImageStorageKey",
  "consent",
  "interest",
  "interests",
  "clarificationMessage",
] as const;

export function assertMatchProjection(value: unknown): asserts value is PotentialMatchProjection {
  if (!value || typeof value !== "object") {
    throw new Error("PotentialMatchProjection must be an object");
  }
  const obj = value as Record<string, unknown>;
  for (const key of MATCH_FORBIDDEN_KEYS) {
    if (key in obj) {
      throw new Error(`Match projection leaked forbidden field: ${key}`);
    }
  }
}
