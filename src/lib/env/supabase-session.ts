/** Server/Edge Auth configuration. Never import into browser components. */
function unwrap(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let result = value.trim();
  while (
    (result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))
  ) result = result.slice(1, -1);
  return result || undefined;
}

export function getSessionSupabaseConfig(): { url: string; key: string } | null {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY) {
    throw new Error("Browser-exposed privileged Supabase keys are forbidden");
  }
  const strict = unwrap(process.env.SUPABASE_AUTH_SERVER_ONLY) === "1";
  const publicKey = unwrap(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (strict && (publicKey || unwrap(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY))) {
    throw new Error("Server-only Auth forbids browser-exposed Supabase API keys");
  }
  const privateKey = unwrap(process.env.SUPABASE_PUBLISHABLE_KEY);
  const url = unwrap(process.env.SUPABASE_URL) ?? unwrap(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = privateKey ?? (strict ? undefined : publicKey);
  if (!url || !key) {
    if (strict) throw new Error("Server-only Supabase Auth configuration is incomplete");
    return null;
  }
  try {
    if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error();
  } catch { throw new Error("Supabase Auth URL must be a valid HTTP or HTTPS URL"); }
  if (privateKey && !privateKey.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY must be a low-privilege publishable key");
  }
  if (key.startsWith("sb_secret_")) throw new Error("Privileged keys are forbidden for session Auth");
  if (key.split(".").length === 3) {
    let role: unknown;
    try {
      const payload = key.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
      role = (JSON.parse(atob(payload)) as { role?: unknown }).role;
    } catch { /* Provider validates malformed legacy keys; never print their values. */ }
    if (role && role !== "anon") throw new Error("Privileged or user JWTs are forbidden as session API keys");
  }
  return { url, key };
}
