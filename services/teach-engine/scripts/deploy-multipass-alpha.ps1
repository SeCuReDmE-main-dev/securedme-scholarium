[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$EnvFile,
  [string]$Instance = "scholarium-teach-alpha",
  [string]$RemoteRoot = "/home/ubuntu/scholarium-teach",
  [switch]$Start
)

$ErrorActionPreference = "Stop"
$requiredKeys = @(
  "SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET",
  "SCHOLARIUM_TEACH_POSTGRES_ADMIN_PASSWORD",
  "SCHOLARIUM_TEACH_POSTGRES_READER_PASSWORD"
)

if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw "Alpha environment file was not found." }
$names = Get-Content -LiteralPath $EnvFile | Where-Object { $_ -match "^[A-Za-z_][A-Za-z0-9_]*=" } | ForEach-Object { ($_ -split "=", 2)[0] }
$missing = $requiredKeys | Where-Object { $_ -notin $names }
if ($missing) { throw "The Settings Operator alpha file is missing required keys: $($missing -join ', ')." }

$serviceRoot = Split-Path -Parent $PSScriptRoot
$archive = Join-Path $env:TEMP ("scholarium-teach-engine-" + [guid]::NewGuid().ToString("N") + ".tar.gz")
try {
  & multipass info $Instance | Out-Null
  & tar -C (Split-Path -Parent $serviceRoot) -czf $archive (Split-Path -Leaf $serviceRoot)
  & multipass exec $Instance -- bash -lc "rm -rf '$RemoteRoot' && mkdir -p '$RemoteRoot'"
  & multipass transfer $archive "${Instance}:$RemoteRoot/engine.tar.gz"
  & multipass transfer $EnvFile "${Instance}:$RemoteRoot/.env.alpha"
  & multipass exec $Instance -- bash -lc "cd '$RemoteRoot' && tar -xzf engine.tar.gz && mv teach-engine runtime && chmod 600 .env.alpha && rm engine.tar.gz && docker compose --env-file .env.alpha -f runtime/infra/compose/compose.alpha.yml config --quiet"
  if ($Start) {
    & multipass exec $Instance -- bash -lc "cd '$RemoteRoot' && docker compose --env-file .env.alpha -f runtime/infra/compose/compose.alpha.yml up -d --build && docker compose --env-file .env.alpha -f runtime/infra/compose/compose.alpha.yml ps && ! docker compose --env-file .env.alpha -f runtime/infra/compose/compose.alpha.yml config | grep -q '^ *ports:'"
    if ($LASTEXITCODE -ne 0) { throw "Alpha compose either failed or declared a host port." }
  }
} finally {
  Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
}
