/**
 * Re-apply Production Auth security config + canonical URL.
 * Idempotent. Never prints token.
 */
const { spawnSync } = require("child_process");

const PROD = "https://tncod-professionals-azure.vercel.app";
const LEGACY = "https://tncod-professionals-olanailedits-projects.vercel.app";
const REF = "brpppukzqgpzxjelwwrj";

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

async function main() {
  const verifyOnly = process.argv.includes("--verify-only");
  const token = getToken();
  if (!token) {
    console.log("TOKEN=ABSENT");
    process.exit(2);
  }
  const allow = [
    PROD,
    `${PROD}/`,
    `${PROD}/auth/callback`,
    `${PROD}/**`,
    LEGACY,
    `${LEGACY}/`,
    `${LEGACY}/auth/callback`,
    `${LEGACY}/**`,
  ].join(",");

  if (!verifyOnly) {
    const patch = await fetch(
      `https://api.supabase.com/v1/projects/${REF}/config/auth`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_url: `${PROD}/`,
          uri_allow_list: allow,
          disable_signup: true,
        }),
      }
    );
    console.log("PATCH", patch.status);
    if (!patch.ok) {
      const t = await patch.text();
      console.log("ERR", t.slice(0, 200));
      process.exit(1);
    }
  }

  let j;
  for (let attempt = 0; attempt < (verifyOnly ? 1 : 5); attempt += 1) {
    const get = await fetch(
      `https://api.supabase.com/v1/projects/${REF}/config/auth`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!get.ok) throw new Error(`Auth config read failed (${get.status})`);
    j = await get.json();
    if (j.site_url === `${PROD}/` || verifyOnly) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  const magicLink = j.mailer_templates_magic_link_content || "";
  const allowed = String(j.uri_allow_list || "").split(",").map((entry) => entry.trim());
  console.log("SITE_URL", j.site_url);
  console.log(
    "ALLOW_HAS_CANONICAL_CALLBACK",
    allowed.includes(`${PROD}/auth/callback`)
  );
  console.log("DIRECT_SIGNUP_DISABLED", j.disable_signup === true);
  console.log("EMAIL_OTP_PROVIDER_ENABLED", j.external_email_enabled === true);
  console.log("MAGIC_LINK_TOKEN_PRESENT", magicLink.includes("{{ .Token }}"));
  console.log("MAGIC_LINK_CONFIRMATION_URL_PRESENT", magicLink.includes("{{ .ConfirmationURL }}"));
  console.log("MAGIC_LINK_ANCHOR_PRESENT", /<a\b[^>]*href=["']{{\s*\.ConfirmationURL\s*}}["'][^>]*>/i.test(magicLink));
  console.log("EMAIL_OTP_EXPIRY_SECONDS", j.mailer_otp_exp);
  console.log(
    "LEAKED_PASSWORD_PROTECTION",
    j.password_hibp_enabled === true ? "ENABLED" : "PLAN_UNAVAILABLE"
  );
  if (
    j.site_url !== `${PROD}/` ||
    !allowed.includes(`${PROD}/auth/callback`) ||
    j.disable_signup !== true ||
    j.external_email_enabled !== true ||
    !magicLink.includes("{{ .Token }}") ||
    !magicLink.includes("{{ .ConfirmationURL }}")
  ) {
    throw new Error("Production Auth remediation did not verify");
  }
  console.log("REPAIR_OK");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
