import "server-only";

import { createHash } from "node:crypto";
import { getPrisma } from "@/lib/prisma/client";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 8;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/** Atomic, shared throttling across all application instances. Raw client data
 * is never persisted; only a one-way digest reaches the database. */
export async function checkRegistrationRateLimit(key: string): Promise<RateLimitResult> {
  const digest = createHash("sha256").update(key || "unknown").digest("hex");
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{
    allowed: boolean;
    retry_after_seconds: number;
  }>>`
    SELECT allowed, retry_after_seconds
    FROM app.consume_registration_rate_limit(
      ${digest},
      ${MAX_ATTEMPTS}::integer,
      ${WINDOW_SECONDS}::integer
    )
  `;
  const result = rows[0];
  if (!result) throw new Error("Registration rate limiter returned no decision");
  return result.allowed
    ? { ok: true }
    : { ok: false, retryAfterSec: result.retry_after_seconds };
}
