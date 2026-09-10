import { z } from "zod";

export const OPPORTUNITY_TYPES = [
  "JOBS",
  "BUSINESS",
  "COLLABORATION",
  "TRAINING",
  "MENTORSHIP",
  "OTHER",
] as const;

export type OpportunityTypeValue = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityTypeValue, string> = {
  JOBS: "Jobs",
  BUSINESS: "Business",
  COLLABORATION: "Collaboration",
  TRAINING: "Training",
  MENTORSHIP: "Mentorship",
  OTHER: "Other",
};

export const OPPORTUNITY_PAGE_SIZE = 25;

export const opportunityTypeSchema = z.enum(OPPORTUNITY_TYPES);

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "FREELANCE",
  "TEMPORARY",
  "OTHER",
] as const;

export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentTypeValue, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
  TEMPORARY: "Temporary",
  OTHER: "Other",
};

const optionalTrimmed = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const createOpportunitySchema = z.object({
  type: opportunityTypeSchema,
  title: z.string().trim().min(3, "Title is required").max(200),
  description: z.string().trim().min(10, "Description is required").max(5000),
  locationPreference: optionalTrimmed,
  /** Phase 17 — optional structured matching requirements */
  requiredProfession: optionalTrimmed,
  minYearsExperience: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v == null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).trim());
      if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
      return n;
    })
    .refine((v) => v == null || (v >= 0 && v <= 80), {
      message: "Minimum years must be between 0 and 80",
    }),
  employmentType: z
    .union([z.enum(EMPLOYMENT_TYPES), z.literal(""), z.null(), z.undefined()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  /** Comma-separated skill names resolved server-side to skill IDs. */
  requiredSkills: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v ?? ""),
  /** Ignored if present — server derives actor. */
  createdBy: z.unknown().optional(),
  createdById: z.unknown().optional(),
  role: z.unknown().optional(),
  isAdmin: z.unknown().optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export function opportunityStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Open";
    case "DRAFT":
      return "Draft";
    case "CLOSED":
      return "Closed";
    case "EXPIRED":
      return "Expired";
    default:
      return status;
  }
}

/** Plain-text sanitize for display — strip angle brackets / control chars. */
export function sanitizeOpportunityText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export type OpportunitiesQuery = {
  q: string;
  type: OpportunityTypeValue | "ALL";
  page: number;
};

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

export function parseOpportunitiesQuery(
  raw: Record<string, string | string[] | undefined>,
): OpportunitiesQuery {
  const pageRaw = Number.parseInt(one(raw.page) || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 10_000) : 1;
  const typeRaw = one(raw.type).toUpperCase();
  const type =
    typeRaw === "" || typeRaw === "ALL"
      ? "ALL"
      : opportunityTypeSchema.safeParse(typeRaw).success
        ? (typeRaw as OpportunityTypeValue)
        : "ALL";
  const q = one(raw.q).slice(0, 200);
  return { q, type, page };
}

export function opportunitiesQueryString(
  query: Partial<OpportunitiesQuery> & { page?: number },
): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.type && query.type !== "ALL") params.set("type", query.type.toLowerCase());
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
