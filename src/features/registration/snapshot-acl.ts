/**
 * Windows-aware directory safety for full-PII reclaim snapshots.
 * mode 0o600 is insufficient on Windows NTFS (inherited ACLs remain).
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const WELL_KNOWN_ALLOWED_SIDS = new Set([
  "S-1-5-18", // NT AUTHORITY\SYSTEM
  "S-1-5-32-544", // BUILTIN\Administrators
]);

export type SnapshotDirCheck =
  | { ok: true; resolved: string }
  | { ok: false; reason: string; detail?: string };

/** True when candidate is the repo root or a path inside it. */
export function isPathInsideRepository(candidate: string, repoRoot: string): boolean {
  const resolved = path.resolve(candidate);
  const root = path.resolve(repoRoot);
  if (process.platform === "win32") {
    const a = resolved.toLowerCase();
    const b = root.toLowerCase();
    return a === b || a.startsWith(`${b}${path.sep}`);
  }
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

type AceJson = {
  IdentityReference: string;
  Sid?: string;
  AccessControlType: string;
  FileSystemRights: string;
};

function parseIcaclsOrFail(dir: string): AceJson[] {
  // PowerShell translates IdentityReference → SID and emits Allow ACEs only.
  const ps = `
$ErrorActionPreference = 'Stop'
$p = $env:TNCOD_SNAPSHOT_ACL_PATH
if (-not (Test-Path -LiteralPath $p)) { throw "path missing" }
$acl = Get-Acl -LiteralPath $p
$out = @()
foreach ($a in $acl.Access) {
  if ($a.AccessControlType -ne 'Allow') { continue }
  $sid = $null
  try { $sid = $a.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value }
  catch {
    try { $sid = ([System.Security.Principal.SecurityIdentifier]$a.IdentityReference).Value }
    catch { $sid = [string]$a.IdentityReference }
  }
  $out += [pscustomobject]@{
    IdentityReference = [string]$a.IdentityReference
    Sid = $sid
    AccessControlType = [string]$a.AccessControlType
    FileSystemRights = [string]$a.FileSystemRights
  }
}
$out | ConvertTo-Json -Compress -Depth 4
`;
  const stdout = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", ps],
    {
      encoding: "utf8",
      env: { ...process.env, TNCOD_SNAPSHOT_ACL_PATH: dir },
      windowsHide: true,
      timeout: 30_000,
    },
  ).trim();
  if (!stdout) return [];
  const parsed = JSON.parse(stdout) as AceJson | AceJson[];
  return Array.isArray(parsed) ? parsed : [parsed];
}

function currentUserSid(): string {
  const ps = `[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value`;
  return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 15_000,
  }).trim();
}

function aceGrantsReadOrWrite(rights: string): boolean {
  const r = rights.toLowerCase();
  // Fail closed on any meaningful data access — Synchronize-only is rare alone.
  if (r.includes("fullcontrol")) return true;
  if (r.includes("modify")) return true;
  if (r.includes("readandexecute")) return true;
  if (r.includes("read")) return true;
  if (r.includes("write")) return true;
  if (r.includes("listdirectory")) return true;
  if (r.includes("readdata")) return true;
  if (r.includes("writedata")) return true;
  // Numeric / combined flags that include GenericRead / GenericAll / GenericWrite
  if (/-2147483648|-536870912|1179817|1245631|2032127|268435456/.test(rights)) return true;
  return false;
}

/**
 * Verify a pre-existing directory is outside the repo and, on Windows, that
 * non-administrator principals cannot read it (inherited sandbox ACLs fail).
 */
export function assertSecureSnapshotDirectory(input: {
  dir: string;
  repoRoot: string;
}): SnapshotDirCheck {
  const resolved = path.resolve(input.dir);
  if (isPathInsideRepository(resolved, input.repoRoot)) {
    return {
      ok: false,
      reason: "SNAPSHOT_DIR_INSIDE_REPO",
      detail: "Snapshot directory must be outside the repository tree.",
    };
  }
  if (!fs.existsSync(resolved)) {
    return {
      ok: false,
      reason: "SNAPSHOT_DIR_MISSING",
      detail: "Create the directory yourself and harden its ACL before use.",
    };
  }
  const st = fs.statSync(resolved);
  if (!st.isDirectory()) {
    return { ok: false, reason: "SNAPSHOT_DIR_NOT_DIRECTORY" };
  }

  if (process.platform !== "win32") {
    // POSIX: refuse group/other read/write/execute on the directory.
    if ((st.mode & 0o077) !== 0) {
      return {
        ok: false,
        reason: "SNAPSHOT_DIR_PERMS",
        detail: "Directory mode must deny group/other access (e.g. 0700).",
      };
    }
    return { ok: true, resolved };
  }

  let aces: AceJson[];
  let me: string;
  try {
    aces = parseIcaclsOrFail(resolved);
    me = currentUserSid();
  } catch (e) {
    return {
      ok: false,
      reason: "SNAPSHOT_DIR_ACL_UNREADABLE",
      detail: e instanceof Error ? e.message : "ACL probe failed",
    };
  }

  const allowed = new Set([...WELL_KNOWN_ALLOWED_SIDS, me]);
  const offenders: string[] = [];
  for (const ace of aces) {
    if (!aceGrantsReadOrWrite(ace.FileSystemRights)) continue;
    const sid = (ace.Sid || "").trim();
    if (sid && allowed.has(sid)) continue;
    offenders.push(`${ace.IdentityReference} (${sid || "no-sid"}): ${ace.FileSystemRights}`);
  }

  if (offenders.length > 0) {
    return {
      ok: false,
      reason: "SNAPSHOT_DIR_ACL_TOO_OPEN",
      detail: offenders.slice(0, 8).join("; "),
    };
  }
  return { ok: true, resolved };
}

/**
 * Create a private test/operator directory with inheritance disabled and
 * Allow only SYSTEM, Administrators, and the current user (Windows).
 * Never use for Production snapshots under the repo.
 */
export function createPrivateSnapshotDirectory(baseParent: string): string {
  if (process.platform !== "win32") {
    const dir = path.join(baseParent, `tncod-reclaim-${Date.now()}`);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    return dir;
  }
  const dir = path.join(baseParent, `tncod-reclaim-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  const ps = `
$ErrorActionPreference = 'Stop'
$p = $env:TNCOD_SNAPSHOT_ACL_PATH
$acl = Get-Acl -LiteralPath $p
$acl.SetAccessRuleProtection($true, $false)
$acl.Access | ForEach-Object { [void]$acl.RemoveAccessRule($_) }
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$system = New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-18'
$admins = New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-32-544'
foreach ($id in @($me, $system, $admins)) {
  $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $id, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'
  )
  $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $p -AclObject $acl
`;
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], {
    encoding: "utf8",
    env: { ...process.env, TNCOD_SNAPSHOT_ACL_PATH: dir },
    windowsHide: true,
    timeout: 30_000,
  });
  return dir;
}
