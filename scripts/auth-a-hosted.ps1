param([ValidateSet('inspect', 'recover', 'provider-proof', 'app-build', 'app-runtime')][string]$Phase = 'inspect')
$ErrorActionPreference = 'Stop'
# Owner-authorized saved CLI credential reuse. Never echo credentials or put them in arguments.
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
public static class AuthAOnlyCredential {
  [StructLayout(LayoutKind.Sequential)] struct Credential {
    public uint Flags, Type;
    public IntPtr TargetName, Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint BlobSize;
    public IntPtr Blob;
    public uint Persist, AttributeCount;
    public IntPtr Attributes, TargetAlias, UserName;
  }
  [DllImport("advapi32.dll", EntryPoint="CredEnumerateW", CharSet=CharSet.Unicode, SetLastError=true)]
  static extern bool Enumerate(string filter, uint flags, out uint count, out IntPtr credentials);
  [DllImport("advapi32.dll")] static extern void CredFree(IntPtr buffer);
  public static string Read() {
    uint count; IntPtr entries;
    if (!Enumerate("Supabase CLI*", 0, out count, out entries)) throw new Exception("Supabase CLI credential not found");
    try {
      for (int i=0;i<count;i++) {
        var ptr=Marshal.ReadIntPtr(entries, i*IntPtr.Size);
        var entry=(Credential)Marshal.PtrToStructure(ptr, typeof(Credential));
        var target=Marshal.PtrToStringUni(entry.TargetName);
        if (target==null || !target.StartsWith("Supabase CLI:")) continue;
        var bytes=new byte[entry.BlobSize]; Marshal.Copy(entry.Blob, bytes, 0, bytes.Length);
        try {
          foreach(var token in new[]{Encoding.UTF8.GetString(bytes),Encoding.Unicode.GetString(bytes)})
            if(Regex.IsMatch(token,"^sbp_(oauth_|v0_)?[a-f0-9]{40}$")) return token;
        } finally {Array.Clear(bytes,0,bytes.Length);}
      }
      throw new Exception("No supported Supabase CLI access credential found");
    } finally {CredFree(entries);}
  }
}
'@
try {
  $authAToken = [AuthAOnlyCredential]::Read()
  $authAInput = @{projectId='hyzkearnbhxznkeokacj';managementToken=$authAToken;phase=$Phase}
  if ($Phase -in @('provider-proof', 'app-build', 'app-runtime')) {
    $authAOwner = (& npx --yes supabase whoami --output-format json | ConvertFrom-Json)
    if (-not $authAOwner.email) { throw 'No owner-controlled test mailbox was established.' }
    $authAInput.testEmail = $authAOwner.email
  }
  $authAInput | ConvertTo-Json -Compress | & node (Join-Path $PSScriptRoot 'auth-a-hosted.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Hosted proof did not complete successfully; inspect its redacted output.' }
} finally {
  $authAToken=$null
  $authAInput=$null
}
