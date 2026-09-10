import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { normalizePhone } from "@/features/registration/phone";
import { AppError } from "@/lib/errors";
import { rejectClientIdentity } from "@/server/auth/session";
import {
  buildOpportunityPreferencesPayload,
  parseCommaList,
  profileEditSchema,
  resolveIndustryId,
  slugifyTaxonomyName,
} from "@/features/profile/profile-edit-schema";
import {
  calculateProfileCompletion,
  isValidLinkedInUrl,
  normalizeOpportunityPreferences,
  toCompletionInput,
  type OpportunityPreferences,
  type ProfileCompletionResult,
} from "@/features/profile/completion";

export type OwnMemberBusinessLink = {
  businessId: string;
  name: string;
  relationshipType: string;
  industryName: string | null;
  description: string | null;
};

export type IndustryOption = {
  id: string;
  name: string;
};

export type OwnMemberProfile = {
  userId: string;
  profileId: string;
  email: string;
  phone: string | null;
  displayName: string;
  location: string | null;
  bio: string | null;
  hasHeadshot: boolean;
  profileImageStorageKey: string | null;
  professionalSituation: string | null;
  profileStatus: string;
  verificationStatus: string;
  visibilityStatus: string;
  clarificationMessage: string | null;
  profession: string | null;
  organisationName: string | null;
  industryId: string | null;
  industryName: string | null;
  yearsExperience: number | null;
  hasExperienceRows: boolean;
  skillNames: string[];
  serviceNames: string[];
  linkedinUrl: string | null;
  serviceArea: string | null;
  lookingForSummary: string | null;
  offeringSummary: string | null;
  opportunityPreferences: OpportunityPreferences;
  businessLinks: OwnMemberBusinessLink[];
  completion: ProfileCompletionResult;
};

export async function listActiveIndustries(): Promise<IndustryOption[]> {
  const prisma = getPrisma();
  const rows = await prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return rows;
}

export async function loadOwnMemberProfile(authUserId: string): Promise<OwnMemberProfile | null> {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: authUserId, deletedAt: null },
    include: {
      profile: {
        include: {
          professionalDetails: { include: { industry: { select: { name: true } } } },
          churchInformation: true,
          experiences: { select: { id: true }, take: 1 },
          profileSkills: { include: { skill: { select: { name: true } } } },
          profileServices: { include: { service: { select: { name: true } } } },
          businessLinks: {
            include: {
              business: {
                include: { industry: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.profile || user.profile.deletedAt) {
    return null;
  }

  const details = user.profile.professionalDetails;
  const skillNames = user.profile.profileSkills.map((ps) => ps.skill.name);
  const serviceNames = user.profile.profileServices.map((ps) => ps.service.name);
  const businessLinks: OwnMemberBusinessLink[] = user.profile.businessLinks
    .filter((link) => !link.business.deletedAt)
    .map((link) => ({
      businessId: link.businessId,
      name: link.business.name,
      relationshipType: link.relationshipType,
      industryName: link.business.industry?.name ?? null,
      description: link.business.description,
    }));
  const opportunityPreferences = normalizeOpportunityPreferences(details?.opportunityPreferences);

  const base = {
    displayName: user.profile.displayName,
    location: user.profile.location,
    bio: user.profile.bio,
    hasHeadshot: Boolean(user.profile.profileImageStorageKey),
    profession: details?.profession ?? null,
    industryName: details?.industry?.name ?? null,
    yearsExperience: details?.yearsExperience ?? null,
    hasExperienceRows: user.profile.experiences.length > 0,
    skillNames,
    serviceNames,
    linkedinUrl: details?.linkedinUrl ?? null,
    serviceArea: user.profile.churchInformation?.serviceArea ?? null,
    lookingForSummary: details?.lookingForSummary ?? null,
    offeringSummary: details?.offeringSummary ?? null,
    opportunityPreferences,
    professionalSituation: user.profile.professionalSituation,
    businessLinks: businessLinks.map((b) => ({
      name: b.name,
      industryName: b.industryName,
      description: b.description,
    })),
  };

  const completion = calculateProfileCompletion(toCompletionInput(base));

  return {
    userId: user.id,
    profileId: user.profile.id,
    email: user.email,
    phone: user.phone,
    displayName: user.profile.displayName,
    location: user.profile.location,
    bio: user.profile.bio,
    hasHeadshot: Boolean(user.profile.profileImageStorageKey),
    profileImageStorageKey: user.profile.profileImageStorageKey,
    professionalSituation: user.profile.professionalSituation,
    profileStatus: user.profile.profileStatus,
    verificationStatus: user.profile.verificationStatus,
    visibilityStatus: user.profile.visibilityStatus,
    clarificationMessage: user.profile.clarificationMessage,
    profession: details?.profession ?? null,
    organisationName: details?.organisationName ?? null,
    industryId: details?.industryId ?? null,
    industryName: details?.industry?.name ?? null,
    yearsExperience: details?.yearsExperience ?? null,
    hasExperienceRows: user.profile.experiences.length > 0,
    skillNames,
    serviceNames,
    linkedinUrl: details?.linkedinUrl ?? null,
    serviceArea: user.profile.churchInformation?.serviceArea ?? null,
    lookingForSummary: details?.lookingForSummary ?? null,
    offeringSummary: details?.offeringSummary ?? null,
    opportunityPreferences,
    businessLinks,
    completion,
  };
}

export async function loadMemberProfileForViewer(
  authUserId: string,
  claimedUserId?: string | null,
): Promise<OwnMemberProfile> {
  rejectClientIdentity(authUserId, claimedUserId);
  const profile = await loadOwnMemberProfile(authUserId);
  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }
  return profile;
}

async function syncTaxonomyLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma transaction client
  tx: any,
  profileId: string,
  kind: "skill" | "service",
  names: string[],
) {
  if (kind === "skill") {
    await tx.profileSkill.deleteMany({ where: { profileId } });
    for (const name of names) {
      const slug = slugifyTaxonomyName(name) || `skill-${Date.now()}`;
      const skill = await tx.skill.upsert({
        where: { name },
        create: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 7)}` },
        update: {},
      });
      await tx.profileSkill.create({
        data: { profileId, skillId: skill.id },
      });
    }
    return;
  }

  await tx.profileService.deleteMany({ where: { profileId } });
  for (const name of names) {
    const slug = slugifyTaxonomyName(name) || `service-${Date.now()}`;
    const service = await tx.service.upsert({
      where: { name },
      create: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 7)}` },
      update: {},
    });
    await tx.profileService.create({
      data: { profileId, serviceId: service.id },
    });
  }
}

export async function updateOwnMemberProfile(
  authUserId: string,
  raw: unknown,
): Promise<{ ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> }> {
  const parsed = profileEditSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  try {
    rejectClientIdentity(authUserId, parsed.data.claimedUserId);
  } catch {
    return { ok: false, message: "You can only update your own profile." };
  }

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: { phone: "Enter a valid phone or WhatsApp number." },
    };
  }

  const prisma = getPrisma();
  const existing = await loadOwnMemberProfile(authUserId);
  if (!existing) {
    return { ok: false, message: "Profile not found." };
  }

  const industryId = resolveIndustryId(parsed.data.industryId);
  if (industryId) {
    if (!/^[0-9a-f-]{36}$/i.test(industryId)) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: { industryId: "Select an industry." },
      };
    }
    const industry = await prisma.industry.findFirst({
      where: { id: industryId, isActive: true },
      select: { id: true },
    });
    if (!industry) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: { industryId: "Select a valid industry." },
      };
    }
  }

  const skillNames = parseCommaList(parsed.data.skills);
  const serviceNames = parseCommaList(parsed.data.services);
  const yearsRaw = parsed.data.yearsExperience?.trim() ?? "";
  let yearsExperience: number | null = null;
  if (yearsRaw.length > 0) {
    const n = Number(yearsRaw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 70) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: { yearsExperience: "Enter years of experience from 0 to 70." },
      };
    }
    yearsExperience = n;
  }
  const linkedinUrl = parsed.data.linkedinUrl?.trim() || null;
  if (linkedinUrl && !isValidLinkedInUrl(linkedinUrl)) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: { linkedinUrl: "Enter a valid LinkedIn profile URL." },
    };
  }
  const opportunityPreferences = buildOpportunityPreferencesPayload({
    collaboration: parsed.data.collaboration,
    mentorship: parsed.data.mentorship,
    referrals: parsed.data.referrals,
    training: parsed.data.training,
  });

  // Never touch verification, visibility, profile_status, or profile_image_storage_key.
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: authUserId },
      data: { phone },
    });
    await tx.profile.update({
      where: { id: existing.profileId },
      data: {
        displayName: parsed.data.displayName,
        professionalSituation: parsed.data.professionalSituation,
        location: parsed.data.location ?? null,
        bio: parsed.data.bio ?? null,
      },
    });
    await tx.professionalDetails.upsert({
      where: { profileId: existing.profileId },
      create: {
        profileId: existing.profileId,
        profession: parsed.data.profession,
        organisationName: parsed.data.organisation ?? null,
        industryId,
        yearsExperience,
        lookingForSummary: parsed.data.lookingFor,
        offeringSummary: parsed.data.offering,
        linkedinUrl,
        opportunityPreferences,
      },
      update: {
        profession: parsed.data.profession,
        organisationName: parsed.data.organisation ?? null,
        industryId,
        yearsExperience,
        lookingForSummary: parsed.data.lookingFor,
        offeringSummary: parsed.data.offering,
        linkedinUrl,
        opportunityPreferences,
      },
    });
    await tx.churchInformation.upsert({
      where: { profileId: existing.profileId },
      create: {
        profileId: existing.profileId,
        serviceArea: parsed.data.serviceArea ?? null,
      },
      update: {
        serviceArea: parsed.data.serviceArea ?? null,
      },
    });
    await syncTaxonomyLinks(tx, existing.profileId, "skill", skillNames);
    await syncTaxonomyLinks(tx, existing.profileId, "service", serviceNames);
  });

  return { ok: true };
}
