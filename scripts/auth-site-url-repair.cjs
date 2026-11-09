/**
 * Inspect or, with explicit operator approval, align hosted Auth URL settings.
 * A bare invocation is read only. Never prints a token or full Auth config.
 */
const { spawnSync } = require("child_process");

const OFFICIAL = "https://codprofessionals.69resources.com";
const AZURE = "https://tncod-professionals-azure.vercel.app";
const VIIX = "https://codprofessionals.viix.solutions";
const REF = "brpppukzqgpzxjelwwrj";
const PREVIOUS_SITE_URL = "https://tncod-professionals-olanailedits-projects.vercel.app/";
const REQUIRED_EXISTING_REDIRECTS = [
  `${AZURE}/auth/callback`,
  `${VIIX}/auth/callback`,
  `${OFFICIAL}/auth/callback`,
];
const CUTOVER_REDIRECT = `${OFFICIAL}/auth/callback**`;
const REQUIRED_REDIRECTS = [...REQUIRED_EXISTING_REDIRECTS, CUTOVER_REDIRECT];
const SITE_URL = `${OFFICIAL}/`;

function mergeRedirectAllowList(current) {
  const existing = String(current || "").split(",").map((entry) => entry.trim()).filter(Boolean);
  return [...new Set([...existing, CUTOVER_REDIRECT])].join(",");
}

function parseArgs(args) {
  const apply = args.includes("--apply");
  const verifyOnly = args.includes("--verify-only");
  const expectedPrefix = "--expected-site-url=";
  const projectPrefix = "--project-ref=";
  const expected = args.find(arg => arg.startsWith(expectedPrefix))?.slice(expectedPrefix.length);
  const projectRef = args.find(arg => arg.startsWith(projectPrefix))?.slice(projectPrefix.length);
  const known = args.every(arg =>
    arg === "--apply" || arg === "--verify-only" ||
    arg.startsWith(expectedPrefix) || arg.startsWith(projectPrefix));
  if (!known || (apply && verifyOnly) || args.filter(arg => arg === "--apply").length > 1 ||
      args.filter(arg => arg === "--verify-only").length > 1 ||
      args.filter(arg => arg.startsWith(expectedPrefix)).length > 1 ||
      args.filter(arg => arg.startsWith(projectPrefix)).length > 1) {
    throw new Error("Invalid Auth URL command arguments");
  }
  if (apply && (!expected || projectRef !== REF)) {
    throw new Error("Write mode requires --project-ref and --expected-site-url matching the current readback");
  }
  if (!apply && args.some(arg => arg.startsWith(expectedPrefix) || arg.startsWith(projectPrefix))) {
    throw new Error("Expected Site URL and project reference are only accepted with --apply");
  }
  return { apply, expected };
}

function buildUrlPatch(current, expectedSiteUrl) {
  if (current.site_url !== expectedSiteUrl) throw new Error("Hosted Site URL changed since operator preflight");
  if (current.site_url !== PREVIOUS_SITE_URL && current.site_url !== SITE_URL) {
    throw new Error("Hosted Site URL is outside the reviewed cutover states");
  }
  if (current.disable_signup !== true || current.external_email_enabled !== true) {
    throw new Error("Hosted Auth safety preconditions changed");
  }
  const existing = String(current.uri_allow_list || "").split(",").map(x => x.trim());
  if (!REQUIRED_EXISTING_REDIRECTS.every(redirect => existing.includes(redirect))) {
    throw new Error("Required existing Auth redirects changed since operator preflight");
  }
  return { site_url: SITE_URL, uri_allow_list: mergeRedirectAllowList(current.uri_allow_list) };
}

function getToken() {
  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class CredMan {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public uint CredentialBlobSize;
    public IntPtr CredentialBlob; public uint Persist; public uint AttributeCount; public IntPtr Attributes;
    public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, uint type, int flags, out IntPtr credential);
  [DllImport("advapi32.dll", SetLastError = true)]
  public static extern void CredFree(IntPtr buffer);
  public static string ReadUtf8(string target) {
    IntPtr p; if (!CredRead(target, 1, 0, out p)) return null;
    try {
      var c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL));
      byte[] b = new byte[c.CredentialBlobSize];
      Marshal.Copy(c.CredentialBlob, b, 0, (int)c.CredentialBlobSize);
      return Encoding.UTF8.GetString(b).TrimEnd('\\0');
    } finally { CredFree(p); }
  }
}
"@
[Console]::Out.Write(([CredMan]::ReadUtf8('Supabase CLI:supabase')).Trim())
`;
  const r = spawnSync("powershell", ["-NoProfile", "-Command", ps], {
    encoding: "utf8",
    windowsHide: true,
  });
  return (r.stdout || "").trim() || null;
}

async function main(args = process.argv.slice(2), dependencies = {}) {
  const { apply, expected } = parseArgs(args);
  const token = dependencies.token ?? getToken();
  const request = dependencies.fetch ?? fetch;
  const log = dependencies.log ?? console.log;
  if (!token) throw new Error("Hosted Auth credential unavailable");
  // Always read first; never replace a newer allow-list with a fixed historical list.
  const preflight = await request(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!preflight.ok) throw new Error(`Auth config preflight failed (${preflight.status})`);
  const current = await preflight.json();
  log("MODE", apply ? "APPLY" : "VERIFY_ONLY");
  log("PROJECT_REF", REF);
  log("CURRENT_SITE_URL", current.site_url);

  if (apply) {
    const patchBody = buildUrlPatch(current, expected);
    if (current.site_url !== patchBody.site_url || current.uri_allow_list !== patchBody.uri_allow_list) {
      const patch = await request(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patchBody),
      });
      log("PATCH_STATUS", patch.status);
      if (!patch.ok) throw new Error(`Auth URL update failed (${patch.status})`);
    } else {
      log("PATCH_STATUS", "NOT_NEEDED");
    }
  }

  let j = current;
  for (let attempt = 0; attempt < (apply ? 5 : 0); attempt += 1) {
    const get = await request(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!get.ok) throw new Error(`Auth config read failed (${get.status})`);
    j = await get.json();
    if (j.site_url === SITE_URL &&
        REQUIRED_REDIRECTS.every(redirect => String(j.uri_allow_list || "").split(",").map(x => x.trim()).includes(redirect))) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const magicLink = j.mailer_templates_magic_link_content || "";
  const allowed = String(j.uri_allow_list || "").split(",").map((entry) => entry.trim()).filter(Boolean);
  log("SITE_URL", j.site_url);
  log("ALLOW_HAS_OFFICIAL_CALLBACK_QUERY", allowed.includes(`${OFFICIAL}/auth/callback**`));
  if (apply) {
    log("EXISTING_REDIRECTS_PRESERVED", String(current.uri_allow_list || "").split(",").map(x => x.trim()).filter(Boolean).every(entry => allowed.includes(entry)));
  }
  log("DIRECT_SIGNUP_DISABLED", j.disable_signup === true);
  log("EMAIL_OTP_PROVIDER_ENABLED", j.external_email_enabled === true);
  log("MAGIC_LINK_TOKEN_PRESENT", magicLink.includes("{{ .Token }}"));
  log("MAGIC_LINK_CONFIRMATION_URL_PRESENT", magicLink.includes("{{ .ConfirmationURL }}"));
  log("MAGIC_LINK_ANCHOR_PRESENT", /<a\b[^>]*href=["']{{\s*\.ConfirmationURL\s*}}["'][^>]*>/i.test(magicLink));
  log("EMAIL_OTP_EXPIRY_SECONDS", j.mailer_otp_exp);
  log(
    "LEAKED_PASSWORD_PROTECTION",
    j.password_hibp_enabled === true ? "ENABLED" : "PLAN_UNAVAILABLE"
  );
  if (
    j.site_url !== SITE_URL ||
    !REQUIRED_REDIRECTS.every((redirect) => allowed.includes(redirect)) ||
    !String(current.uri_allow_list || "").split(",").map(x => x.trim()).filter(Boolean).every(entry => allowed.includes(entry)) ||
    j.disable_signup !== true ||
    j.external_email_enabled !== true
  ) {
    throw new Error("Hosted Auth URL configuration did not verify");
  }
  log("URL_CONFIG_VERIFIED");
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { mergeRedirectAllowList, parseArgs, buildUrlPatch, main };
