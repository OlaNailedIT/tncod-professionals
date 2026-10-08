/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function loadEnvFile(file) {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    while (
      (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
      (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const merged = Object.assign(
  {},
  loadEnvFile("../tncod-professional/.env"),
  loadEnvFile("../tncod-professional/.env.local"),
  loadEnvFile(".env"),
  loadEnvFile(".env.local"),
);

const url = merged.PHASE18_IMPORT_SUPABASE_URL;
const service = merged.PHASE18_IMPORT_SERVICE_ROLE_KEY;
if (!url || !service || /localhost|127\.0\.0\.1/i.test(url)) {
  console.log("missing_or_local");
  process.exit(2);
}

(async () => {
  const settingsRes = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const settingsText = await settingsRes.text();
  console.log("settings_status", settingsRes.status);
  let disableSignup = null;
  try {
    const json = JSON.parse(settingsText);
    disableSignup = json.disable_signup;
    console.log("disable_signup", disableSignup);
    console.log("external_email", Boolean(json.external?.email));
  } catch {
    console.log("settings_parse", "failed");
  }

  const email = `tncod-phase4-signup-deny-${Date.now()}@example.invalid`;
  const signupRes = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: `DenyGate-${Date.now()}-Aa1!`,
    }),
  });
  const signupBody = await signupRes.text();
  console.log("signup_status", signupRes.status);
  // Do not print body (may contain user ids). Classify only.
  let created = false;
  try {
    const j = JSON.parse(signupBody);
    created = Boolean(j.id || j.user?.id || j.access_token);
  } catch {
    created = false;
  }
  console.log("signup_created", created);
  // Prefer settings flag; signup with service_role may bypass disable_signup on some setups.
  console.log(
    "SIGNUP_DISABLED_SETTING",
    disableSignup === true,
  );
  process.exit(disableSignup === true ? 0 : 10);
})();
