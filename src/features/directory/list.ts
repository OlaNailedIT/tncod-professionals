import "server-only";

import type { Prisma, VisibilityPreferenceLevel } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { directoryListingAllowed } from "@/security/authorization";
import {
  assertPublicProfessionalShape,
  type PublicProfessional,
} from "@/security/projections";
import {
  DIRECTORY_PAGE_SIZE,
  type DirectoryQuery,
} from "@/features/directory/query";
import { applyVisibilityPreferencesToPublicProfessional } from "@/features/visibility/apply-projection";
import {
  defaultPreferenceMap,
  type VisibilityGroupKey,
  type VisibilityPreferenceLevelValue,
} from "@/features/visibility/groups";

function prefsFromRows(
  rows: Array<{ groupKey: string; preference: VisibilityPreferenceLevel }>,
): Record<VisibilityGroupKey, VisibilityPreferenceLevelValue> {
  const merged = defaultPreferenceMap();
  for (const row of rows) {
    const key = row.groupKey as VisibilityGroupKey;
    if (key in merged) {
      merged[key] = row.preference as VisibilityPreferenceLevelValue;
    }
  }
  return merged;
}

function mapRow(input: {
  publicSlug: string | null;
  displayName: string;
  headline: string | null;
  location: string | null;
  profession: string | null;
  professionalTitle: string | null;
  industryName: string | null;
  skillNames: string[];
  serviceNames: string[];
}): PublicProfessional | null {
  if (!input.publicSlug) return null;
  const projected: PublicProfessional = {
    publicSlug: input.publicSlug,
    displayName: input.displayName,
    headline: input.headline,
    location: input.location,
    profession: input.profession,
    professionalTitle: input.professionalTitle,
    industryName: input.industryName,
    skillNames: input.skillNames,
    serviceNames: input.serviceNames,
    verifiedBadge: true,
  };
  assertPublicProfessionalShape(projected);
  return projected;
}

function eligibilityWhere(): Prisma.ProfileWhereInput {
  return {
    deletedAt: null,
    verificationStatus: "VERIFIED",
    visibilityStatus: "DIRECTORY",
    publicSlug: { not: null },
  };
}

function buildWhere(query: DirectoryQuery): Prisma.ProfileWhereInput {
  const and: Prisma.ProfileWhereInput[] = [eligibilityWhere()];

  if (query.profession) {
    and.push({
      professionalDetails: {
        profession: { contains: query.profession, mode: "insensitive" },
      },
    });
  }
  if (query.industry) {
    and.push({
      professionalDetails: {
        industry: { name: { equals: query.industry, mode: "insensitive" } },
      },
    });
  }
  if (query.location) {
    and.push({
      location: { contains: query.location, mode: "insensitive" },
    });
  }
  if (query.service) {
    and.push({
      profileServices: {
        some: {
          service: {
            isActive: true,
            name: { contains: query.service, mode: "insensitive" },
          },
        },
      },
    });
  }
  if (query.q) {
    const q = query.q;
    and.push({
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { professionalDetails: { profession: { contains: q, mode: "insensitive" } } },
        {
          profileSkills: {
            some: { skill: { isActive: true, name: { contains: q, mode: "insensitive" } } },
          },
        },
        {
          profileServices: {
            some: {
              service: { isActive: true, name: { contains: q, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  return { AND: and };
}

const listInclude = {
  professionalDetails: {
    include: { industry: { select: { name: true, isActive: true } } },
  },
  profileSkills: {
    include: { skill: { select: { name: true, isActive: true } } },
  },
  profileServices: {
    include: { service: { select: { name: true, isActive: true } } },
  },
  visibilityPreferences: {
    select: { groupKey: true, preference: true },
  },
} as const;

function projectProfile(row: {
  publicSlug: string | null;
  displayName: string;
  headline: string | null;
  location: string | null;
  verificationStatus: string;
  visibilityStatus: string;
  professionalDetails: {
    profession: string | null;
    professionalTitle: string | null;
    industry: { name: string; isActive: boolean } | null;
  } | null;
  profileSkills: Array<{ skill: { name: string; isActive: boolean } }>;
  profileServices: Array<{ service: { name: string; isActive: boolean } }>;
}): PublicProfessional | null {
  if (
    !directoryListingAllowed(
      row.verificationStatus as "VERIFIED",
      row.visibilityStatus as "DIRECTORY",
    )
  ) {
    return null;
  }
  return mapRow({
    publicSlug: row.publicSlug,
    displayName: row.displayName,
    headline: row.headline,
    location: row.location,
    profession: row.professionalDetails?.profession ?? null,
    professionalTitle: row.professionalDetails?.professionalTitle ?? null,
    industryName:
      row.professionalDetails?.industry?.isActive === false
        ? null
        : (row.professionalDetails?.industry?.name ?? null),
    skillNames: row.profileSkills
      .filter((ps) => ps.skill.isActive)
      .map((ps) => ps.skill.name)
      .sort((a, b) => a.localeCompare(b)),
    serviceNames: row.profileServices
      .filter((ps) => ps.service.isActive)
      .map((ps) => ps.service.name)
      .sort((a, b) => a.localeCompare(b)),
  });
}

export type DirectoryListResult = {
  items: PublicProfessional[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/**
 * Authoritative directory list. Same projection for anonymous and members.
 * Privileged Prisma connection: eligibility + allowlist enforced here.
 */
export async function listDirectoryProfessionals(
  query: DirectoryQuery,
): Promise<DirectoryListResult> {
  const prisma = getPrisma();
  const where = buildWhere(query);
  const pageSize = DIRECTORY_PAGE_SIZE;
  const page = query.page;

  const total = await prisma.profile.count({ where });
  const pageCount = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);
  const skip = (safePage - 1) * pageSize;

  const rows = await prisma.profile.findMany({
    where,
    orderBy: { displayName: "asc" },
    skip,
    take: pageSize,
    include: listInclude,
  });

  const items: PublicProfessional[] = [];
  for (const row of rows) {
    const projected = projectProfile(row);
    if (!projected) continue;
    const prefs = prefsFromRows(row.visibilityPreferences);
    items.push(applyVisibilityPreferencesToPublicProfessional(projected, prefs));
  }

  return { items, total, page: safePage, pageSize, pageCount };
}

/**
 * Resolve public profile by slug. Ineligible → null (privacy-safe unavailable).
 */
export async function getDirectoryProfessionalBySlug(
  slug: string,
): Promise<PublicProfessional | null> {
  const normalized = slug.trim();
  if (!normalized) return null;

  const prisma = getPrisma();
  const row = await prisma.profile.findFirst({
    where: {
      publicSlug: normalized,
      deletedAt: null,
    },
    include: listInclude,
  });
  if (!row) return null;
  const projected = projectProfile(row);
  if (!projected) return null;
  const prefs = prefsFromRows(row.visibilityPreferences);
  return applyVisibilityPreferencesToPublicProfessional(projected, prefs);
}

export async function listDirectoryIndustryOptions(): Promise<string[]> {
  const prisma = getPrisma();
  const rows = await prisma.profile.findMany({
    where: eligibilityWhere(),
    select: {
      professionalDetails: {
        select: { industry: { select: { name: true, isActive: true } } },
      },
    },
  });
  const names = new Set<string>();
  for (const r of rows) {
    const n = r.professionalDetails?.industry;
    if (n?.isActive && n.name) names.add(n.name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export { DIRECTORY_PAGE_SIZE };
