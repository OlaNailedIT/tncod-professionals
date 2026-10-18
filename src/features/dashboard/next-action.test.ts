import { describe, expect, it } from "vitest";
import {
  DASHBOARD_SECONDARY_LINKS,
  resolveMemberNextAction,
} from "@/features/dashboard/next-action";
import type { OwnMemberProfile } from "@/features/profile/own-profile";
import type { ProfileCompletionResult } from "@/features/profile/completion";
import type { VerificationStatus, VisibilityStatus } from "@prisma/client";

function makeProfile(
  overrides: Omit<Partial<OwnMemberProfile>, "completion"> = {},
  completionOverrides: Partial<ProfileCompletionResult> = {},
): OwnMemberProfile {
  const completion: ProfileCompletionResult = {
    percent: 40,
    businessApplicable: false,
    headshotDeferred: true,
    hasHeadshot: false,
    sections: [
      {
        id: "about",
        title: "About you",
        weight: 20,
        completedCount: 1,
        totalCount: 3,
        ratio: 1 / 3,
        fields: [],
      },
      {
        id: "professional",
        title: "Professional",
        weight: 30,
        completedCount: 2,
        totalCount: 2,
        ratio: 1,
        fields: [],
      },
    ],
    ...completionOverrides,
  };

  return {
    userId: "u1",
    profileId: "p1",
    email: "ada@example.com",
    phone: "+234",
    displayName: "Ada",
    location: null,
    bio: null,
    hasHeadshot: false,
    profileImageStorageKey: null,
    professionalSituation: "Employed",
    profileStatus: "INCOMPLETE",
    verificationStatus: "NOT_REVIEWED",
    visibilityStatus: "PRIVATE",
    clarificationMessage: null,
    profession: "Engineer",
    organisationName: null,
    industryId: null,
    industryName: null,
    yearsExperience: null,
    hasExperienceRows: false,
    skillNames: [],
    serviceNames: [],
    linkedinUrl: null,
    serviceArea: null,
    lookingForSummary: null,
    offeringSummary: null,
    opportunityPreferences: {},
    businessLinks: [],
    ...overrides,
    completion,
  };
}

const complete = {
  percent: 100,
  sections: [
    {
      id: "about",
      title: "About you",
      weight: 20,
      completedCount: 3,
      totalCount: 3,
      ratio: 1,
      fields: [],
    },
  ],
} satisfies Partial<ProfileCompletionResult>;

describe("resolveMemberNextAction", () => {
  it.each([
    {
      name: "missing profile",
      profile: null as OwnMemberProfile | null,
      title: /could not find your profile/i,
      href: "/profile",
      cta: "Open profile",
    },
    {
      name: "incomplete profile",
      profile: makeProfile(),
      title: /complete your profile/i,
      href: "/profile/edit",
      cta: "Continue profile",
      bodyIncludes: ["About you", "40%"],
    },
    {
      name: "complete and eligible to submit",
      profile: makeProfile(
        { profileStatus: "COMPLETE", verificationStatus: "NOT_REVIEWED" },
        complete,
      ),
      title: /ready to submit/i,
      href: "/profile",
      cta: "Review and submit",
    },
    {
      name: "submitted / awaiting review (PENDING)",
      profile: makeProfile(
        { profileStatus: "SUBMITTED", verificationStatus: "PENDING" },
        complete,
      ),
      title: "Your profile is awaiting review",
      href: "/opportunities",
      cta: "Explore opportunities",
      bodyIncludes: ["waiting for EXCO review"],
      bodyExcludes: ["under active review", "is reviewing"],
    },
    {
      name: "review underway (UNDER_REVIEW)",
      profile: makeProfile(
        { profileStatus: "SUBMITTED", verificationStatus: "UNDER_REVIEW" },
        complete,
      ),
      title: "EXCO is reviewing your profile",
      href: "/opportunities",
      cta: "Explore opportunities",
      bodyIncludes: ["under active review"],
      bodyExcludes: ["waiting for EXCO review"],
    },
    {
      name: "clarification requested",
      profile: makeProfile({
        verificationStatus: "NEEDS_CLARIFICATION",
        clarificationMessage: "Please clarify your profession.",
      }),
      title: /clarification/i,
      href: "/profile",
      cta: "Open profile",
      bodyIncludes: ["Please clarify your profession."],
    },
    {
      name: "rejected with correction path",
      profile: makeProfile({
        verificationStatus: "REJECTED",
        clarificationMessage: "Profession unclear.",
      }),
      title: /not approved/i,
      href: "/profile",
      cta: "Review and update",
      bodyIncludes: ["Profession unclear."],
    },
    {
      name: "verified but not published",
      profile: makeProfile(
        { verificationStatus: "VERIFIED", visibilityStatus: "MEMBERS_ONLY" },
        complete,
      ),
      title: /you are verified/i,
      href: "/opportunities",
      cta: "Explore opportunities",
      bodyIncludes: ["separate EXCO publication"],
      bodyExcludes: ["listed in the directory"],
    },
    {
      name: "published (VERIFIED + DIRECTORY does not prove effective listing)",
      profile: makeProfile(
        { verificationStatus: "VERIFIED", visibilityStatus: "DIRECTORY" },
        complete,
      ),
      title: "Your profile is published",
      href: "/professionals",
      cta: "Open directory",
      bodyIncludes: ["privacy preferences"],
      bodyExcludes: ["you are listed", "you will appear"],
    },
  ] as const)("$name", (row) => {
    const next = resolveMemberNextAction(row.profile);
    if (typeof row.title === "string") {
      expect(next.title).toBe(row.title);
    } else {
      expect(next.title).toMatch(row.title);
    }
    expect(next.href).toBe(row.href);
    expect(next.cta).toBe(row.cta);
    if ("bodyIncludes" in row && row.bodyIncludes) {
      for (const fragment of row.bodyIncludes) {
        expect(next.body).toContain(fragment);
      }
    }
    if ("bodyExcludes" in row && row.bodyExcludes) {
      for (const fragment of row.bodyExcludes) {
        expect(next.body.toLowerCase()).not.toContain(fragment.toLowerCase());
      }
    }
  });

  it("does not claim directory listing from a visibility preference alone", () => {
    const next = resolveMemberNextAction(
      makeProfile(
        {
          verificationStatus: "NOT_REVIEWED" as VerificationStatus,
          visibilityStatus: "DIRECTORY" as VisibilityStatus,
        },
        complete,
      ),
    );
    expect(next.title.toLowerCase()).not.toContain("listed");
    expect(next.href).toBe("/profile");
  });

  it("keeps PENDING wording distinct from UNDER_REVIEW", () => {
    const pending = resolveMemberNextAction(
      makeProfile({ verificationStatus: "PENDING" }, complete),
    );
    const reviewing = resolveMemberNextAction(
      makeProfile({ verificationStatus: "UNDER_REVIEW" }, complete),
    );
    expect(pending.title).not.toBe(reviewing.title);
    expect(pending.body).not.toBe(reviewing.body);
  });

  it("exposes only existing permitted secondary destinations", () => {
    expect(DASHBOARD_SECONDARY_LINKS.map((link) => link.href)).toEqual([
      "/opportunities",
      "/profile",
      "/settings/privacy",
    ]);
  });
});
