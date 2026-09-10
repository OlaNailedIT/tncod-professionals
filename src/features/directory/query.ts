/**
 * Phase 13 — Directory list URL query (public/member same projection).
 */

export const DIRECTORY_PAGE_SIZE = 25;

export type DirectoryQuery = {
  q: string;
  profession: string;
  industry: string;
  location: string;
  service: string;
  page: number;
};

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

export function parseDirectoryQuery(
  raw: Record<string, string | string[] | undefined>,
): DirectoryQuery {
  const pageRaw = Number.parseInt(one(raw.page) || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return {
    q: one(raw.q),
    profession: one(raw.profession),
    industry: one(raw.industry),
    location: one(raw.location),
    service: one(raw.service),
    page,
  };
}

export function directoryQueryString(query: Partial<DirectoryQuery> & { page?: number }): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.profession) params.set("profession", query.profession);
  if (query.industry) params.set("industry", query.industry);
  if (query.location) params.set("location", query.location);
  if (query.service) params.set("service", query.service);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
