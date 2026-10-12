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

function normalizePathname(pathname: string): string | null {
  // Collapse "." / ".." so allowlist cannot be bypassed via /dashboard/../join
  const parts = pathname.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      if (stack.length === 0) return null;
      stack.pop();
      continue;
    }
    if (part.includes("\\")) return null;
    stack.push(part);
  }
  return `/${stack.join("/")}`;
}

export function sanitizeNextPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  let value = raw.trim();
  try {
    // Absolute URLs (e.g. Supabase RedirectTo): keep pathname+search only — never redirect off-site.
    if (/^https?:\/\//i.test(value)) {
      try {
        const u = new URL(value);
        value = `${u.pathname}${u.search}`;
      } catch {
        return fallback;
      }
    } else if (value.startsWith("//")) {
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

  const [pathPart, ...queryParts] = value.split("?");
  const pathOnly = normalizePathname(pathPart ?? "");
  if (!pathOnly) return fallback;

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => pathOnly === prefix || pathOnly.startsWith(`${prefix}/`),
  );
  if (!allowed) return fallback;

  const search = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";
  return `${pathOnly}${search}`;
}
