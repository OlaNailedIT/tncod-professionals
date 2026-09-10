/**
 * Safe internal redirects only. Rejects external URLs and protocol-relative paths.
 */

const ALLOWED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/businesses",
  "/opportunities",
  "/settings",
  "/exco",
] as const;

export function sanitizeNextPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  let value = raw.trim();
  try {
    // If a full URL was smuggled in, only keep pathname+search when same-origin intent fails.
    if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;

  // Strip hash
  value = value.split("#")[0] ?? value;

  const pathOnly = value.split("?")[0] ?? value;
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
  if (!allowed) return fallback;

  return value;
}
