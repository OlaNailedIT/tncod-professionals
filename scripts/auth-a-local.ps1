param([switch]$ReuseBuild, [ValidateSet('journey', 'consumers')][string]$Case = 'journey')
$ErrorActionPreference = 'Stop'
# Read only the existing local stack; never start, reset, or target a hosted project.
$authALocalStatus = & npx --offline --yes supabase status --output json
if ($LASTEXITCODE -ne 0) { throw 'Existing disposable stack is unavailable.' }
try {
  $authALocalInput = $authALocalStatus | ConvertFrom-Json
  $authALocalInput | Add-Member -NotePropertyName reuseBuild -NotePropertyValue ([bool]$ReuseBuild)
  $authALocalInput | Add-Member -NotePropertyName proofCase -NotePropertyValue $Case
  $authALocalInput | ConvertTo-Json -Compress | & node (Join-Path $PSScriptRoot 'auth-a-local.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Local application proof failed; inspect the redacted report.' }
} finally { $authALocalStatus = $null; $authALocalInput = $null }
