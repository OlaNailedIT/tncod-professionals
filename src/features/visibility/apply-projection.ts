import {
  VISIBILITY_GROUPS,
  preferenceAllowsPublicDirectory,
  type VisibilityGroupKey,
  type VisibilityPreferenceLevelValue,
} from "@/features/visibility/groups";
import type { PublicProfessional } from "@/security/projections";

function clearPublicField(next: PublicProfessional, field: string): void {
  if (field === "skillNames") {
    next.skillNames = [];
    return;
  }
  if (field === "serviceNames") {
    next.serviceNames = [];
    return;
  }
  if (field === "displayName") {
    next.displayName = "Member";
    return;
  }
  if (field === "headline") next.headline = null;
  else if (field === "professionalTitle") next.professionalTitle = null;
  else if (field === "profession") next.profession = null;
  else if (field === "industryName") next.industryName = null;
  else if (field === "location") next.location = null;
}

/**
 * Apply Phase 14 preferences to a Phase 13 PublicProfessional.
 * Preferences can only withhold; never add fields.
 */
export function applyVisibilityPreferencesToPublicProfessional(
  projected: PublicProfessional,
  prefs: Record<VisibilityGroupKey, VisibilityPreferenceLevelValue>,
): PublicProfessional {
  const next: PublicProfessional = {
    ...projected,
    skillNames: [...projected.skillNames],
    serviceNames: [...projected.serviceNames],
  };

  for (const group of VISIBILITY_GROUPS) {
    if (group.publicFields.length === 0) continue;
    if (preferenceAllowsPublicDirectory(prefs[group.key])) continue;
    for (const field of group.publicFields) {
      clearPublicField(next, field);
    }
  }

  return next;
}
