/**
 * Gate for opt-in disposable Auth/DB integration tests.
 * Fail closed unless PHASE4_DISPOSABLE_AUTH_TESTS=1 and endpoints are local-only.
 */
import { URL } from "node:url";

export const DISPOSABLE_AUTH_OPT_IN = "PHASE4_DISPOSABLE_AUTH_TESTS";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/** Hosted Supabase project refs that must never be targeted by disposable suites. */
const BLOCKED_HOST_SNIPPETS = [
  "supabase.co",
  "brpppukzqgpzxjelwwrj",
  "amazonaws.com",
  "pooler.supabase",
];

/** Local Supabase database from `supabase/config.toml`. Not inferred from a denylist. */
export const DISPOSABLE_DATABASE_PORT = "54322";

export type DisposableEnvCheck =
  | {
      ok: true;
      databaseUrl: string;
      supabaseUrl: string;
    }
  | { ok: false; reason: string };

export type DisposableDatabaseCheck =
  | { ok: true; databaseUrl: string }
  | { ok: false; reason: string };

function hostOf(raw: string, kind: "db" | "http"): string | null {
  try {
    if (kind === "db") {
      // postgresql://user:pass@host:port/db
      const u = new URL(raw.replace(/^postgresql:/i, "http:"));
      return (u.hostname || "").toLowerCase();
    }
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isBlockedHost(host: string): boolean {
  if (!LOCAL_HOSTS.has(host)) {
    // Non-loopback is blocked for this suite.
    return true;
  }
  return BLOCKED_HOST_SNIPPETS.some((s) => host.includes(s));
}

/**
 * Validate opt-in + local-only DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL
 * **before** opening Prisma or Auth clients.
 */
export function assertDisposableAuthEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): DisposableEnvCheck {
  if (env[DISPOSABLE_AUTH_OPT_IN] !== "1") {
    return {
      ok: false,
      reason: `${DISPOSABLE_AUTH_OPT_IN}=1 is required to run disposable Auth registration tests`,
    };
  }

  const databaseUrl = (env.DATABASE_URL || "").trim();
  const supabaseUrl = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!databaseUrl) {
    return { ok: false, reason: "DATABASE_URL is required (no implicit fallback)" };
  }
  if (!supabaseUrl) {
    return { ok: false, reason: "NEXT_PUBLIC_SUPABASE_URL is required (no implicit fallback)" };
  }
  if (!serviceKey) {
    return { ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY is required" };
  }

  const dbHost = hostOf(databaseUrl, "db");
  const authHost = hostOf(supabaseUrl, "http");
  if (!dbHost) return { ok: false, reason: "DATABASE_URL is not a parseable URL" };
  if (!authHost) return { ok: false, reason: "NEXT_PUBLIC_SUPABASE_URL is not a parseable URL" };

  if (isBlockedHost(dbHost) || !LOCAL_HOSTS.has(dbHost)) {
    return {
      ok: false,
      reason: `DATABASE_URL host "${dbHost}" is not a disposable loopback endpoint`,
    };
  }
  if (isBlockedHost(authHost) || !LOCAL_HOSTS.has(authHost)) {
    return {
      ok: false,
      reason: `NEXT_PUBLIC_SUPABASE_URL host "${authHost}" is not a disposable loopback endpoint`,
    };
  }

  // Reject Production project ref if it appears anywhere in the connection strings.
  const blob = `${databaseUrl}\n${supabaseUrl}`.toLowerCase();
  if (blob.includes("brpppukzqgpzxjelwwrj")) {
    return { ok: false, reason: "Production project ref detected — refused" };
  }

  return { ok: true, databaseUrl, supabaseUrl };
}

function databaseEndpoint(raw: string): { host: string; port: string } | null {
  try {
    const u = new URL(raw.replace(/^postgresql:/i, "http:"));
    const host = (u.hostname || "").toLowerCase();
    if (!host) return null;
    return { host, port: u.port };
  } catch {
    return null;
  }
}

/**
 * Fail closed before disposable database fixture writes.
 * Opt-in plus the loopback host and the established port are required.
 * A hosted name is refused because it is not loopback, not because it matches a denylist.
 */
export function assertDisposableDatabaseEnv(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): DisposableDatabaseCheck {
  if (env[DISPOSABLE_AUTH_OPT_IN] !== "1") {
    return {
      ok: false,
      reason: `${DISPOSABLE_AUTH_OPT_IN}=1 is required before disposable database fixture writes`,
    };
  }

  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    return { ok: false, reason: "DATABASE_URL is required (no implicit fallback)" };
  }

  const target = databaseEndpoint(databaseUrl);
  if (!target) return { ok: false, reason: "DATABASE_URL is not a parseable URL" };
  if (!LOCAL_HOSTS.has(target.host)) {
    return {
      ok: false,
      reason: `DATABASE_URL host "${target.host}" is not a disposable loopback endpoint`,
    };
  }
  if (target.port !== DISPOSABLE_DATABASE_PORT) {
    return {
      ok: false,
      reason: `DATABASE_URL port "${target.port || "missing"}" is not the established disposable database port ${DISPOSABLE_DATABASE_PORT}`,
    };
  }

  return { ok: true, databaseUrl };
}
