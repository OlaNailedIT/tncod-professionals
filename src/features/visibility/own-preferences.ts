import "server-only";

import type { VisibilityPreferenceLevel, VisibilityStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { rejectClientIdentity } from "@/server/auth/session";
import {
  VISIBILITY_GROUPS,
  defaultPreferenceMap,
  getVisibilityGroup,
  isLevelAllowedForGroup,
  type VisibilityGroupKey,
  type VisibilityPreferenceLevelValue,
} from "@/features/visibility/groups";
import { visibilityPreferenceUpsertSchema } from "@/features/visibility/schema";

export { applyVisibilityPreferencesToPublicProfessional } from "@/features/visibility/apply-projection";

export type VisibilityPreferenceRow = {
  groupKey: VisibilityGroupKey;
  preference: VisibilityPreferenceLevelValue;
  label: string;
  description: string;
  control: "member" | "fixed_private" | "system" | "deferred";
  allowedLevels: readonly VisibilityPreferenceLevelValue[];
  editable: boolean;
  /** When DIRECTORY, identity cannot leave Public (P14-21). */
  lockedReason?: string;
};

export type VisibilityPreferencesView = {
  profileId: string;
  visibilityStatus: VisibilityStatus;
  verificationStatus: string;
  preferences: VisibilityPreferenceRow[];
  systemControlledNotes: readonly string[];
};

function toLevel(value: VisibilityPreferenceLevel): VisibilityPreferenceLevelValue {
  return value as VisibilityPreferenceLevelValue;
}

async function requireOwnProfile(authUserId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: authUserId, deletedAt: null },
    select: {
      id: true,
      accountStatus: true,
      profile: {
        select: {
          id: true,
          visibilityStatus: true,
          verificationStatus: true,
          deletedAt: true,
          visibilityPreferences: {
            select: { groupKey: true, preference: true },
          },
        },
      },
    },
  });
  if (!user || user.accountStatus !== "ACTIVE") {
    throw new AppError("UNAUTHORIZED", "Active account required");
  }
  if (!user.profile || user.profile.deletedAt) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }
  return user.profile;
}

function mergePreferences(
  stored: Array<{ groupKey: string; preference: VisibilityPreferenceLevel }>,
): Record<VisibilityGroupKey, VisibilityPreferenceLevelValue> {
  const merged = defaultPreferenceMap();
  for (const row of stored) {
    const key = row.groupKey as VisibilityGroupKey;
    if (key in merged) {
      merged[key] = toLevel(row.preference);
    }
  }
  return merged;
}

export async function getMyVisibilityPreferences(
  authUserId: string,
): Promise<VisibilityPreferencesView> {
  rejectClientIdentity(authUserId);
  const profile = await requireOwnProfile(authUserId);
  const merged = mergePreferences(profile.visibilityPreferences);
  const directoryListed = profile.visibilityStatus === "DIRECTORY";

  const preferences: VisibilityPreferenceRow[] = VISIBILITY_GROUPS.map((g) => {
    const preference = merged[g.key];
    const identityLocked = directoryListed && g.key === "identity";
    const fixedPrivate = g.control === "fixed_private";
    return {
      groupKey: g.key,
      preference,
      label: g.label,
      description: g.description,
      control: g.control,
      allowedLevels: g.allowedLevels,
      editable: g.control === "member" && !identityLocked,
      lockedReason: identityLocked
        ? "While your profile is listed in the public directory, Identity must stay set to Public directory."
        : fixedPrivate
          ? "This information is always private."
          : undefined,
    };
  });

  return {
    profileId: profile.id,
    visibilityStatus: profile.visibilityStatus,
    verificationStatus: profile.verificationStatus,
    preferences,
    systemControlledNotes: [
      "Verification status",
      "Directory publication state",
      "Public profile address (slug)",
      "Documents and uploads",
      "Internal identifiers and audit records",
    ],
  };
}

export type UpsertVisibilityResult =
  | { ok: true; preferences: VisibilityPreferencesView }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function upsertMyVisibilityPreference(
  authUserId: string,
  raw: unknown,
): Promise<UpsertVisibilityResult> {
  rejectClientIdentity(authUserId);

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("profileId" in obj && obj.profileId != null) {
      return { ok: false, message: "Client-supplied profile identity is not authoritative." };
    }
    if ("userId" in obj && obj.userId != null) {
      return { ok: false, message: "Client-supplied user identity is not authoritative." };
    }
    if ("memberId" in obj && obj.memberId != null) {
      return { ok: false, message: "Client-supplied member identity is not authoritative." };
    }
  }

  const parsed = visibilityPreferenceUpsertSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "preference";
      fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      message: "That visibility setting is not allowed.",
      fieldErrors,
    };
  }

  const { groupKey, preference } = parsed.data;
  if (!isLevelAllowedForGroup(groupKey, preference)) {
    return { ok: false, message: "That visibility setting is not allowed for this information." };
  }

  const profile = await requireOwnProfile(authUserId);

  // P14-21: identity must remain PUBLIC while DIRECTORY
  if (
    profile.visibilityStatus === "DIRECTORY" &&
    groupKey === "identity" &&
    preference !== "PUBLIC"
  ) {
    return {
      ok: false,
      message:
        "While your profile is listed in the public directory, Identity must stay set to Public directory. Ask EXCO to unpublish first if you need to change this.",
    };
  }

  const group = getVisibilityGroup(groupKey);
  if (group.control === "fixed_private" && preference !== "PRIVATE") {
    return { ok: false, message: "Contact and community information must remain private." };
  }

  const prisma = getPrisma();
  await prisma.profileVisibilityPreference.upsert({
    where: {
      profileId_groupKey: { profileId: profile.id, groupKey },
    },
    create: {
      profileId: profile.id,
      groupKey,
      preference: preference as VisibilityPreferenceLevel,
    },
    update: {
      preference: preference as VisibilityPreferenceLevel,
    },
  });

  const preferences = await getMyVisibilityPreferences(authUserId);
  return { ok: true, preferences };
}

export async function upsertMyVisibilityPreferencesBatch(
  authUserId: string,
  raw: unknown,
): Promise<UpsertVisibilityResult> {
  rejectClientIdentity(authUserId);
  if (!raw || typeof raw !== "object" || !("updates" in raw)) {
    return { ok: false, message: "Invalid preference payload." };
  }
  const updates = (raw as { updates: unknown }).updates;
  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, message: "No preference updates provided." };
  }

  let last: UpsertVisibilityResult = { ok: false, message: "No updates applied." };
  for (const item of updates) {
    last = await upsertMyVisibilityPreference(authUserId, item);
    if (!last.ok) return last;
  }
  return last;
}

/** Load preference map for directory projection (privileged Prisma). Missing → defaults. */
export async function loadPreferenceMapForProfiles(
  profileIds: string[],
): Promise<Map<string, Record<VisibilityGroupKey, VisibilityPreferenceLevelValue>>> {
  const result = new Map<string, Record<VisibilityGroupKey, VisibilityPreferenceLevelValue>>();
  if (profileIds.length === 0) return result;

  const prisma = getPrisma();
  const rows = await prisma.profileVisibilityPreference.findMany({
    where: { profileId: { in: profileIds } },
    select: { profileId: true, groupKey: true, preference: true },
  });

  const byProfile = new Map<string, Array<{ groupKey: string; preference: VisibilityPreferenceLevel }>>();
  for (const id of profileIds) {
    byProfile.set(id, []);
  }
  for (const row of rows) {
    byProfile.get(row.profileId)?.push(row);
  }
  for (const [id, stored] of byProfile) {
    result.set(id, mergePreferences(stored));
  }
  return result;
}

/** Ensure identity is PUBLIC before publish (P14-21). Called from publishProfile. */
export async function ensureIdentityPublicForPublish(profileId: string): Promise<void> {
  const prisma = getPrisma();
  await prisma.profileVisibilityPreference.upsert({
    where: {
      profileId_groupKey: { profileId, groupKey: "identity" },
    },
    create: {
      profileId,
      groupKey: "identity",
      preference: "PUBLIC",
    },
    update: {
      preference: "PUBLIC",
    },
  });
}
