import "server-only";

import type { VerificationStatus, VisibilityStatus, VisibilityPreferenceLevel } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { getAuthenticatedUser } from "@/server/auth/session";
import { getVisibilityGroup } from "@/features/visibility/groups";

type OwnListingState = {
  verificationStatus: VerificationStatus;
  visibilityStatus: VisibilityStatus;
  publicSlug: string | null;
  visibilityPreferences: Array<{ preference: VisibilityPreferenceLevel }>;
};

export type DirectorySelfStatus = {
  title: string;
  body: string;
  href: "/profile" | "/settings/privacy";
  linkLabel: string;
};

/** Own-state guidance only: never infers absence from a filtered results page. */
export function describeOwnDirectoryStatus(profile: OwnListingState | null): DirectorySelfStatus {
  if (!profile) {
    return {
      title: "We could not confirm your listing status",
      body: "Open your profile to check its status. Contact support if this continues.",
      href: "/profile",
      linkLabel: "Open your profile",
    };
  }
  if (profile.verificationStatus !== "VERIFIED") {
    return {
      title: "Your profile is not verified yet",
      body: "The directory shows verified, published profiles only. Open your profile to see your review status and any next steps. Completing or saving a profile does not verify or publish it.",
      href: "/profile",
      linkLabel: "Check your profile status",
    };
  }
  if (profile.visibilityStatus !== "DIRECTORY") {
    return {
      title: "Your verified profile is not published to the directory",
      body: "EXCO publication is a separate step. A Public directory privacy preference does not publish your profile by itself.",
      href: "/profile",
      linkLabel: "Open your profile",
    };
  }
  const identityPreference = profile.visibilityPreferences[0]?.preference
    ?? getVisibilityGroup("identity").defaultPreference;
  if (identityPreference !== "PUBLIC") {
    return {
      title: "Your identity privacy setting prevents a public listing",
      body: "Identity must allow Public directory exposure for a listing to appear. Review your privacy settings; if Identity is locked, ask EXCO to review publication before changing it.",
      href: "/settings/privacy",
      linkLabel: "Review privacy settings",
    };
  }
  if (!profile.publicSlug) {
    return {
      title: "Your public profile link is not ready",
      body: "Your profile is verified and marked for directory publication, but its public link is missing. Ask EXCO to review the listing; saving your profile will not create publication by itself.",
      href: "/profile",
      linkLabel: "Open your profile",
    };
  }
  return {
    title: "Your profile meets the directory listing requirements",
    body: "Your verified profile is published with public identity visibility and a public profile link. Filters or pagination may mean it is not shown on this page. Other displayed information still follows your privacy settings.",
    href: "/settings/privacy",
    linkLabel: "Review privacy settings",
  };
}

/** No caller-supplied ID: the server session is the only identity source. */
export async function loadDirectoryMemberContext(): Promise<{
  isMember: boolean;
  selfStatus: DirectorySelfStatus | null;
}> {
  const identity = await getAuthenticatedUser();
  if (!identity) return { isMember: false, selfStatus: null };
  const profile = await getPrisma().profile.findFirst({
    where: {
      userId: identity.userId,
      deletedAt: null,
      user: { is: { accountStatus: "ACTIVE", deletedAt: null } },
    },
    select: {
      verificationStatus: true,
      visibilityStatus: true,
      publicSlug: true,
      visibilityPreferences: {
        where: { groupKey: "identity" },
        select: { preference: true },
      },
    },
  });
  // Only human-readable guidance crosses the shell boundary, never the raw row.
  return { isMember: true, selfStatus: describeOwnDirectoryStatus(profile) };
}
