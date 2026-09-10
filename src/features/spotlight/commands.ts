import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma/client";
import { PERMISSIONS } from "@/security/permissions";
import { requirePermission, loadPermissionKeys } from "@/server/authorization/require";
import { hasPermission } from "@/security/authorization";
import { writeAuditLog } from "@/server/audit/write-audit";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  evaluateProfileSpotlightEligibility,
  projectSpotlightProfessional,
  spotlightProfileInclude,
  type SpotlightProfileRow,
} from "@/features/spotlight/profile-mapper";
import type { SpotlightRecordProjection } from "@/features/spotlight/projection";

export type SpotlightCommandResult =
  | { ok: true; spotlightId: string }
  | { ok: false; code: string; message: string };

const createSchema = z.object({
  profileId: z.string().uuid(),
  // Client eligibility claims are ignored — accepted only so forged payloads do not break Zod.
  verified: z.unknown().optional(),
  profileComplete: z.unknown().optional(),
  headshotAvailable: z.unknown().optional(),
  spotlightInterest: z.unknown().optional(),
});

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function assertSpotlightManage(actorUserId: string): Promise<void> {
  await assertExcoDashboardAccess(actorUserId);
  await requirePermission(actorUserId, PERMISSIONS.SPOTLIGHT_MANAGE);
}

export async function canManageSpotlight(actorUserId: string): Promise<boolean> {
  await assertExcoDashboardAccess(actorUserId);
  const keys = await loadPermissionKeys(actorUserId);
  return hasPermission(keys, PERMISSIONS.SPOTLIGHT_MANAGE);
}

async function archiveIfIneligible(
  profile: SpotlightProfileRow,
  spotlightId: string,
  status: string,
): Promise<boolean> {
  const eligibility = evaluateProfileSpotlightEligibility(profile);
  if (eligibility.eligible) return false;
  if (status === "ARCHIVED") return false;

  const prisma = getPrisma();
  await prisma.spotlight.update({
    where: { id: spotlightId },
    data: { status: "ARCHIVED", publishedAt: null },
  });
  return true;
}

export async function createSpotlight(input: {
  actorUserId: string;
  profileId: string;
  /** Forged client claims — ignored. */
  verified?: unknown;
  profileComplete?: unknown;
  headshotAvailable?: unknown;
  spotlightInterest?: unknown;
}): Promise<SpotlightCommandResult> {
  await assertSpotlightManage(input.actorUserId);

  const parsed = createSchema.safeParse({
    profileId: input.profileId,
    verified: input.verified,
    profileComplete: input.profileComplete,
    headshotAvailable: input.headshotAvailable,
    spotlightInterest: input.spotlightInterest,
  });
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid profile id" };
  }

  const prisma = getPrisma();
  const profile = (await prisma.profile.findFirst({
    where: { id: parsed.data.profileId, deletedAt: null },
    include: spotlightProfileInclude,
  })) as SpotlightProfileRow | null;

  if (!profile) {
    return { ok: false, code: "PROFILE_NOT_FOUND", message: "Professional not found" };
  }

  const eligibility = evaluateProfileSpotlightEligibility(profile);
  if (!eligibility.eligible) {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message: "Professional does not meet Spotlight requirements",
    };
  }

  const existingActive = await prisma.spotlight.findFirst({
    where: { profileId: profile.id, status: { not: "ARCHIVED" } },
    select: { id: true },
  });
  if (existingActive) {
    return {
      ok: false,
      code: "ALREADY_SPOTLIGHTED",
      message: "This professional already has an active Spotlight",
    };
  }

  try {
    const created = await prisma.spotlight.create({
      data: {
        profileId: profile.id,
        title: profile.displayName,
        description: null,
        status: "DRAFT",
        createdById: input.actorUserId,
      },
      select: { id: true },
    });

    await writeAuditLog({
      actorId: input.actorUserId,
      action: "spotlight.create",
      entityType: "spotlight",
      entityId: created.id,
      metadata: { profileId: profile.id, status: "DRAFT" },
    });

    return { ok: true, spotlightId: created.id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "ALREADY_SPOTLIGHTED",
        message: "This professional already has an active Spotlight",
      };
    }
    throw error;
  }
}

export async function publishSpotlight(input: {
  actorUserId: string;
  spotlightId: string;
}): Promise<SpotlightCommandResult> {
  await assertSpotlightManage(input.actorUserId);
  const id = z.string().uuid().safeParse(input.spotlightId);
  if (!id.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid Spotlight id" };
  }

  const prisma = getPrisma();
  const row = await prisma.spotlight.findFirst({
    where: { id: id.data },
    include: { profile: { include: spotlightProfileInclude } },
  });
  if (!row) {
    return { ok: false, code: "NOT_FOUND", message: "Spotlight not found" };
  }
  if (row.status === "ARCHIVED") {
    return { ok: false, code: "INVALID_STATE", message: "Archived Spotlights cannot be published" };
  }
  if (row.status === "PUBLISHED") {
    return { ok: true, spotlightId: row.id };
  }

  const profile = row.profile as unknown as SpotlightProfileRow;
  const eligibility = evaluateProfileSpotlightEligibility(profile);
  if (!eligibility.eligible) {
    await prisma.spotlight.update({
      where: { id: row.id },
      data: { status: "ARCHIVED", publishedAt: null },
    });
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message: "Professional is no longer eligible — Spotlight archived",
    };
  }

  await prisma.spotlight.update({
    where: { id: row.id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "spotlight.publish",
    entityType: "spotlight",
    entityId: row.id,
    metadata: { profileId: row.profileId },
  });

  return { ok: true, spotlightId: row.id };
}

export async function archiveSpotlight(input: {
  actorUserId: string;
  spotlightId: string;
}): Promise<SpotlightCommandResult> {
  await assertSpotlightManage(input.actorUserId);
  const id = z.string().uuid().safeParse(input.spotlightId);
  if (!id.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid Spotlight id" };
  }

  const prisma = getPrisma();
  const row = await prisma.spotlight.findFirst({ where: { id: id.data } });
  if (!row) {
    return { ok: false, code: "NOT_FOUND", message: "Spotlight not found" };
  }
  if (row.status === "ARCHIVED") {
    return { ok: true, spotlightId: row.id };
  }

  await prisma.spotlight.update({
    where: { id: row.id },
    data: { status: "ARCHIVED", publishedAt: null },
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "spotlight.archive",
    entityType: "spotlight",
    entityId: row.id,
    metadata: { profileId: row.profileId },
  });

  return { ok: true, spotlightId: row.id };
}

export async function restoreSpotlight(input: {
  actorUserId: string;
  spotlightId: string;
}): Promise<SpotlightCommandResult> {
  await assertSpotlightManage(input.actorUserId);
  const id = z.string().uuid().safeParse(input.spotlightId);
  if (!id.success) {
    return { ok: false, code: "VALIDATION", message: "Invalid Spotlight id" };
  }

  const prisma = getPrisma();
  const row = await prisma.spotlight.findFirst({
    where: { id: id.data },
    include: { profile: { include: spotlightProfileInclude } },
  });
  if (!row) {
    return { ok: false, code: "NOT_FOUND", message: "Spotlight not found" };
  }
  if (row.status !== "ARCHIVED") {
    return { ok: false, code: "INVALID_STATE", message: "Only archived Spotlights can be restored" };
  }

  const profile = row.profile as unknown as SpotlightProfileRow;
  const eligibility = evaluateProfileSpotlightEligibility(profile);
  if (!eligibility.eligible) {
    return {
      ok: false,
      code: "NOT_ELIGIBLE",
      message: "Professional does not meet Spotlight requirements",
    };
  }

  const otherActive = await prisma.spotlight.findFirst({
    where: {
      profileId: row.profileId,
      status: { not: "ARCHIVED" },
      NOT: { id: row.id },
    },
    select: { id: true },
  });
  if (otherActive) {
    return {
      ok: false,
      code: "ALREADY_SPOTLIGHTED",
      message: "This professional already has an active Spotlight",
    };
  }

  try {
    await prisma.spotlight.update({
      where: { id: row.id },
      data: { status: "DRAFT", publishedAt: null },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "ALREADY_SPOTLIGHTED",
        message: "This professional already has an active Spotlight",
      };
    }
    throw error;
  }

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "spotlight.restore",
    entityType: "spotlight",
    entityId: row.id,
    metadata: { profileId: row.profileId },
  });

  return { ok: true, spotlightId: row.id };
}

export type SpotlightCandidate = {
  professional: ReturnType<typeof projectSpotlightProfessional>;
  alreadySpotlighted: boolean;
  activeSpotlightId: string | null;
  activeSpotlightStatus: string | null;
};

export async function listSpotlightCandidates(
  actorUserId: string,
  search?: string,
): Promise<SpotlightCandidate[]> {
  await assertExcoDashboardAccess(actorUserId);
  const prisma = getPrisma();

  const q = search?.trim() ?? "";
  const profiles = (await prisma.profile.findMany({
    where: {
      deletedAt: null,
      spotlightInterest: true,
      verificationStatus: "VERIFIED",
      profileImageStorageKey: { not: null },
      user: { accountStatus: "ACTIVE", deletedAt: null },
      ...(q
        ? {
            OR: [
              { displayName: { contains: q, mode: "insensitive" } },
              { professionalDetails: { profession: { contains: q, mode: "insensitive" } } },
              {
                professionalDetails: {
                  industry: { name: { contains: q, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      ...spotlightProfileInclude,
      spotlights: {
        where: { status: { not: "ARCHIVED" } },
        select: { id: true, status: true },
        take: 1,
      },
    },
    orderBy: { displayName: "asc" },
    take: 200,
  })) as Array<SpotlightProfileRow & { spotlights: Array<{ id: string; status: string }> }>;

  const out: SpotlightCandidate[] = [];
  for (const profile of profiles) {
    const eligibility = evaluateProfileSpotlightEligibility(profile);
    if (!eligibility.eligible) continue;
    const active = profile.spotlights[0] ?? null;
    out.push({
      professional: projectSpotlightProfessional(profile),
      alreadySpotlighted: Boolean(active),
      activeSpotlightId: active?.id ?? null,
      activeSpotlightStatus: active?.status ?? null,
    });
  }
  return out;
}

export async function listExistingSpotlights(
  actorUserId: string,
): Promise<SpotlightRecordProjection[]> {
  await assertExcoDashboardAccess(actorUserId);
  const prisma = getPrisma();

  const rows = await prisma.spotlight.findMany({
    include: { profile: { include: spotlightProfileInclude } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const results: SpotlightRecordProjection[] = [];
  for (const row of rows) {
    const profile = row.profile as unknown as SpotlightProfileRow;
    let status = row.status;
    if (status !== "ARCHIVED") {
      const archived = await archiveIfIneligible(profile, row.id, status);
      if (archived) status = "ARCHIVED";
    }
    const professional = projectSpotlightProfessional(profile);
    results.push({
      id: row.id,
      profileId: row.profileId,
      status,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdById: row.createdById,
      professional,
      currentlyEligible: professional.eligibility.eligible,
    });
  }
  return results;
}
