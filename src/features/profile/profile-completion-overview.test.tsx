import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileCompletionOverview } from "./profile-completion-overview";
import type { OwnMemberProfile } from "./own-profile";
import { calculateProfileCompletion } from "./completion";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status";

// Presentation tests never establish a session, call an action or access a DB.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/professional/actions", () => ({ submitProfileAction: vi.fn() }));

function profile(overrides: Partial<OwnMemberProfile> = {}): OwnMemberProfile {
  const fields = {
    displayName: "Synthetic member", location: null, bio: null, hasHeadshot: false,
    profession: null, industryName: null, yearsExperience: null, hasExperienceRows: false,
    skillNames: [], serviceNames: [], linkedinUrl: null, serviceArea: null,
    lookingForSummary: null, offeringSummary: null, opportunityPreferences: {},
    professionalSituation: "Entrepreneur / business owner", businessLinks: [],
  };
  return {
    ...fields, userId: "synthetic-user", profileId: "synthetic-profile",
    email: "synthetic@example.invalid", phone: null, profileImageStorageKey: null,
    profileStatus: "INCOMPLETE", verificationStatus: "PENDING", visibilityStatus: "PRIVATE",
    clarificationMessage: null, organisationName: null, industryId: null,
    completion: calculateProfileCompletion(fields), ...overrides,
  };
}

function html(overrides: Partial<OwnMemberProfile> = {}) {
  return renderToStaticMarkup(<ProfileCompletionOverview profile={profile(overrides)} />);
}

describe("profile overview presentation-only corrections", () => {
  it.each(["REGISTERED", "INCOMPLETE", "COMPLETE", "SUBMITTED"] as const)(
    "uses the existing profile label for %s", (status) => {
      expect(html({ profileStatus: status })).toContain(`Profile: ${presentProfileStatus(status).label}`);
    },
  );
  it.each(["PRIVATE", "MEMBERS_ONLY", "DIRECTORY"] as const)(
    "uses the existing independent visibility label for %s", (status) => {
      const rendered = html({ visibilityStatus: status });
      expect(rendered).toContain(`Directory visibility: ${presentVisibilityStatus(status).label}`);
      expect(rendered).toContain("Professional verification: Pending");
    },
  );
  it.each([
    "NOT_REVIEWED", "PENDING", "UNDER_REVIEW", "VERIFIED",
    "NEEDS_CLARIFICATION", "REJECTED",
  ] as const)("uses the existing verification label for %s", (status) => {
    expect(html({ verificationStatus: status })).toContain(
      `Professional verification: ${presentVerificationStatus(status).label}`,
    );
  });
  it("removes engineering jargon without implying headshot upload or automatic publication", () => {
    const rendered = html();
    expect(rendered).toContain("You do not need a headshot to complete your profile. Uploads are not available yet.");
    expect(rendered).toContain("Add your church team or department under Areas of service.");
    expect(rendered).toContain("Business verification is separate from your profile completion.");
    expect(rendered).toContain("It does not verify your profile or change directory visibility.");
    expect(rendered).not.toMatch(/Phase 2 schema|private upload UX|percentage formula/);
    expect(rendered).toContain('href="/profile/edit"');
    expect(rendered).toContain('href="/businesses"');
  });
  it.each(["PENDING", "UNDER_REVIEW", "VERIFIED"] as const)(
    "does not reintroduce raw %s in the complete-profile submission panel", (status) => {
      const data = profile();
      const rendered = html({
        verificationStatus: status, profileStatus: "COMPLETE",
        completion: { ...data.completion, percent: 100 },
      });
      expect(rendered).not.toContain(status);
      expect(rendered).toContain("Edit profile");
      if (status === "VERIFIED") {
        expect(rendered).toContain("Directory publication is a separate EXCO action.");
      } else {
        expect(rendered).toContain(`verification queue (${presentVerificationStatus(status).label})`);
      }
    },
  );
  it("preserves clarification/rejection guidance", () => {
    const rendered = html({ verificationStatus: "REJECTED", clarificationMessage: "Please clarify your profession." });
    expect(rendered).toContain("Verification rejected");
    expect(rendered).toContain("Please clarify your profession.");
    expect(html({ verificationStatus: "NEEDS_CLARIFICATION", clarificationMessage: "More detail needed." }))
      .toContain("Clarification requested");
  });
});
