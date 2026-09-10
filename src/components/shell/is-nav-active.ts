/**
 * Active navigation matching (Phase 5.10).
 * Presentational only — does not grant access.
 */

/** Normalize pathname: strip query/hash; treat empty as `/`. */
export function normalizePathname(pathname: string): string {
  const bare = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (!bare || bare === "") return "/";
  return bare.length > 1 && bare.endsWith("/") ? bare.slice(0, -1) : bare;
}

/**
 * Whether `href` is the active destination for `pathname`.
 * Nested routes keep the parent active (e.g. /profile/edit → Profile;
 * /exco/professionals/[id] → Professionals). Exact match for `/` and `/exco`.
 */
export function isNavActive(pathname: string, href: string): boolean {
  const path = normalizePathname(pathname);
  const target = normalizePathname(href);

  if (target === "/") return path === "/";
  if (target === "/exco") return path === "/exco";

  if (path === target) return true;
  if (path.startsWith(`${target}/`)) return true;

  // /profile/edit keeps Profile active
  if (target === "/profile" && path.startsWith("/profile/")) return true;

  return false;
}
