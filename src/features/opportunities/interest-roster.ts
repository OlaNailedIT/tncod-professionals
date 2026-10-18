import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { ROLES, type AppRoleName } from "@/security/permissions";
import { loadRoleNames } from "@/server/authorization/require";
import { rejectClientIdentity } from "@/server/auth/session";

/**
 * Current expressed-interest roster.
 * EXCO_ADMIN and SUPER_ADMIN only. Not a potential-match list and not contact data.
 */

const ROSTER_ROLES: readonly AppRoleName[] = [ROLES.EXCO_ADMIN, ROLES.SUPER_ADMIN];

export type InterestRosterItem = {
  displayName: string;
  expressedAt: string;
  professionalHref: string;
};

export type InterestRosterResult =
  | {
      ok: true;
      opportunityId: string;
      opportunityStatus: string;
      items: InterestRosterItem[];
    }
  | { ok: false; code: "NOT_FOUND"; message: string };

export const INTEREST_ROSTER_KEYS = ["displayName", "expressedAt", "professionalHref"] as const;

export const INTEREST_ROSTER_FORBIDDEN_KEYS = [
  "email",
  "phone",
  "whatsapp",
  "userId",
  "user_id",
  "profileId",
  "profile_id",
  "bio",
  "headline",
  "location",
  "verificationStatus",
  "visibilityStatus",
  "profileStatus",
  "contact",
] as const;

export function assertInterestRosterItem(value: unknown): asserts value is InterestRosterItem {
  if (!value || typeof value !== "object") {
    throw new Error("Interest roster item must be an object");
  }
  const obj = value as Record<string, unknown>;
  for (const key of INTEREST_ROSTER_FORBIDDEN_KEYS) {
    if (key in obj) {
      throw new Error(`Interest roster leaked forbidden field: ${key}`);
    }
  }
  for (const key of Object.keys(obj)) {
    if (!(INTEREST_ROSTER_KEYS as readonly string[]).includes(key)) {
      throw new Error(`Interest roster leaked unexpected field: ${key}`);
    }
  }
  if (typeof obj.displayName !== "string" || obj.displayName.length === 0) {
    throw new Error("Interest roster display name is missing");
  }
  if (typeof obj.expressedAt !== "string" || Number.isNaN(Date.parse(obj.expressedAt))) {
    throw new Error("Interest roster timestamp is missing");
  }
  if (
    typeof obj.professionalHref !== "string" ||
    !obj.professionalHref.startsWith("/exco/professionals/")
  ) {
    throw new Error("Interest roster professional link is missing");
  }
}

export async function canViewInterestRoster(actorUserId: string): Promise<boolean> {
  if (!actorUserId) return false;
  const roles = await loadRoleNames(actorUserId);
  return roles.some((role) => ROSTER_ROLES.includes(role));
}

export async function listCurrentOpportunityInterest(input: {
  actorUserId: string;
  opportunityId: string;
  /** Forged identity claims — rejected. */
  userId?: unknown;
  role?: unknown;
  profileId?: unknown;
}): Promise<InterestRosterResult> {
  rejectClientIdentity(input.actorUserId, typeof input.userId === "string" ? input.userId : null);
  if (!(await canViewInterestRoster(input.actorUserId))) {
    throw new AppError("UNAUTHORIZED", "Permission denied");
  }

  const prisma = getPrisma();
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: input.opportunityId },
    select: { id: true, status: true },
  });
  if (!opportunity) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found" };
  }

  const rows = await prisma.opportunityInterest.findMany({
    where: {
      opportunityId: opportunity.id,
      profile: {
        deletedAt: null,
        user: { deletedAt: null, accountStatus: "ACTIVE" },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      createdAt: true,
      profile: { select: { id: true, displayName: true } },
    },
  });

  const items = rows.map((row) => {
    const item: InterestRosterItem = {
      displayName: row.profile.displayName,
      expressedAt: row.createdAt.toISOString(),
      professionalHref: `/exco/professionals/${row.profile.id}`,
    };
    assertInterestRosterItem(item);
    return item;
  });

  return {
    ok: true,
    opportunityId: opportunity.id,
    opportunityStatus: opportunity.status,
    items,
  };
}
