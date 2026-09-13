/**
 * Phase 20 — validated analytics query filters (allowlisted).
 */

import { PROFESSIONAL_SITUATIONS } from "@/features/registration/schema";
import type { VerificationStatus } from "@prisma/client";

const VERIFICATION_VALUES = [
  "NOT_REVIEWED",
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "NEEDS_CLARIFICATION",
  "REJECTED",
] as const satisfies readonly VerificationStatus[];

export type DirectoryEffectiveFilter = "published" | "not_published";

export type AnalyticsQuery = {
  situation: string | null;
  industry: string | null;
  verification: VerificationStatus | null;
  directoryEffective: DirectoryEffectiveFilter | null;
  /** Inclusive UTC days for new-registrations window only. Locked default 30. */
  registrationDays: number;
};

const SITUATION_SET = new Set<string>(PROFESSIONAL_SITUATIONS);

export function parseAnalyticsQuery(
  input: Record<string, string | string[] | undefined>,
): AnalyticsQuery {
  const one = (k: string): string | null => {
    const v = input[k];
    if (typeof v === "string") return v.trim() || null;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0]!.trim() || null;
    return null;
  };

  const situationRaw = one("situation");
  const situation =
    situationRaw && SITUATION_SET.has(situationRaw) ? situationRaw : null;

  const industryRaw = one("industry");
  // Industry names are free catalogue strings — length-bounded only; exact match against DB later.
  const industry =
    industryRaw && industryRaw.length <= 120 && !/[<>;]/.test(industryRaw)
      ? industryRaw
      : null;

  const verificationRaw = one("verification");
  const verification =
    verificationRaw &&
    (VERIFICATION_VALUES as readonly string[]).includes(verificationRaw)
      ? (verificationRaw as VerificationStatus)
      : null;

  const dirRaw = one("directory");
  const directoryEffective: DirectoryEffectiveFilter | null =
    dirRaw === "published" || dirRaw === "not_published" ? dirRaw : null;

  const daysRaw = one("days");
  let registrationDays = 30;
  if (daysRaw && /^\d{1,3}$/.test(daysRaw)) {
    const n = Number(daysRaw);
    if (n === 7 || n === 30 || n === 90) registrationDays = n;
  }

  return {
    situation,
    industry,
    verification,
    directoryEffective,
    registrationDays,
  };
}

export function analyticsQueryString(q: AnalyticsQuery): string {
  const p = new URLSearchParams();
  if (q.situation) p.set("situation", q.situation);
  if (q.industry) p.set("industry", q.industry);
  if (q.verification) p.set("verification", q.verification);
  if (q.directoryEffective) p.set("directory", q.directoryEffective);
  if (q.registrationDays !== 30) p.set("days", String(q.registrationDays));
  const s = p.toString();
  return s ? `?${s}` : "";
}
