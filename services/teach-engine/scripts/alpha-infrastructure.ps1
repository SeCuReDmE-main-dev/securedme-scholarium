param(
  [ValidateSet("up", "down", "status", "backup")]
  [string] $Action = "status",
  [string] $EnvFile = ""
)

$ErrorActionPreference = "Stop"
$compose = Join-Path $PSScriptRoot "..\infra\compose\compose.alpha.yml"

if (-not $EnvFile) {
  throw "Pass a temporary Settings Operator generated environment file with -EnvFile. Do not source the suite .env file."
}

switch ($Action) {
  "up" { docker compose --env-file $EnvFile -f $compose up --build --detach }
  "down" { docker compose --env-file $EnvFile -f $compose down }
  "status" { docker compose --env-file $EnvFile -f $compose ps }
  "backup" {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupDirectory = Join-Path $PSScriptRoot "..\output\backups"
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    $target = Join-Path $backupDirectory "teach-catalog-$timestamp.dump"
    docker compose --env-file $EnvFile -f $compose exec -T postgres pg_dump -U scholarium_catalog -d scholarium_teach --format=custom --file /tmp/teach-catalog.dump
    docker compose --env-file $EnvFile -f $compose cp "postgres:/tmp/teach-catalog.dump" $target
  }
}
