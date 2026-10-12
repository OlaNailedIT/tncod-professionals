/**
 * Phase 18A — Production target identity (non-secret) validation.
 */
import {
  EXPECTED_PRODUCTION_PROJECT_REF,
  PRODUCTION_PROJECT_REF_ENV_KEY,
} from "@/features/legacy-migration/constants";

export type TargetIdentityResult =
  | {
      ok: true;
      projectRef: string;
      environment: "production" | "local" | "unknown";
    }
  | { ok: false; code: string; message: string };

/**
 * Extract Supabase project ref from a URL when present (db.<ref>.supabase.co, pooler, https://<ref>.supabase.co).
 */
export function extractSupabaseProjectRef(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.includes("://") ? url : `postgresql://${url}`);
    const host = u.hostname.toLowerCase();
    const m =
      host.match(/^db\.([a-z0-9]+)\.supabase\.co$/) ||
      host.match(/^([a-z0-9]+)\.supabase\.co$/) ||
      host.match(/^aws-\d+-[a-z0-9.-]+\.pooler\.supabase\.com$/);
    if (m?.[1] && m[1] !== "aws") return m[1];
    // pooler user often postgres.<ref>
    const user = decodeURIComponent(u.username || "");
    const um = user.match(/^postgres\.([a-z0-9]+)$/i);
    if (um?.[1]) return um[1].toLowerCase();
    // pooler hostname may embed project in path options — also scan full string
    const scan = url.toLowerCase().match(/\b([a-z0-9]{20})\b/);
    if (scan && scan[1] === EXPECTED_PRODUCTION_PROJECT_REF) return scan[1];
    return null;
  } catch {
    const scan = url.toLowerCase();
    if (scan.includes(EXPECTED_PRODUCTION_PROJECT_REF)) {
      return EXPECTED_PRODUCTION_PROJECT_REF;
    }
    return null;
  }
}

export function assertProductionTargetIdentity(input: {
  projectRefEnv?: string | undefined;
  importDatabaseUrl?: string | undefined;
  importSupabaseUrl?: string | undefined;
  env?: Record<string, string | undefined>;
}): TargetIdentityResult {
  const env = input.env ?? process.env;
  const configured =
    input.projectRefEnv?.trim() ||
    env[PRODUCTION_PROJECT_REF_ENV_KEY]?.trim() ||
    EXPECTED_PRODUCTION_PROJECT_REF;

  if (configured !== EXPECTED_PRODUCTION_PROJECT_REF) {
    return {
      ok: false,
      code: "TARGET_REF_MISMATCH",
      message: `Configured project ref "${configured}" does not match expected Production ${EXPECTED_PRODUCTION_PROJECT_REF}`,
    };
  }

  const fromDb = extractSupabaseProjectRef(input.importDatabaseUrl);
  const fromApi = extractSupabaseProjectRef(input.importSupabaseUrl);

  if (input.importDatabaseUrl && fromDb && fromDb !== EXPECTED_PRODUCTION_PROJECT_REF) {
    return {
      ok: false,
      code: "TARGET_DB_REF_MISMATCH",
      message: "Import database URL project ref does not match expected Production ref",
    };
  }
  if (input.importSupabaseUrl && fromApi && fromApi !== EXPECTED_PRODUCTION_PROJECT_REF) {
    return {
      ok: false,
      code: "TARGET_API_REF_MISMATCH",
      message: "Import Supabase URL project ref does not match expected Production ref",
    };
  }

  // When URLs are provided, at least one must positively identify the ref.
  if (input.importDatabaseUrl || input.importSupabaseUrl) {
    const haystack = `${input.importDatabaseUrl ?? ""}\n${input.importSupabaseUrl ?? ""}`.toLowerCase();
    if (!haystack.includes(EXPECTED_PRODUCTION_PROJECT_REF)) {
      return {
        ok: false,
        code: "TARGET_REF_NOT_FOUND",
        message: "Cannot positively identify Production project ref in import URLs",
      };
    }
  }

  return {
    ok: true,
    projectRef: EXPECTED_PRODUCTION_PROJECT_REF,
    environment: "production",
  };
}
