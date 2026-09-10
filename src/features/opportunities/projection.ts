/**
 * Member-facing Opportunity projection — no creator contact, no interest lists.
 */
export type OpportunityListItem = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  summary: string;
  location: string | null;
  status: string;
  statusLabel: string;
  publishedAt: string | null;
  createdAt: string;
  interested: boolean;
};

export type OpportunityDetail = OpportunityListItem & {
  description: string;
};

export const OPPORTUNITY_FORBIDDEN_KEYS = [
  "email",
  "phone",
  "whatsapp",
  "createdById",
  "created_by",
  "profileId",
  "profile_id",
  "interests",
  "interestCount",
  "consent",
] as const;

export function assertOpportunityProjection(value: unknown): void {
  if (!value || typeof value !== "object") {
    throw new Error("Opportunity projection must be an object");
  }
  const obj = value as Record<string, unknown>;
  for (const key of OPPORTUNITY_FORBIDDEN_KEYS) {
    if (key in obj) {
      throw new Error(`Opportunity projection leaked forbidden field: ${key}`);
    }
  }
}

export function summarizeDescription(description: string, max = 180): string {
  const clean = description.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}
