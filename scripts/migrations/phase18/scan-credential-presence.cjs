/**
 * Presence-only credential scan. Never prints secret values.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const keys = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_PROJECT_REF",
  "DATABASE_URL",
  "DIRECT_URL",
  "PHASE18_PRODUCTION_DATABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function classify(name, value) {
  if (!value) return "ABSENT";
  const v = String(value).trim();
  if (!v) return "EMPTY";
  if (name.includes("URL") || name.includes("DATABASE")) {
    try {
      const u = new URL(v);
      return {
        status: "PRESENT",
        host: u.hostname,
        port: u.port || null,
        db: (u.pathname || "").replace(/^\//, "") || null,
      };
    } catch {
      return { status: "PRESENT", parse: "INVALID_URL_SHAPE" };
    }
  }
  return { status: "PRESENT", length: v.length };
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return { file: "ABSENT" };
  const text = fs.readFileSync(filePath, "utf8");
  const out = { file: "PRESENT" };
  for (const k of keys) {
    const m = text.match(new RegExp(`^${k}=(.*)$`, "m"));
    if (!m) {
      out[k] = "ABSENT";
      continue;
    }
    let raw = m[1].trim();
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1);
    }
    out[k] = classify(k, raw);
  }
  return out;
}

const tokenPath = path.join(os.homedir(), ".supabase", "access-token");
const processEnv = {};
for (const k of keys) processEnv[k] = classify(k, process.env[k] || "");

const report = {
  accessTokenFile: fs.existsSync(tokenPath) ? "PRESENT" : "ABSENT",
  processEnv,
  files: {
    ".env": scanFile(".env"),
    ".env.local": scanFile(".env.local"),
    ".env.production.local": scanFile(".env.production.local"),
    ".env.supabase": scanFile(".env.supabase"),
  },
};

console.log(JSON.stringify(report, null, 2));
