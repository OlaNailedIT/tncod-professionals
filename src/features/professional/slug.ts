/**
 * Public slug minting for publication foundation (Phase 12).
 * Does not build /professionals routes.
 */

const RESERVED = new Set([
  "new",
  "search",
  "api",
  "exco",
  "admin",
  "professionals",
  "settings",
  "profile",
  "join",
  "sign-in",
  "dashboard",
  "businesses",
  "opportunities",
]);

export function slugifyPublicName(displayName: string): string {
  const base = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (!base || RESERVED.has(base)) {
    return "professional";
  }
  return base.slice(0, 80);
}

/** Deterministic collision: base, base-2, base-3, … */
export function nextSlugCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  return `${base}-${attempt}`;
}
