/**
 * Phase 11 — EXCO professionals list query (URL state).
 * Locked definitions: docs/product/phase-11-exco-professionals-scope.md
 */

export const EXCO_PROFESSIONALS_PAGE_SIZE = 25;

export type ExcoProfessionalsSort =
  | "display_name_asc"
  | "display_name_desc"
  | "created_at_asc"
  | "created_at_desc"
  | "updated_at_asc"
  | "updated_at_desc"
  | "verification_status_asc"
  | "verification_status_desc";

export type CompletionFilter = "complete" | "incomplete" | "";

export type ExcoProfessionalsQuery = {
  q: string;
  verificationStatus: string;
  visibilityStatus: string;
  completion: CompletionFilter;
  profession: string;
  industryId: string;
  location: string;
  businessOwner: boolean;
  jobSeeker: boolean;
  verifiedProfessional: boolean;
  sort: ExcoProfessionalsSort;
  page: number;
};

const SORTS = new Set<ExcoProfessionalsSort>([
  "display_name_asc",
  "display_name_desc",
  "created_at_asc",
  "created_at_desc",
  "updated_at_asc",
  "updated_at_desc",
  "verification_status_asc",
  "verification_status_desc",
]);

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

function flag(value: string | string[] | undefined): boolean {
  const v = one(value).toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function parseExcoProfessionalsQuery(
  raw: Record<string, string | string[] | undefined>,
): ExcoProfessionalsQuery {
  const sortRaw = one(raw.sort) as ExcoProfessionalsSort;
  const sort = SORTS.has(sortRaw) ? sortRaw : "display_name_asc";
  const pageRaw = Number.parseInt(one(raw.page) || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const completionRaw = one(raw.completion);
  const completion: CompletionFilter =
    completionRaw === "complete" || completionRaw === "incomplete" ? completionRaw : "";

  return {
    q: one(raw.q),
    verificationStatus: one(raw.verification),
    visibilityStatus: one(raw.visibility),
    completion,
    profession: one(raw.profession),
    industryId: one(raw.industryId),
    location: one(raw.location),
    businessOwner: flag(raw.businessOwner),
    jobSeeker: flag(raw.jobSeeker),
    verifiedProfessional: flag(raw.verified),
    sort,
    page,
  };
}

export function canViewExcoContactFields(roles: readonly string[]): boolean {
  return roles.includes("EXCO_ADMIN") || roles.includes("SUPER_ADMIN");
}

/** Build href query string preserving only set filters. */
export function excoProfessionalsQueryString(
  query: Partial<ExcoProfessionalsQuery> & { page?: number },
): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.verificationStatus) params.set("verification", query.verificationStatus);
  if (query.visibilityStatus) params.set("visibility", query.visibilityStatus);
  if (query.completion) params.set("completion", query.completion);
  if (query.profession) params.set("profession", query.profession);
  if (query.industryId) params.set("industryId", query.industryId);
  if (query.location) params.set("location", query.location);
  if (query.businessOwner) params.set("businessOwner", "1");
  if (query.jobSeeker) params.set("jobSeeker", "1");
  if (query.verifiedProfessional) params.set("verified", "1");
  if (query.sort && query.sort !== "display_name_asc") params.set("sort", query.sort);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
