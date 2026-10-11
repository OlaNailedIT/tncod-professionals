/**
 * Fail-closed gate for Phase 6R disposable directory privacy tests.
 * Must run before any Prisma query or fixture mutation. Never logs credentials.
 */

export const PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN = "PHASE6R_DISPOSABLE_DIRECTORY_TESTS";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"]);
const BLOCKED_SNIPPETS = [
  "supabase.co",
  "brpppukzqgpzxjelwwrj",
  "amazonaws.com",
  "pooler.supabase",
];

export type DisposableDirectoryEnvCheck =
  | { ok: true; host: string; port: number; database: string }
  | { ok: false; reason: string };

function parseDatabaseUrl(raw: string): { host: string; port: number; database: string } | null {
  try {
    const u = new URL(raw.replace(/^postgresql:/i, "http:"));
    const host = (u.hostname || "").toLowerCase();
    const port = u.port ? Number.parseInt(u.port, 10) : 5432;
    const database = decodeURIComponent((u.pathname || "/").replace(/^\//, "") || "postgres");
    if (!host || !Number.isFinite(port)) return null;
    return { host, port, database };
  } catch {
    return null;
  }
}

/**
 * Verify deliberate opt-in + loopback DATABASE_URL on port 54322.
 * Does not open a database connection and does not echo secrets.
 */
export function assertDisposableDirectoryTestEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): DisposableDirectoryEnvCheck {
  if (env[PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN] !== "1") {
    return {
      ok: false,
      reason: `${PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN}=1 is required before disposable directory privacy tests may run`,
    };
  }

  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return { ok: false, reason: "DATABASE_URL is required (no implicit fallback)" };
  }

  const lower = databaseUrl.toLowerCase();
  for (const snippet of BLOCKED_SNIPPETS) {
    if (lower.includes(snippet)) {
      return {
        ok: false,
        reason: "DATABASE_URL matches a blocked non-disposable host/project marker",
      };
    }
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed) {
    return { ok: false, reason: "DATABASE_URL is not a parseable PostgreSQL URL" };
  }

  if (!LOOPBACK.has(parsed.host)) {
    return {
      ok: false,
      reason: `DATABASE_URL host must be loopback (got non-loopback host)`,
    };
  }

  if (parsed.port !== 54322) {
    return {
      ok: false,
      reason: `DATABASE_URL port must be 54322 for the disposable Supabase database (got ${parsed.port})`,
    };
  }

  return {
    ok: true,
    host: parsed.host,
    port: parsed.port,
    database: parsed.database,
  };
}
