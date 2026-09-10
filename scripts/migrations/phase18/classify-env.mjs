import fs from "node:fs";

const env = fs.readFileSync(".env", "utf8");
const keys = [...env.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);
console.log("ENV_KEYS", keys.join(","));

function classify(name) {
  const m = env.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!m) return "ABSENT";
  let v = m[1].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  const u = v.toLowerCase();
  if (!u) return "EMPTY";
  if (u.includes("localhost") || u.includes("127.0.0.1") || u.includes(":54322")) {
    return "LOCAL_OR_DISPOSABLE";
  }
  if (
    u.includes("supabase.co") ||
    u.includes("pooler.supabase.com") ||
    u.includes("amazonaws.com")
  ) {
    return "HOSTED_LIKELY_PRODUCTION";
  }
  return "UNKNOWN_HOST";
}

for (const k of [
  "DATABASE_URL",
  "DIRECT_URL",
  "PHASE18_PRODUCTION_DATABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "PHASE18_IMPORT_DATABASE_URL",
  "PROD_DATABASE_URL",
  "DATABASE_URL_PRODUCTION",
  "SUPABASE_DB_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
]) {
  console.log(`${k}:${classify(k)}`);
}
