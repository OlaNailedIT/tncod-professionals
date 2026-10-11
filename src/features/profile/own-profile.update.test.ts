import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirstUser: vi.fn(),
  findFirstIndustry: vi.fn(),
  userUpdate: vi.fn(),
  profileUpdate: vi.fn(),
  professionalUpsert: vi.fn(),
  churchUpsert: vi.fn(),
  profileSkillDeleteMany: vi.fn(),
  profileSkillCreate: vi.fn(),
  skillUpsert: vi.fn(),
  profileServiceDeleteMany: vi.fn(),
  profileServiceCreate: vi.fn(),
  serviceUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma/client", () => ({
  getPrisma: () => ({
    user: { findFirst: mocks.findFirstUser, update: mocks.userUpdate },
    industry: { findFirst: mocks.findFirstIndustry },
    profile: { update: mocks.profileUpdate },
    professionalDetails: { upsert: mocks.professionalUpsert },
    churchInformation: { upsert: mocks.churchUpsert },
    profileSkill: {
      deleteMany: mocks.profileSkillDeleteMany,
      create: mocks.profileSkillCreate,
    },
    skill: { upsert: mocks.skillUpsert },
    profileService: {
      deleteMany: mocks.profileServiceDeleteMany,
      create: mocks.profileServiceCreate,
    },
    service: { upsert: mocks.serviceUpsert },
    $transaction: mocks.transaction,
  }),
}));

import { updateOwnMemberProfile } from "@/features/profile/own-profile";
import { profileEditSchema } from "@/features/profile/profile-edit-schema";

const AUTH_USER = "11111111-1111-1111-1111-111111111111";
const OTHER_USER = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";

function ownedLoad() {
  return {
    id: AUTH_USER,
    email: "member@example.com",
    phone: "+2348012345678",
    deletedAt: null,
    profile: {
      id: PROFILE_ID,
      displayName: "Ada",
      location: "Lagos",
      bio: "Builder",
      profileImageStorageKey: null,
      professionalSituation: "Employee",
      profileStatus: "REGISTERED",
      verificationStatus: "NOT_REVIEWED",
      visibilityStatus: "PRIVATE",
      clarificationMessage: null,
      professionalDetails: {
        profession: "Engineer",
        organisationName: "TNCOD",
        industryId: null,
        industry: null,
        yearsExperience: 3,
        lookingForSummary: "Peers",
        offeringSummary: "Mentorship",
        linkedinUrl: null,
        opportunityPreferences: {},
      },
      churchInformation: { serviceArea: "Youth" },
      experiences: [],
      profileSkills: [],
      profileServices: [],
      businessLinks: [],
    },
  };
}

const validBody = {
  displayName: "Ada Lovelace",
  phone: "+2348012345678",
  location: "Lagos",
  bio: "Engineer",
  professionalSituation: "Employee",
  profession: "Software engineer",
  organisation: "TNCOD",
  industryId: "none",
  yearsExperience: "4",
  skills: "TypeScript",
  services: "Mentoring",
  linkedinUrl: "",
  serviceArea: "Youth",
  lookingFor: "Collaboration",
  offering: "Mentorship",
  collaboration: "yes",
  mentorship: "no",
  referrals: "",
  training: "yes",
};

describe("Phase 8 updateOwnMemberProfile authorization and mass-assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirstUser.mockResolvedValue(ownedLoad());
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: { update: mocks.userUpdate },
        profile: { update: mocks.profileUpdate },
        professionalDetails: { upsert: mocks.professionalUpsert },
        churchInformation: { upsert: mocks.churchUpsert },
        profileSkill: {
          deleteMany: mocks.profileSkillDeleteMany,
          create: mocks.profileSkillCreate,
        },
        skill: { upsert: mocks.skillUpsert },
        profileService: {
          deleteMany: mocks.profileServiceDeleteMany,
          create: mocks.profileServiceCreate,
        },
        service: { upsert: mocks.serviceUpsert },
      };
      mocks.userUpdate.mockResolvedValue({});
      mocks.profileUpdate.mockResolvedValue({});
      mocks.professionalUpsert.mockResolvedValue({});
      mocks.churchUpsert.mockResolvedValue({});
      mocks.profileSkillDeleteMany.mockResolvedValue({});
      mocks.skillUpsert.mockResolvedValue({ id: "skill-1" });
      mocks.profileSkillCreate.mockResolvedValue({});
      mocks.profileServiceDeleteMany.mockResolvedValue({});
      mocks.serviceUpsert.mockResolvedValue({ id: "service-1" });
      mocks.profileServiceCreate.mockResolvedValue({});
      return fn(tx);
    });
  });

  it("rejects horizontal privilege escalation via claimedUserId", async () => {
    const result = await updateOwnMemberProfile(AUTH_USER, {
      ...validBody,
      claimedUserId: OTHER_USER,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/own profile/i);
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("strips verification, visibility, and profile_status from the edit schema", () => {
    const parsed = profileEditSchema.safeParse({
      ...validBody,
      verificationStatus: "VERIFIED",
      visibilityStatus: "DIRECTORY",
      profileStatus: "COMPLETE",
      profile_image_storage_key: "private/headshot.jpg",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty("verificationStatus");
    expect(parsed.data).not.toHaveProperty("visibilityStatus");
    expect(parsed.data).not.toHaveProperty("profileStatus");
    expect(parsed.data).not.toHaveProperty("profile_image_storage_key");
  });

  it("persists member fields without mutating status columns", async () => {
    const result = await updateOwnMemberProfile(AUTH_USER, {
      ...validBody,
      verificationStatus: "VERIFIED",
      visibilityStatus: "DIRECTORY",
      profileStatus: "COMPLETE",
    });
    expect(result).toEqual({ ok: true });

    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { id: PROFILE_ID },
      data: {
        displayName: "Ada Lovelace",
        professionalSituation: "Employee",
        location: "Lagos",
        bio: "Engineer",
      },
    });
    const profileData = mocks.profileUpdate.mock.calls[0]?.[0]?.data as Record<string, unknown>;
    expect(profileData).not.toHaveProperty("profileStatus");
    expect(profileData).not.toHaveProperty("verificationStatus");
    expect(profileData).not.toHaveProperty("visibilityStatus");
    expect(profileData).not.toHaveProperty("profileImageStorageKey");
  });

  it("rejects whitespace-only required fields", async () => {
    const result = await updateOwnMemberProfile(AUTH_USER, {
      ...validBody,
      displayName: "   ",
      profession: "\t",
    });
    expect(result.ok).toBe(false);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
