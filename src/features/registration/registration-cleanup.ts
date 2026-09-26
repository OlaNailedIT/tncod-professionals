import "server-only";

import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const LEASE_MINUTES = 15;
const MAX_BATCH_SIZE = 10;
type CleanupClaim = { user_id: string; lease_token: string };

class CleanupInvariantError extends Error {}

function authUserAlreadyAbsent(error: { message?: string; code?: string; status?: number }): boolean {
  return (
    error.status === 404 ||
    error.code === "user_not_found" ||
    /not found|does not exist|user_not_found/i.test(error.message || "")
  );
}

async function recordCleanupFailure(
  userId: string,
  leaseToken: string,
  code:
    | "NON_DEACTIVATED_IDENTITY"
    | "AUTH_DELETE_FAILED"
    | "DOMAIN_CLEANUP_FAILED",
  manualReview = false,
): Promise<void> {
  const prisma = getPrisma();
  try {
    await prisma.$executeRaw`
      UPDATE app.registration_provisioning
      SET state = ${manualReview ? "MANUAL_REVIEW" : "PENDING"},
          last_error_code = ${code},
          updated_at = pg_catalog.clock_timestamp(),
          lease_token = NULL,
          lease_expires_at = NULL,
          next_attempt_at = pg_catalog.clock_timestamp()
            + pg_catalog.make_interval(
                secs => LEAST(86400, 60 * (2 ^ LEAST(attempt_count, 10)))::integer
              )
      WHERE user_id = ${userId}::uuid
        AND lease_token = ${leaseToken}::uuid
    `;
  } catch (error) {
    logger.error("registration_cleanup_retry_record_failed", {
      error_category: "cleanup_retry_record",
      message: error instanceof Error ? error.name : "unknown",
    });
  }
}

async function claimRegistrationCleanup(userId: string): Promise<CleanupClaim | null> {
  const prisma = getPrisma();
  const claims = await prisma.$queryRaw<CleanupClaim[]>`
    UPDATE app.registration_provisioning
    SET lease_token = gen_random_uuid(),
        lease_expires_at = pg_catalog.clock_timestamp()
          + pg_catalog.make_interval(mins => ${LEASE_MINUTES}),
        attempt_count = attempt_count + 1,
        updated_at = pg_catalog.clock_timestamp()
    WHERE user_id = ${userId}::uuid
      AND state = 'PENDING'
      AND (
        lease_token IS NULL
        OR lease_expires_at <= pg_catalog.clock_timestamp()
      )
    RETURNING user_id, lease_token
  `;
  return claims[0] ?? null;
}

async function ownsLiveLease(userId: string, leaseToken: string): Promise<boolean> {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ owned: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM app.registration_provisioning
      WHERE user_id = ${userId}::uuid
        AND state = 'PENDING'
        AND lease_token = ${leaseToken}::uuid
        AND lease_expires_at > pg_catalog.clock_timestamp()
    ) AS owned
  `;
  return rows[0]?.owned === true;
}

/**
 * Compensate one incomplete registration. The durable row is removed only after
 * both Auth and domain cleanup succeed. ACTIVE users are never touched.
 */
async function cleanupClaimedRegistration(claim: CleanupClaim): Promise<boolean> {
  const { user_id: userId, lease_token: leaseToken } = claim;
  const prisma = getPrisma();
  if (!(await ownsLiveLease(userId, leaseToken))) return false;

  const domainUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true },
  });
  if (domainUser && domainUser.accountStatus !== "DEACTIVATED") {
    await recordCleanupFailure(userId, leaseToken, "NON_DEACTIVATED_IDENTITY", true);
    logger.error("registration_cleanup_non_deactivated_identity_refused", {
      error_category: "cleanup_non_deactivated_identity",
    });
    return false;
  }

  if (!(await ownsLiveLease(userId, leaseToken))) return false;

  const admin = createServiceRoleClient();
  try {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
    });
    if (error && !authUserAlreadyAbsent(error)) {
      logger.warn("registration_cleanup_auth_ban_failed", {
        error_category: "auth_ban",
      });
    }
  } catch {
    logger.warn("registration_cleanup_auth_ban_failed", {
      error_category: "auth_ban",
    });
  }

  let authDeleted = false;
  try {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error || authUserAlreadyAbsent(error)) {
      authDeleted = true;
    }
  } catch {
    authDeleted = false;
  }

  if (!authDeleted) {
    await recordCleanupFailure(userId, leaseToken, "AUTH_DELETE_FAILED");
    logger.error("registration_auth_orphan_cleanup_failed", {
      error_category: "auth_orphan_cleanup",
    });
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const lease = await tx.$queryRaw<Array<{ user_id: string }>>`
        SELECT user_id
        FROM app.registration_provisioning
        WHERE user_id = ${userId}::uuid
          AND state = 'PENDING'
          AND lease_token = ${leaseToken}::uuid
          AND lease_expires_at > pg_catalog.clock_timestamp()
        FOR UPDATE
      `;
      if (lease.length !== 1) throw new CleanupInvariantError("Registration cleanup lease was lost");

      const users = await tx.$queryRaw<Array<{ account_status: string }>>`
        SELECT account_status::text
        FROM public.users
        WHERE id = ${userId}::uuid
        FOR UPDATE
      `;
      if (users[0] && users[0].account_status !== "DEACTIVATED") {
        throw new CleanupInvariantError("Registration identity is no longer DEACTIVATED");
      }

      // The registration transaction is atomic, so these rows normally do not
      // exist. Explicit deletion keeps retries safe if future provisioning adds
      // more pre-activation steps.
      await tx.profile.deleteMany({ where: { userId } });
      await tx.userRole.deleteMany({ where: { userId } });
      const deletedUser = await tx.user.deleteMany({
        where: { id: userId, accountStatus: "DEACTIVATED" },
      });
      if (deletedUser.count !== users.length) {
        throw new CleanupInvariantError("Registration user cleanup count changed");
      }
      const cleared = await tx.$executeRaw`
        DELETE FROM app.registration_provisioning
        WHERE user_id = ${userId}::uuid
          AND lease_token = ${leaseToken}::uuid
      `;
      if (cleared !== 1) throw new CleanupInvariantError("Registration cleanup lease was lost");
    });
    return true;
  } catch (error) {
    const invariantFailure = error instanceof CleanupInvariantError;
    await recordCleanupFailure(
      userId,
      leaseToken,
      invariantFailure ? "NON_DEACTIVATED_IDENTITY" : "DOMAIN_CLEANUP_FAILED",
      invariantFailure,
    );
    logger.error("registration_domain_orphan_cleanup_failed", {
      error_category: "domain_orphan_cleanup",
    });
    return false;
  }
}

export async function cleanupRegistrationIdentity(userId: string): Promise<boolean> {
  const claim = await claimRegistrationCleanup(userId);
  if (!claim) return false;
  return cleanupClaimedRegistration(claim);
}

export async function processRegistrationCleanupJobs(
  requestedLimit = MAX_BATCH_SIZE,
): Promise<{ claimed: number; completed: number; failed: number }> {
  const prisma = getPrisma();
  const limit = Math.max(1, Math.min(MAX_BATCH_SIZE, Math.trunc(requestedLimit)));
  const jobs = await prisma.$queryRaw<CleanupClaim[]>`
    WITH candidates AS (
      SELECT user_id
      FROM app.registration_provisioning
      WHERE next_attempt_at <= pg_catalog.clock_timestamp()
        AND state = 'PENDING'
        AND (
          lease_expires_at IS NULL
          OR lease_expires_at <= pg_catalog.clock_timestamp()
        )
      ORDER BY created_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE app.registration_provisioning AS jobs
    SET lease_token = gen_random_uuid(),
        lease_expires_at = pg_catalog.clock_timestamp()
          + pg_catalog.make_interval(mins => ${LEASE_MINUTES}),
        attempt_count = jobs.attempt_count + 1,
        updated_at = pg_catalog.clock_timestamp()
    FROM candidates
    WHERE jobs.user_id = candidates.user_id
    RETURNING jobs.user_id, jobs.lease_token
  `;

  let completed = 0;
  for (const job of jobs) {
    try {
      if (await cleanupClaimedRegistration(job)) completed += 1;
    } catch {
      logger.error("registration_cleanup_job_unexpected", {
        error_category: "cleanup_unexpected",
      });
    }
  }

  await prisma.$executeRaw`
    DELETE FROM app.registration_rate_limits
    WHERE window_started_at < pg_catalog.clock_timestamp() - INTERVAL '24 hours'
  `;

  return { claimed: jobs.length, completed, failed: jobs.length - completed };
}
