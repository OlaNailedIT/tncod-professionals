import { z } from "zod";
import {
  VISIBILITY_GROUP_KEYS,
  VISIBILITY_PREFERENCE_LEVELS,
  isLevelAllowedForGroup,
  type VisibilityGroupKey,
  type VisibilityPreferenceLevelValue,
} from "@/features/visibility/groups";

export const visibilityPreferenceUpsertSchema = z
  .object({
    groupKey: z.enum(VISIBILITY_GROUP_KEYS),
    preference: z.enum(VISIBILITY_PREFERENCE_LEVELS),
    /** Untrusted — ignored for authorization; rejected if present as authority claim. */
    profileId: z.undefined().optional(),
    userId: z.undefined().optional(),
    memberId: z.undefined().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isLevelAllowedForGroup(val.groupKey, val.preference)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Preference ${val.preference} is not allowed for group ${val.groupKey}.`,
        path: ["preference"],
      });
    }
  });

export type VisibilityPreferenceUpsertInput = z.infer<typeof visibilityPreferenceUpsertSchema>;

export const visibilityPreferenceBatchSchema = z
  .object({
    updates: z.array(visibilityPreferenceUpsertSchema).min(1).max(VISIBILITY_GROUP_KEYS.length),
    profileId: z.undefined().optional(),
    userId: z.undefined().optional(),
  })
  .strict();

export function parsePreferenceLevel(raw: unknown): VisibilityPreferenceLevelValue | null {
  if (typeof raw !== "string") return null;
  if ((VISIBILITY_PREFERENCE_LEVELS as readonly string[]).includes(raw)) {
    return raw as VisibilityPreferenceLevelValue;
  }
  return null;
}

export function parseGroupKey(raw: unknown): VisibilityGroupKey | null {
  if (typeof raw !== "string") return null;
  if ((VISIBILITY_GROUP_KEYS as readonly string[]).includes(raw)) {
    return raw as VisibilityGroupKey;
  }
  return null;
}
