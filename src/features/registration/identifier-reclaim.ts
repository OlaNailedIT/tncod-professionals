import "server-only";

import type { AccountStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const TOMBSTONE_HOST = "tombstone.invalid";

export function reclaimTombstoneEmail(userId: string): string {
  const compact = userId.replace(/-/g, "").toLowerCase();
  return `reclaimed+${compact}@${TOMBSTONE_HOST}`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `${digits.slice(0, 3)}…${digits.slice(-2)} (len=${digits.length})`;
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedLocal = local.length <= 1 ? `${local}***` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

export type ReclaimRefuseReason =
  | "NOT_FOUND"
  | "NOT_SOFT_DELETED"
  | "ACCOUNT_ACTIVE"
  | "AUTH_STILL_PRESENT"
  | "PROFILE_STILL_ACTIVE"
  | "EMAIL_HELD_ELSEWHERE"
  | "PHONE_HELD_ELSEWHERE"
  | "ALREADY_RECLAIMED";

export type ReclaimPreflight = {
  userId: string;
  email_masked: string;
  phone_masked: string | null;
  deleted_at: string | null;
  account_status: AccountStatus;
  auth_exists: boolean;
  profile_active: boolean;
  role_count: number;
  proposed_email: string;
  proposed_phone: null;
  refuse: ReclaimRefuseReason | null;
  already_reclaimed: boolean;
};

async function authExists(userId: string): Promise<boolean> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("not found") || msg.includes("user not found")) return false;
    // Fail closed on unexpected Auth errors.
    throw error;
  }
  return Boolean(data?.user);
}

/**
 * Preflight for releasing email/phone on a soft-deleted, Auth-absent tombstone
 * so a later normal /join can reuse those identifiers.
 */
export async function preflightIdentifierReclaim(userId: string): Promise<ReclaimPreflight> {
  const prisma = getPrisma();
  const proposed = reclaimTombstoneEmail(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      deletedAt: true,
      accountStatus: true,
      profile: { select: { deletedAt: true } },
      userRoles: { select: { roleId: true } },
    },
  });

  if (!user) {
    return {
      userId,
      email_masked: "***",
      phone_masked: null,
      deleted_at: null,
      account_status: "DEACTIVATED",
      auth_exists: false,
      profile_active: false,
      role_count: 0,
      proposed_email: proposed,
      proposed_phone: null,
      refuse: "NOT_FOUND",
      already_reclaimed: false,
    };
  }

  const already = user.email.toLowerCase() === proposed;
  const auth = await authExists(userId);
  const profileActive = Boolean(user.profile && user.profile.deletedAt == null);

  let refuse: ReclaimRefuseReason | null = null;
  if (already) refuse = "ALREADY_RECLAIMED";
  else if (user.deletedAt == null) refuse = "NOT_SOFT_DELETED";
  else if (user.accountStatus === "ACTIVE") refuse = "ACCOUNT_ACTIVE";
  else if (auth) refuse = "AUTH_STILL_PRESENT";
  else if (profileActive) refuse = "PROFILE_STILL_ACTIVE";
  else {
    const emailElsewhere = await prisma.user.findFirst({
      where: { email: user.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (emailElsewhere) refuse = "EMAIL_HELD_ELSEWHERE";

    if (!refuse && user.phone) {
      const phoneElsewhere = await prisma.user.findFirst({
        where: { phone: user.phone, NOT: { id: userId } },
        select: { id: true },
      });
      if (phoneElsewhere) refuse = "PHONE_HELD_ELSEWHERE";
    }

    if (!refuse) {
      const tombstoneClash = await prisma.user.findFirst({
        where: { email: proposed, NOT: { id: userId } },
        select: { id: true },
      });
      if (tombstoneClash) refuse = "EMAIL_HELD_ELSEWHERE";
    }
  }

  return {
    userId: user.id,
    email_masked: maskEmail(user.email),
    phone_masked: maskPhone(user.phone),
    deleted_at: user.deletedAt?.toISOString() ?? null,
    account_status: user.accountStatus,
    auth_exists: auth,
    profile_active: profileActive,
    role_count: user.userRoles.length,
    proposed_email: proposed,
    proposed_phone: null,
    refuse,
    already_reclaimed: already,
  };
}

export type ReclaimApplyResult = {
  ok: boolean;
  mode: "dry-run" | "apply";
  preflight: ReclaimPreflight;
  changed: boolean;
  message: string;
};

/**
 * Dry-run by default. Apply only when apply=true after preflight allows it
 * (or reports ALREADY_RECLAIMED as idempotent success).
 */
export async function reclaimSoftDeletedIdentifiers(input: {
  userId: string;
  apply?: boolean;
}): Promise<ReclaimApplyResult> {
  const apply = Boolean(input.apply);
  const preflight = await preflightIdentifierReclaim(input.userId);

  if (preflight.refuse === "ALREADY_RECLAIMED") {
    return {
      ok: true,
      mode: apply ? "apply" : "dry-run",
      preflight,
      changed: false,
      message: "Identifiers already reclaimed (idempotent).",
    };
  }

  if (preflight.refuse) {
    return {
      ok: false,
      mode: apply ? "apply" : "dry-run",
      preflight,
      changed: false,
      message: `Refused: ${preflight.refuse}`,
    };
  }

  if (!apply) {
    return {
      ok: true,
      mode: "dry-run",
      preflight,
      changed: false,
      message: "Dry-run OK — would release email to tombstone and clear phone.",
    };
  }

  const prisma = getPrisma();
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      email: preflight.proposed_email,
      phone: null,
    },
  });

  const after = await preflightIdentifierReclaim(input.userId);
  const ok = after.already_reclaimed && after.phone_masked == null;
  return {
    ok,
    mode: "apply",
    preflight: after,
    changed: true,
    message: ok
      ? "Released email to tombstone and cleared phone."
      : "Apply wrote but post-check failed.",
  };
}
