import "server-only";

import { createHash, randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import type { AccountStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { assertSecureSnapshotDirectory } from "@/features/registration/snapshot-acl";

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
  | "AUTH_EMAIL_STILL_PRESENT"
  | "AUTH_CHECK_FAILED"
  | "PROFILE_STILL_ACTIVE"
  | "EMAIL_HELD_ELSEWHERE"
  | "PHONE_HELD_ELSEWHERE"
  | "RECLAIM_INCOMPLETE"
  | "ALREADY_RECLAIMED"
  | "ROW_CHANGED"
  | "SNAPSHOT_REQUIRED"
  | "SNAPSHOT_MISMATCH"
  | "IDENTIFIERS_ALREADY_CLAIMED";

export type ReclaimPreflight = {
  userId: string;
  email_masked: string;
  phone_masked: string | null;
  deleted_at: string | null;
  account_status: AccountStatus;
  auth_exists_by_id: boolean;
  auth_exists_by_email: boolean;
  profile_active: boolean;
  role_count: number;
  proposed_email: string;
  proposed_phone: null;
  refuse: ReclaimRefuseReason | null;
  already_reclaimed: boolean;
  /** In-memory only — stripped from public reports. */
  _email?: string;
  _phone?: string | null;
};

export type ReclaimSnapshot = {
  version: 1;
  purpose: "phase4-identifier-reclaim";
  userId: string;
  email: string;
  phone: string | null;
  deleted_at: string | null;
  account_status: AccountStatus;
  profile_deleted_at: string | null;
  captured_at: string;
  integrity: string;
};

function snapshotIntegrity(s: Pick<ReclaimSnapshot, "userId" | "email" | "phone">): string {
  return createHash("sha256")
    .update(`${s.userId}\n${s.email}\n${s.phone ?? ""}`)
    .digest("hex");
}

type AuthProbe =
  | { ok: true; exists: boolean }
  | { ok: false; reason: "AUTH_CHECK_FAILED" };

/**
 * Probe auth.users by UUID. Prefer SQL over Auth Admin so the operator CLI
 * works with DATABASE_URL alone (Admin has no getUserByEmail anyway).
 */
async function authExistsById(userId: string): Promise<AuthProbe> {
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id
      FROM auth.users
      WHERE id = ${userId}::uuid
      LIMIT 1
    `;
    return { ok: true, exists: rows.length > 0 };
  } catch {
    return { ok: false, reason: "AUTH_CHECK_FAILED" };
  }
}

/** Exact match on auth.users.email. Fail closed if the query cannot run. */
async function authExistsByEmail(email: string): Promise<AuthProbe> {
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id
      FROM auth.users
      WHERE lower(email) = lower(${email})
      LIMIT 5
    `;
    return { ok: true, exists: rows.length > 0 };
  } catch {
    return { ok: false, reason: "AUTH_CHECK_FAILED" };
  }
}

type LockedUserRow = {
  id: string;
  email: string;
  phone: string | null;
  deleted_at: Date | null;
  account_status: AccountStatus;
  profile_active: boolean;
};

function evaluateSafety(input: {
  userId: string;
  email: string;
  phone: string | null;
  deletedAt: Date | null;
  accountStatus: AccountStatus;
  /** true when a profiles row exists with deleted_at IS NULL */
  profileActive: boolean;
  roleCount: number;
  authById: boolean;
  authByEmail: boolean;
  emailElsewhere: boolean;
  phoneElsewhere: boolean;
  tombstoneElsewhere: boolean;
}): ReclaimPreflight {
  const proposed = reclaimTombstoneEmail(input.userId);
  const alreadyTombstone = input.email.toLowerCase() === proposed.toLowerCase();

  let refuse: ReclaimRefuseReason | null = null;
  let already_reclaimed = false;

  if (alreadyTombstone) {
    // Tombstone email alone is not success — verify resting reclaim state.
    if (input.deletedAt == null) refuse = "NOT_SOFT_DELETED";
    else if (input.accountStatus === "ACTIVE") refuse = "ACCOUNT_ACTIVE";
    else if (input.authById) refuse = "AUTH_STILL_PRESENT";
    else if (input.profileActive) refuse = "PROFILE_STILL_ACTIVE";
    else if (input.phone) refuse = "RECLAIM_INCOMPLETE";
    else {
      already_reclaimed = true;
      refuse = "ALREADY_RECLAIMED";
    }
  } else if (input.deletedAt == null) {
    refuse = "NOT_SOFT_DELETED";
  } else if (input.accountStatus === "ACTIVE") {
    refuse = "ACCOUNT_ACTIVE";
  } else if (input.authById) {
    refuse = "AUTH_STILL_PRESENT";
  } else if (input.authByEmail) {
    refuse = "AUTH_EMAIL_STILL_PRESENT";
  } else if (input.profileActive) {
    refuse = "PROFILE_STILL_ACTIVE";
  } else if (input.emailElsewhere) {
    refuse = "EMAIL_HELD_ELSEWHERE";
  } else if (input.phoneElsewhere) {
    refuse = "PHONE_HELD_ELSEWHERE";
  } else if (input.tombstoneElsewhere) {
    refuse = "EMAIL_HELD_ELSEWHERE";
  }

  return {
    userId: input.userId,
    email_masked: maskEmail(input.email),
    phone_masked: maskPhone(input.phone),
    deleted_at: input.deletedAt?.toISOString() ?? null,
    account_status: input.accountStatus,
    auth_exists_by_id: input.authById,
    auth_exists_by_email: input.authByEmail,
    profile_active: input.profileActive,
    role_count: input.roleCount,
    proposed_email: proposed,
    proposed_phone: null,
    refuse,
    already_reclaimed,
    _email: input.email,
    _phone: input.phone,
  };
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
      auth_exists_by_id: false,
      auth_exists_by_email: false,
      profile_active: false,
      role_count: 0,
      proposed_email: proposed,
      proposed_phone: null,
      refuse: "NOT_FOUND",
      already_reclaimed: false,
    };
  }

  const alreadyTombstone = user.email.toLowerCase() === proposed.toLowerCase();
  const authByIdProbe = await authExistsById(userId);
  if (!authByIdProbe.ok) {
    return {
      userId: user.id,
      email_masked: maskEmail(user.email),
      phone_masked: maskPhone(user.phone),
      deleted_at: user.deletedAt?.toISOString() ?? null,
      account_status: user.accountStatus,
      auth_exists_by_id: false,
      auth_exists_by_email: false,
      profile_active: Boolean(user.profile && user.profile.deletedAt == null),
      role_count: user.userRoles.length,
      proposed_email: proposed,
      proposed_phone: null,
      refuse: "AUTH_CHECK_FAILED",
      already_reclaimed: false,
      _email: user.email,
      _phone: user.phone,
    };
  }
  let authByEmail = false;
  if (!alreadyTombstone) {
    const emailProbe = await authExistsByEmail(user.email);
    if (!emailProbe.ok) {
      return {
        userId: user.id,
        email_masked: maskEmail(user.email),
        phone_masked: maskPhone(user.phone),
        deleted_at: user.deletedAt?.toISOString() ?? null,
        account_status: user.accountStatus,
        auth_exists_by_id: authByIdProbe.exists,
        auth_exists_by_email: false,
        profile_active: Boolean(user.profile && user.profile.deletedAt == null),
        role_count: user.userRoles.length,
        proposed_email: proposed,
        proposed_phone: null,
        refuse: "AUTH_CHECK_FAILED",
        already_reclaimed: false,
        _email: user.email,
        _phone: user.phone,
      };
    }
    authByEmail = emailProbe.exists;
  }
  const authById = authByIdProbe.exists;
  const profileActive = Boolean(user.profile && user.profile.deletedAt == null);

  let emailElsewhere = false;
  let phoneElsewhere = false;
  let tombstoneElsewhere = false;

  if (!alreadyTombstone) {
    emailElsewhere = Boolean(
      await prisma.user.findFirst({
        where: { email: user.email, NOT: { id: userId } },
        select: { id: true },
      }),
    );
    if (user.phone) {
      phoneElsewhere = Boolean(
        await prisma.user.findFirst({
          where: { phone: user.phone, NOT: { id: userId } },
          select: { id: true },
        }),
      );
    }
    tombstoneElsewhere = Boolean(
      await prisma.user.findFirst({
        where: { email: proposed, NOT: { id: userId } },
        select: { id: true },
      }),
    );
  }

  return evaluateSafety({
    userId: user.id,
    email: user.email,
    phone: user.phone,
    deletedAt: user.deletedAt,
    accountStatus: user.accountStatus,
    profileActive,
    roleCount: user.userRoles.length,
    authById,
    authByEmail,
    emailElsewhere,
    phoneElsewhere,
    tombstoneElsewhere,
  });
}

/** Strip in-memory secrets before logging / writing masked reports. */
export function publicReclaimPreflight(preflight: ReclaimPreflight): ReclaimPreflight {
  const { _email: _e, _phone: _p, ...rest } = preflight;
  void _e;
  void _p;
  return rest;
}

/**
 * Write a full-PII snapshot. Requires an explicit directory outside the repo
 * with a verified private Windows ACL (or POSIX 0700). Never logs contents.
 */
export async function writeReclaimSnapshot(input: {
  userId: string;
  /** Absolute path outside the repository — required. */
  dir: string;
  repoRoot?: string;
}): Promise<{ path: string; preflight: ReclaimPreflight }> {
  if (!input.dir || !input.dir.trim()) {
    throw new Error("SNAPSHOT_DIR_REQUIRED");
  }
  const repoRoot = input.repoRoot ?? path.resolve(process.cwd());
  const acl = assertSecureSnapshotDirectory({ dir: input.dir, repoRoot });
  if (!acl.ok) {
    throw new Error(`${acl.reason}${acl.detail ? `: ${acl.detail}` : ""}`);
  }

  const preflight = await preflightIdentifierReclaim(input.userId);
  if (preflight.refuse && preflight.refuse !== "ALREADY_RECLAIMED") {
    throw new Error(`Cannot snapshot: ${preflight.refuse}`);
  }
  if (!preflight._email) {
    throw new Error("Cannot snapshot: email unavailable");
  }

  const snapshot: ReclaimSnapshot = {
    version: 1,
    purpose: "phase4-identifier-reclaim",
    userId: input.userId,
    email: preflight._email,
    phone: preflight._phone ?? null,
    deleted_at: preflight.deleted_at,
    account_status: preflight.account_status,
    profile_deleted_at: preflight.profile_active ? null : preflight.deleted_at,
    captured_at: new Date().toISOString(),
    integrity: "",
  };
  snapshot.integrity = snapshotIntegrity(snapshot);

  const token = randomBytes(8).toString("hex");
  const file = path.join(acl.resolved, `reclaim-${input.userId}-${token}.json`);
  // mode is best-effort on Windows; ACL on the parent directory is authoritative.
  fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return { path: file, preflight: publicReclaimPreflight(preflight) };
}

export function readReclaimSnapshot(filePath: string): ReclaimSnapshot {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as ReclaimSnapshot;
  if (raw.version !== 1 || raw.purpose !== "phase4-identifier-reclaim") {
    throw new Error("Invalid snapshot format");
  }
  if (snapshotIntegrity(raw) !== raw.integrity) {
    throw new Error("Snapshot integrity mismatch");
  }
  return raw;
}

export type ReclaimApplyResult = {
  ok: boolean;
  mode: "dry-run" | "apply" | "restore-dry-run" | "restore-apply";
  preflight: ReclaimPreflight;
  changed: boolean;
  message: string;
  snapshot_path?: string;
  would_change?: {
    userId: string;
    email_from_masked: string;
    email_to: string;
    phone_from_masked: string | null;
    phone_to: null | string;
  };
};

function assertSnapshotMatchesRow(
  snapshot: ReclaimSnapshot,
  preflight: ReclaimPreflight,
): ReclaimRefuseReason | null {
  if (snapshot.userId !== preflight.userId) return "SNAPSHOT_MISMATCH";
  if (!preflight._email) return "SNAPSHOT_MISMATCH";
  if (snapshot.email !== preflight._email) return "SNAPSHOT_MISMATCH";
  if ((snapshot.phone ?? null) !== (preflight._phone ?? null)) return "SNAPSHOT_MISMATCH";
  return null;
}

/**
 * Dry-run by default. Apply requires a matching snapshot and a guarded
 * FOR UPDATE write that expects exactly one updated row.
 */
export async function reclaimSoftDeletedIdentifiers(input: {
  userId: string;
  apply?: boolean;
  snapshotFile?: string;
}): Promise<ReclaimApplyResult> {
  const apply = Boolean(input.apply);
  const preflight = await preflightIdentifierReclaim(input.userId);
  const publicPre = publicReclaimPreflight(preflight);

  if (preflight.refuse === "ALREADY_RECLAIMED") {
    return {
      ok: true,
      mode: apply ? "apply" : "dry-run",
      preflight: publicPre,
      changed: false,
      message: "Identifiers already in safe reclaim resting state (idempotent).",
    };
  }

  if (preflight.refuse) {
    return {
      ok: false,
      mode: apply ? "apply" : "dry-run",
      preflight: publicPre,
      changed: false,
      message: `Refused: ${preflight.refuse}`,
    };
  }

  const would_change = {
    userId: input.userId,
    email_from_masked: preflight.email_masked,
    email_to: preflight.proposed_email,
    phone_from_masked: preflight.phone_masked,
    phone_to: null as null,
  };

  if (!apply) {
    return {
      ok: true,
      mode: "dry-run",
      preflight: publicPre,
      changed: false,
      message: "Dry-run OK — would release email to tombstone and clear phone.",
      would_change,
    };
  }

  if (!input.snapshotFile) {
    return {
      ok: false,
      mode: "apply",
      preflight: publicPre,
      changed: false,
      message: "Refused: SNAPSHOT_REQUIRED",
      would_change,
    };
  }

  let snapshot: ReclaimSnapshot;
  try {
    snapshot = readReclaimSnapshot(input.snapshotFile);
  } catch (e) {
    return {
      ok: false,
      mode: "apply",
      preflight: publicPre,
      changed: false,
      message: `Refused: SNAPSHOT_MISMATCH (${e instanceof Error ? e.message : "read failed"})`,
      would_change,
    };
  }

  const snapRefuse = assertSnapshotMatchesRow(snapshot, preflight);
  if (snapRefuse) {
    return {
      ok: false,
      mode: "apply",
      preflight: publicPre,
      changed: false,
      message: `Refused: ${snapRefuse}`,
      would_change,
    };
  }

  const prisma = getPrisma();
  const proposed = preflight.proposed_email;
  const expectedEmail = preflight._email!;
  const expectedPhone = preflight._phone ?? null;

  try {
    const updatedCount = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedUserRow[]>`
        SELECT
          u.id::text AS id,
          u.email,
          u.phone,
          u.deleted_at,
          u.account_status,
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = u.id AND p.deleted_at IS NULL
          ) AS profile_active
        FROM public.users u
        WHERE u.id = ${input.userId}::uuid
        FOR UPDATE OF u
      `;

      if (locked.length !== 1) {
        throw new Error("ROW_CHANGED");
      }
      const row = locked[0];

      if (row.email !== expectedEmail || (row.phone ?? null) !== expectedPhone) {
        throw new Error("ROW_CHANGED");
      }
      if (row.deleted_at == null) throw new Error("NOT_SOFT_DELETED");
      if (row.account_status === "ACTIVE") throw new Error("ACCOUNT_ACTIVE");
      if (row.profile_active) throw new Error("PROFILE_STILL_ACTIVE");

      const authById = await authExistsById(input.userId);
      if (!authById.ok) throw new Error("AUTH_CHECK_FAILED");
      if (authById.exists) throw new Error("AUTH_STILL_PRESENT");
      const authByEmail = await authExistsByEmail(expectedEmail);
      if (!authByEmail.ok) throw new Error("AUTH_CHECK_FAILED");
      if (authByEmail.exists) throw new Error("AUTH_EMAIL_STILL_PRESENT");

      const count = await tx.$executeRaw`
        UPDATE public.users
        SET
          email = ${proposed},
          phone = NULL,
          updated_at = now()
        WHERE id = ${input.userId}::uuid
          AND deleted_at IS NOT NULL
          AND account_status::text <> 'ACTIVE'
          AND email = ${expectedEmail}
          AND phone IS NOT DISTINCT FROM ${expectedPhone}
      `;

      if (count !== 1) {
        throw new Error("ROW_CHANGED");
      }
      return Number(count);
    });

    if (updatedCount !== 1) {
      return {
        ok: false,
        mode: "apply",
        preflight: publicPre,
        changed: false,
        message: "Refused: ROW_CHANGED (expected exactly one updated row)",
        snapshot_path: input.snapshotFile,
        would_change,
      };
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : "ROW_CHANGED";
    return {
      ok: false,
      mode: "apply",
      preflight: publicPre,
      changed: false,
      message: `Refused: ${reason}`,
      snapshot_path: input.snapshotFile,
      would_change,
    };
  }

  // Commit succeeded (exactly one row). Always report changed:true even if
  // post-check fails — otherwise recovery would be misled.
  let after: ReclaimPreflight;
  try {
    after = publicReclaimPreflight(await preflightIdentifierReclaim(input.userId));
  } catch (e) {
    return {
      ok: false,
      mode: "apply",
      preflight: publicPre,
      changed: true,
      message: `Apply committed but post-check threw (${e instanceof Error ? e.message : "error"}) — treat as changed.`,
      snapshot_path: input.snapshotFile,
      would_change,
    };
  }
  const ok = after.already_reclaimed && after.refuse === "ALREADY_RECLAIMED";
  return {
    ok,
    mode: "apply",
    preflight: after,
    changed: true,
    message: ok
      ? "Released email to tombstone and cleared phone (guarded update)."
      : "Apply committed but post-check failed — treat as changed; investigate before further mutation.",
    snapshot_path: input.snapshotFile,
    would_change,
  };
}

/**
 * Restore identifiers from a pre-apply snapshot.
 *
 * Point of no return: once a new Auth user or public.users row claims the
 * original email or phone, restore is refused (IDENTIFIERS_ALREADY_CLAIMED).
 * A masked dry-run report alone is not a rollback — only the snapshot file is.
 */
export async function restoreFromReclaimSnapshot(input: {
  snapshotFile: string;
  apply?: boolean;
}): Promise<ReclaimApplyResult> {
  const apply = Boolean(input.apply);
  const snapshot = readReclaimSnapshot(input.snapshotFile);
  const preflight = await preflightIdentifierReclaim(snapshot.userId);
  const publicPre = publicReclaimPreflight(preflight);
  const proposed = reclaimTombstoneEmail(snapshot.userId);

  const would_change = {
    userId: snapshot.userId,
    email_from_masked: preflight.email_masked,
    email_to: maskEmail(snapshot.email),
    phone_from_masked: preflight.phone_masked,
    phone_to: maskPhone(snapshot.phone) as string | null,
  };

  if (preflight.refuse === "NOT_FOUND") {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Refused: NOT_FOUND",
      snapshot_path: input.snapshotFile,
    };
  }

  const currentlyTombstone = preflight._email?.toLowerCase() === proposed.toLowerCase();
  const alreadyRestored =
    preflight._email === snapshot.email &&
    (preflight._phone ?? null) === (snapshot.phone ?? null);

  if (alreadyRestored) {
    return {
      ok: true,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Already restored from snapshot (idempotent).",
      snapshot_path: input.snapshotFile,
    };
  }

  if (!currentlyTombstone) {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Refused: SNAPSHOT_MISMATCH (row email is not the expected tombstone)",
      snapshot_path: input.snapshotFile,
    };
  }

  if (preflight.deleted_at == null || preflight.account_status === "ACTIVE") {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Refused: row is no longer a soft-deleted deactivated tombstone",
      snapshot_path: input.snapshotFile,
    };
  }

  if (preflight.auth_exists_by_id) {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Refused: AUTH_STILL_PRESENT",
      snapshot_path: input.snapshotFile,
    };
  }

  const restoreEmailAuth = await authExistsByEmail(snapshot.email);
  if (!restoreEmailAuth.ok) {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message: "Refused: AUTH_CHECK_FAILED",
      snapshot_path: input.snapshotFile,
    };
  }
  if (restoreEmailAuth.exists) {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message:
        "Refused: IDENTIFIERS_ALREADY_CLAIMED (Auth holds original email — point of no return)",
      snapshot_path: input.snapshotFile,
    };
  }

  const prisma = getPrisma();
  const emailClash = await prisma.user.findFirst({
    where: { email: snapshot.email, NOT: { id: snapshot.userId } },
    select: { id: true },
  });
  if (emailClash) {
    return {
      ok: false,
      mode: apply ? "restore-apply" : "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message:
        "Refused: IDENTIFIERS_ALREADY_CLAIMED (domain email held elsewhere — point of no return)",
      snapshot_path: input.snapshotFile,
    };
  }

  if (snapshot.phone) {
    const phoneClash = await prisma.user.findFirst({
      where: { phone: snapshot.phone, NOT: { id: snapshot.userId } },
      select: { id: true },
    });
    if (phoneClash) {
      return {
        ok: false,
        mode: apply ? "restore-apply" : "restore-dry-run",
        preflight: publicPre,
        changed: false,
        message:
          "Refused: IDENTIFIERS_ALREADY_CLAIMED (domain phone held elsewhere — point of no return)",
        snapshot_path: input.snapshotFile,
      };
    }
  }

  if (!apply) {
    return {
      ok: true,
      mode: "restore-dry-run",
      preflight: publicPre,
      changed: false,
      message:
        "Dry-run OK — would restore email/phone from snapshot. Point of no return: after a new account claims these identifiers.",
      snapshot_path: input.snapshotFile,
      would_change,
    };
  }

  try {
    const updatedCount = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedUserRow[]>`
        SELECT
          u.id::text AS id,
          u.email,
          u.phone,
          u.deleted_at,
          u.account_status,
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = u.id AND p.deleted_at IS NULL
          ) AS profile_active
        FROM public.users u
        WHERE u.id = ${snapshot.userId}::uuid
        FOR UPDATE OF u
      `;
      if (locked.length !== 1) throw new Error("ROW_CHANGED");
      const row = locked[0];
      if (row.email.toLowerCase() !== proposed.toLowerCase()) throw new Error("ROW_CHANGED");
      if (row.deleted_at == null || row.account_status === "ACTIVE") throw new Error("ROW_CHANGED");

      const byId = await authExistsById(snapshot.userId);
      if (!byId.ok) throw new Error("AUTH_CHECK_FAILED");
      if (byId.exists) throw new Error("AUTH_STILL_PRESENT");
      const byEmail = await authExistsByEmail(snapshot.email);
      if (!byEmail.ok) throw new Error("AUTH_CHECK_FAILED");
      if (byEmail.exists) throw new Error("IDENTIFIERS_ALREADY_CLAIMED");

      const count = await tx.$executeRaw`
        UPDATE public.users
        SET
          email = ${snapshot.email},
          phone = ${snapshot.phone},
          updated_at = now()
        WHERE id = ${snapshot.userId}::uuid
          AND deleted_at IS NOT NULL
          AND account_status::text <> 'ACTIVE'
          AND email = ${proposed}
      `;
      if (count !== 1) throw new Error("ROW_CHANGED");
      return Number(count);
    });

    if (updatedCount !== 1) {
      return {
        ok: false,
        mode: "restore-apply",
        preflight: publicPre,
        changed: false,
        message: "Refused: ROW_CHANGED",
        snapshot_path: input.snapshotFile,
      };
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : "ROW_CHANGED";
    return {
      ok: false,
      mode: "restore-apply",
      preflight: publicPre,
      changed: false,
      message: `Refused: ${reason}`,
      snapshot_path: input.snapshotFile,
    };
  }

  const after = publicReclaimPreflight(await preflightIdentifierReclaim(snapshot.userId));
  return {
    ok: true,
    mode: "restore-apply",
    preflight: after,
    changed: true,
    message: "Restored email/phone from snapshot (guarded).",
    snapshot_path: input.snapshotFile,
  };
}
