import "server-only";

import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { PERMISSIONS } from "@/security/permissions";
import { requirePermission, loadPermissionKeys } from "@/server/authorization/require";
import { hasPermission } from "@/security/authorization";
import { writeAuditLog } from "@/server/audit/write-audit";
import { rejectClientIdentity } from "@/server/auth/session";
import {
  createOpportunitySchema,
  OPPORTUNITY_PAGE_SIZE,
  OPPORTUNITY_TYPE_LABELS,
  opportunityStatusLabel,
  sanitizeOpportunityText,
  type OpportunitiesQuery,
  type OpportunityTypeValue,
} from "@/features/opportunities/schema";
import {
  assertOpportunityProjection,
  summarizeDescription,
  type OpportunityDetail,
  type OpportunityListItem,
} from "@/features/opportunities/projection";
import {
  parseCommaList,
  slugifyTaxonomyName,
} from "@/features/profile/profile-edit-schema";
import type { EmploymentType } from "@prisma/client";

export type OpportunityCommandResult =
  | { ok: true; opportunityId: string }
  | { ok: false; code: string; message: string };

export type InterestCommandResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function canManageOpportunities(actorUserId: string): Promise<boolean> {
  const keys = await loadPermissionKeys(actorUserId);
  return hasPermission(keys, PERMISSIONS.OPPORTUNITY_MANAGE);
}

async function assertOpportunityManage(actorUserId: string): Promise<void> {
  await requirePermission(actorUserId, PERMISSIONS.OPPORTUNITY_MANAGE);
}

function toListItem(
  row: {
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    status: string;
    locationPreference: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  },
  interested: boolean,
): OpportunityListItem {
  const title = sanitizeOpportunityText(row.title ?? "Untitled opportunity");
  const description = sanitizeOpportunityText(row.description ?? "");
  const item: OpportunityListItem = {
    id: row.id,
    type: row.type,
    typeLabel: OPPORTUNITY_TYPE_LABELS[row.type as OpportunityTypeValue] ?? row.type,
    title,
    summary: summarizeDescription(description),
    location: row.locationPreference ? sanitizeOpportunityText(row.locationPreference) : null,
    status: row.status,
    statusLabel: opportunityStatusLabel(row.status),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    interested,
  };
  assertOpportunityProjection(item);
  return item;
}

export async function createOpportunity(input: {
  actorUserId: string;
  raw: unknown;
}): Promise<OpportunityCommandResult> {
  await assertOpportunityManage(input.actorUserId);
  const parsed = createOpportunitySchema.safeParse(input.raw);
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION",
      message: parsed.error.issues[0]?.message ?? "Invalid opportunity",
    };
  }

  const title = sanitizeOpportunityText(parsed.data.title);
  const description = sanitizeOpportunityText(parsed.data.description);
  if (title.length < 3 || description.length < 10) {
    return { ok: false, code: "VALIDATION", message: "Title and description are required" };
  }

  const skillNames = parseCommaList(parsed.data.requiredSkills);
  const prisma = getPrisma();
  const now = new Date();

  const created = await prisma.$transaction(async (tx) => {
    const opportunity = await tx.opportunity.create({
      data: {
        createdById: input.actorUserId,
        profileId: null,
        type: parsed.data.type,
        title,
        description,
        locationPreference: parsed.data.locationPreference
          ? sanitizeOpportunityText(parsed.data.locationPreference)
          : null,
        requiredProfession: parsed.data.requiredProfession
          ? sanitizeOpportunityText(parsed.data.requiredProfession)
          : null,
        minYearsExperience: parsed.data.minYearsExperience,
        employmentType: (parsed.data.employmentType as EmploymentType | null) ?? null,
        status: "ACTIVE",
        publishedAt: now,
      },
      select: { id: true },
    });

    for (const name of skillNames) {
      const slug = slugifyTaxonomyName(name) || `skill-${Date.now()}`;
      const skill = await tx.skill.upsert({
        where: { name },
        create: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 7)}` },
        update: {},
      });
      await tx.opportunitySkill.create({
        data: { opportunityId: opportunity.id, skillId: skill.id },
      });
    }

    return opportunity;
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "opportunity.create",
    entityType: "opportunity",
    entityId: created.id,
    metadata: {
      type: parsed.data.type,
      status: "ACTIVE",
      matchingCriteria: Boolean(
        parsed.data.requiredProfession ||
          parsed.data.minYearsExperience != null ||
          parsed.data.employmentType ||
          skillNames.length > 0 ||
          parsed.data.locationPreference,
      ),
    },
  });

  return { ok: true, opportunityId: created.id };
}

export async function closeOpportunity(input: {
  actorUserId: string;
  opportunityId: string;
}): Promise<OpportunityCommandResult> {
  await assertOpportunityManage(input.actorUserId);
  const prisma = getPrisma();
  const row = await prisma.opportunity.findFirst({ where: { id: input.opportunityId } });
  if (!row) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found" };
  }
  if (row.status === "CLOSED") {
    return { ok: true, opportunityId: row.id };
  }

  await prisma.opportunity.update({
    where: { id: row.id },
    data: { status: "CLOSED" },
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "opportunity.close",
    entityType: "opportunity",
    entityId: row.id,
  });

  return { ok: true, opportunityId: row.id };
}

export async function listOpportunitiesForMember(
  actorUserId: string,
  query: OpportunitiesQuery,
): Promise<{ items: OpportunityListItem[]; total: number; page: number; pageSize: number }> {
  rejectClientIdentity(actorUserId);
  const prisma = getPrisma();
  const canManage = await canManageOpportunities(actorUserId);

  const where: Prisma.OpportunityWhereInput = {
    ...(canManage ? {} : { status: "ACTIVE" }),
    ...(query.type !== "ALL" ? { type: query.type } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows, profile] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (query.page - 1) * OPPORTUNITY_PAGE_SIZE,
      take: OPPORTUNITY_PAGE_SIZE,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        status: true,
        locationPreference: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.profile.findFirst({
      where: { userId: actorUserId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  const interestSet = new Set<string>();
  if (profile && rows.length > 0) {
    const interests = await prisma.opportunityInterest.findMany({
      where: {
        profileId: profile.id,
        opportunityId: { in: rows.map((r) => r.id) },
      },
      select: { opportunityId: true },
    });
    for (const i of interests) interestSet.add(i.opportunityId);
  }

  return {
    items: rows.map((r) => toListItem(r, interestSet.has(r.id))),
    total,
    page: query.page,
    pageSize: OPPORTUNITY_PAGE_SIZE,
  };
}

export async function getOpportunityForMember(
  actorUserId: string,
  opportunityId: string,
): Promise<OpportunityDetail | null> {
  rejectClientIdentity(actorUserId);
  const prisma = getPrisma();
  const canManage = await canManageOpportunities(actorUserId);

  const row = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      ...(canManage ? {} : { status: "ACTIVE" }),
    },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      status: true,
      locationPreference: true,
      publishedAt: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  const profile = await prisma.profile.findFirst({
    where: { userId: actorUserId, deletedAt: null },
    select: { id: true },
  });
  let interested = false;
  if (profile) {
    const hit = await prisma.opportunityInterest.findFirst({
      where: { profileId: profile.id, opportunityId: row.id },
      select: { id: true },
    });
    interested = Boolean(hit);
  }

  const base = toListItem(row, interested);
  const detail: OpportunityDetail = {
    ...base,
    description: sanitizeOpportunityText(row.description ?? ""),
  };
  assertOpportunityProjection(detail);
  return detail;
}

export async function expressInterest(input: {
  actorUserId: string;
  opportunityId: string;
  /** Forged identity claims — ignored. */
  profileId?: unknown;
  userId?: unknown;
  memberId?: unknown;
}): Promise<InterestCommandResult> {
  rejectClientIdentity(input.actorUserId, typeof input.userId === "string" ? input.userId : null);
  const prisma = getPrisma();

  const profile = await prisma.profile.findFirst({
    where: {
      userId: input.actorUserId,
      deletedAt: null,
      user: { accountStatus: "ACTIVE", deletedAt: null },
    },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }

  // Ignore forged profileId — always use session profile.
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: input.opportunityId },
    select: { id: true, status: true },
  });
  if (!opportunity || opportunity.status !== "ACTIVE") {
    return {
      ok: false,
      code: opportunity ? "CLOSED" : "NOT_FOUND",
      message: opportunity
        ? "This opportunity is no longer accepting interest."
        : "Opportunity not found",
    };
  }

  try {
    await prisma.opportunityInterest.create({
      data: {
        opportunityId: opportunity.id,
        profileId: profile.id,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: true };
    }
    throw error;
  }

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "opportunity.interest.create",
    entityType: "opportunity",
    entityId: opportunity.id,
    metadata: { profileId: profile.id },
  });

  return { ok: true };
}

export async function removeInterest(input: {
  actorUserId: string;
  opportunityId: string;
  profileId?: unknown;
  userId?: unknown;
}): Promise<InterestCommandResult> {
  rejectClientIdentity(input.actorUserId, typeof input.userId === "string" ? input.userId : null);
  const prisma = getPrisma();

  const profile = await prisma.profile.findFirst({
    where: { userId: input.actorUserId, deletedAt: null },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }

  const result = await prisma.opportunityInterest.deleteMany({
    where: {
      opportunityId: input.opportunityId,
      profileId: profile.id,
    },
  });

  if (result.count > 0) {
    await writeAuditLog({
      actorId: input.actorUserId,
      action: "opportunity.interest.remove",
      entityType: "opportunity",
      entityId: input.opportunityId,
      metadata: { profileId: profile.id },
    });
  }

  return { ok: true };
}
