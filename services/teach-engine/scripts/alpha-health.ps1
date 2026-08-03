param([Parameter(Mandatory = $true)][string] $EnvFile)

$ErrorActionPreference = "Stop"
$compose = Join-Path $PSScriptRoot "..\infra\compose\compose.alpha.yml"
$state = docker compose --env-file $EnvFile -f $compose ps --format json | ConvertFrom-Json
$required = @("engine", "postgres")
$missing = $required | Where-Object { $_ -notin $state.Service }
if ($missing) { throw "Missing alpha services: $($missing -join ', ')" }
$unhealthy = $state | Where-Object { $_.Service -in $required -and $_.Health -notin @("healthy", "") -or $_.State -ne "running" }
if ($unhealthy) { throw "Alpha health check failed." }

docker compose --env-file $EnvFile -f $compose exec -T postgres psql -U scholarium_catalog -d scholarium_teach -Atqc "SELECT count(*) = 5 FROM teach_catalog.dataset_slots WHERE status = 'neutral' AND runtime_access = false;" | Select-String '^t$' | Out-Null
docker compose --env-file $EnvFile -f $compose exec -T postgres psql -U scholarium_catalog -d scholarium_teach -Atqc "SELECT EXISTS (SELECT 1 FROM timescaledb_information.hypertables WHERE hypertable_schema = 'teach_telemetry' AND hypertable_name = 'engine_events');" | Select-String '^t$' | Out-Null
Write-Output "scholarium-teach-alpha: healthy"
