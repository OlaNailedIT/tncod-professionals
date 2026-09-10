import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { PERMISSIONS } from "@/security/permissions";
import { loadPermissionKeys } from "@/server/authorization/require";
import { hasPermission } from "@/security/authorization";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { writeAuditLog } from "@/server/audit/write-audit";
import { rejectClientIdentity } from "@/server/auth/session";
import {
  evaluateAllDimensions,
  isPotentialMatch,
  type OpportunityRequirements,
  type ProfessionalMatchInput,
} from "@/features/matching/rules";
import {
  assertMatchProjection,
  type PotentialMatchProjection,
} from "@/features/matching/projection";

export type FindMatchesResult =
  | {
      ok: true;
      opportunityId: string;
      opportunityStatus: string;
      criteriaConfigured: boolean;
      matches: PotentialMatchProjection[];
      insufficientCount: number;
      evaluatedCount: number;
    }
  | { ok: false; code: string; message: string };

/** EXCO actors with opportunity.view or manage may view potential matches. */
export async function canViewOpportunityMatches(actorUserId: string): Promise<boolean> {
  try {
    await assertExcoDashboardAccess(actorUserId);
  } catch {
    return false;
  }
  const keys = await loadPermissionKeys(actorUserId);
  return (
    hasPermission(keys, PERMISSIONS.OPPORTUNITY_VIEW) ||
    hasPermission(keys, PERMISSIONS.OPPORTUNITY_MANAGE)
  );
}

async function assertCanViewMatches(actorUserId: string): Promise<void> {
  await assertExcoDashboardAccess(actorUserId);
  if (!(await canViewOpportunityMatches(actorUserId))) {
    throw new AppError("UNAUTHORIZED", "Permission denied");
  }
}

function hasAnyRequirement(req: OpportunityRequirements): boolean {
  return Boolean(
    (req.requiredProfession && req.requiredProfession.trim()) ||
      (req.locationPreference && req.locationPreference.trim()) ||
      req.minYearsExperience != null ||
      req.employmentType ||
      req.requiredSkillIds.length > 0 ||
      (req.availability && req.availability.trim()),
  );
}

/**
 * Dynamic deterministic matching — no persisted match rows.
 * Eligibility: ACTIVE opportunity; VERIFIED + ACTIVE professionals only.
 * Client-supplied professional IDs are ignored.
 */
export async function findPotentialMatches(input: {
  actorUserId: string;
  opportunityId: string;
  /** Forged — ignored. */
  professionalId?: unknown;
  profileId?: unknown;
  userId?: unknown;
  role?: unknown;
}): Promise<FindMatchesResult> {
  rejectClientIdentity(input.actorUserId, typeof input.userId === "string" ? input.userId : null);
  await assertCanViewMatches(input.actorUserId);

  const prisma = getPrisma();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: input.opportunityId },
    include: {
      skills: { select: { skillId: true } },
    },
  });

  if (!opportunity) {
    return { ok: false, code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" };
  }

  if (opportunity.status !== "ACTIVE") {
    return {
      ok: false,
      code: "OPPORTUNITY_CLOSED",
      message: "Only ACTIVE opportunities can be matched",
    };
  }

  const requirements: OpportunityRequirements = {
    requiredProfession: opportunity.requiredProfession,
    locationPreference: opportunity.locationPreference,
    minYearsExperience: opportunity.minYearsExperience,
    employmentType: opportunity.employmentType,
    requiredSkillIds: opportunity.skills.map((s) => s.skillId),
    availability: opportunity.availability,
  };

  const criteriaConfigured = hasAnyRequirement(requirements);
  if (!criteriaConfigured) {
    await writeAuditLog({
      actorId: input.actorUserId,
      action: "opportunity.matches.view",
      entityType: "opportunity",
      entityId: opportunity.id,
      metadata: { matchCount: 0, reason: "no_criteria" },
    });
    return {
      ok: true,
      opportunityId: opportunity.id,
      opportunityStatus: opportunity.status,
      criteriaConfigured: false,
      matches: [],
      insufficientCount: 0,
      evaluatedCount: 0,
    };
  }

  // Candidate filter: verified active professionals only (EXCO operational trust boundary).
  const candidates = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      verificationStatus: "VERIFIED",
      user: { accountStatus: "ACTIVE", deletedAt: null },
    },
    select: {
      id: true,
      displayName: true,
      location: true,
      verificationStatus: true,
      professionalDetails: {
        select: {
          profession: true,
          yearsExperience: true,
        },
      },
      profileSkills: {
        where: { skill: { isActive: true } },
        select: {
          skillId: true,
          skill: { select: { name: true } },
        },
      },
      experiences: {
        where: { employmentType: { not: null } },
        select: { employmentType: true },
      },
    },
    take: 500,
    orderBy: { displayName: "asc" },
  });

  const matches: PotentialMatchProjection[] = [];
  let insufficientCount = 0;

  for (const candidate of candidates) {
    // Ignore any client-supplied professionalId filter — always evaluate authoritative set.
    const professional: ProfessionalMatchInput = {
      profileId: candidate.id,
      profession: candidate.professionalDetails?.profession ?? null,
      location: candidate.location,
      yearsExperience: candidate.professionalDetails?.yearsExperience ?? null,
      skillIds: candidate.profileSkills.map((ps) => ps.skillId),
      experienceEmploymentTypes: [
        ...new Set(
          candidate.experiences
            .map((e) => e.employmentType)
            .filter((t): t is NonNullable<typeof t> => Boolean(t)),
        ),
      ],
    };

    const dimensions = evaluateAllDimensions(requirements, professional);
    if (isPotentialMatch(dimensions)) {
      const projection: PotentialMatchProjection = {
        profileId: candidate.id,
        displayName: candidate.displayName,
        profession: candidate.professionalDetails?.profession ?? null,
        location: candidate.location,
        yearsExperience: candidate.professionalDetails?.yearsExperience ?? null,
        skillNames: candidate.profileSkills
          .map((ps) => ps.skill.name)
          .sort((a, b) => a.localeCompare(b)),
        verificationStatus: candidate.verificationStatus,
        outcome: "POTENTIAL_MATCH",
        dimensions,
      };
      assertMatchProjection(projection);
      matches.push(projection);
    } else if (dimensions.some((d) => d.status === "INSUFFICIENT_DATA")) {
      insufficientCount += 1;
    }
  }

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "opportunity.matches.view",
    entityType: "opportunity",
    entityId: opportunity.id,
    metadata: {
      matchCount: matches.length,
      evaluatedCount: candidates.length,
      insufficientCount,
    },
  });

  return {
    ok: true,
    opportunityId: opportunity.id,
    opportunityStatus: opportunity.status,
    criteriaConfigured: true,
    matches,
    insufficientCount,
    evaluatedCount: candidates.length,
  };
}
