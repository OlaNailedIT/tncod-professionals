/**
 * Phase 18 — fail-closed production credential presence check.
 * Never prints secret values — only ABSENT / PRESENT + host classification.
 */
import fs from "node:fs";

const files = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
  ".env.prod",
];

const urlKeys = [
  "PHASE18_PRODUCTION_DATABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "PHASE18_IMPORT_DATABASE_URL",
  "DATABASE_URL",
  "DIRECT_URL",
];

const privilegedKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PHASE18_PRODUCTION_SERVICE_ROLE",
  "PHASE18_IMPORT_SERVICE_ROLE",
];

function strip(v) {
  let x = v.trim();
  if (
    (x.startsWith('"') && x.endsWith('"')) ||
    (x.startsWith("'") && x.endsWith("'"))
  ) {
    x = x.slice(1, -1);
  }
  return x;
}

function classifyUrl(v) {
  if (!v) return { status: "ABSENT" };
  try {
    const u = new URL(v);
    const host = (u.hostname || "").toLowerCase();
    const port = u.port || "";
    const local =
      ["127.0.0.1", "localhost", "::1"].includes(host) ||
      host.endsWith(".local") ||
      port === "54322" ||
      host.includes("supabase_db");
    let classHint = "UNKNOWN_HOST";
    if (local) classHint = "LOCAL_OR_DISPOSABLE";
    else if (
      host.includes("supabase.co") ||
      host.includes("pooler.supabase.com") ||
      host.includes("amazonaws.com")
    ) {
      classHint = "HOSTED_LIKELY_PRODUCTION";
    }
    return {
      status: "PRESENT",
      protocol: u.protocol.replace(":", ""),
      host,
      port: port || null,
      db: (u.pathname || "").replace(/^\//, "") || null,
      userSet: Boolean(u.username),
      classHint,
    };
  } catch {
    return { status: "PRESENT", parse: "INVALID_URL_SHAPE" };
  }
}

function scanFile(path) {
  if (!fs.existsSync(path)) return { file: "FILE_ABSENT" };
  const text = fs.readFileSync(path, "utf8");
  const out = {};
  for (const k of urlKeys) {
    const m = text.match(new RegExp(`^${k}=(.*)$`, "m"));
    out[k] = m ? classifyUrl(strip(m[1])) : { status: "ABSENT" };
  }
  for (const k of privilegedKeys) {
    const m = text.match(new RegExp(`^${k}=(.*)$`, "m"));
    if (!m) out[k] = { status: "ABSENT" };
    else {
      const v = strip(m[1]);
      out[k] = v
        ? { status: "PRESENT", lengthOnly: v.length }
        : { status: "EMPTY" };
    }
  }
  return out;
}

const processEnv = {};
for (const k of urlKeys) {
  processEnv[k] = classifyUrl(process.env[k]);
}
for (const k of privilegedKeys) {
  const v = process.env[k];
  processEnv[k] = v
    ? { status: "PRESENT", lengthOnly: v.length }
    : { status: "ABSENT" };
}

const filesScan = {};
for (const f of files) filesScan[f] = scanFile(f);

const preflightUrl =
  (processEnv.PHASE18_PRODUCTION_DATABASE_URL.status === "PRESENT" &&
    processEnv.PHASE18_PRODUCTION_DATABASE_URL) ||
  (processEnv.PRODUCTION_DATABASE_URL.status === "PRESENT" &&
    processEnv.PRODUCTION_DATABASE_URL) ||
  (filesScan[".env"]?.PHASE18_PRODUCTION_DATABASE_URL?.status === "PRESENT" &&
    filesScan[".env"].PHASE18_PRODUCTION_DATABASE_URL) ||
  (filesScan[".env"]?.PRODUCTION_DATABASE_URL?.status === "PRESENT" &&
    filesScan[".env"].PRODUCTION_DATABASE_URL) ||
  null;

let preflightAccess = "UNAVAILABLE";
if (preflightUrl && preflightUrl.classHint === "HOSTED_LIKELY_PRODUCTION") {
  preflightAccess = "AVAILABLE_CANDIDATE";
} else if (preflightUrl && preflightUrl.classHint === "LOCAL_OR_DISPOSABLE") {
  preflightAccess = "REJECTED_LOCAL";
} else if (preflightUrl) {
  preflightAccess = "PRESENT_BUT_UNCONFIRMED";
}

const report = {
  generatedAt: new Date().toISOString(),
  productionReadOnlyAccess: preflightAccess,
  preflightCredentialKeys: [
    "PHASE18_PRODUCTION_DATABASE_URL",
    "PRODUCTION_DATABASE_URL",
  ],
  importCredentialKeysDeferred: [
    "PHASE18_IMPORT_DATABASE_URL",
    "Auth admin capability — TBD after CREATE_NEW count known",
  ],
  forbiddenForPreflight: [
    "SUPABASE_SERVICE_ROLE_KEY as preflight substitute",
    "Storage credentials",
    "Write-capable DB roles",
  ],
  processEnv,
  files: filesScan,
};

console.log(JSON.stringify(report, null, 2));
process.exitCode = preflightAccess === "AVAILABLE_CANDIDATE" ? 0 : 2;
