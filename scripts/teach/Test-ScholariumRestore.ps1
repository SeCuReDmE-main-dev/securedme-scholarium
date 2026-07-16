param(
    [Parameter(Mandatory = $true)][string]$BackupDirectory,
    [string]$BackupRoot = "C:\Users\jeans\Desktop\Private\ScholariumBackups"
)

$ErrorActionPreference = "Stop"
$root = [IO.Path]::GetFullPath($BackupRoot)
$directory = (Resolve-Path -LiteralPath $BackupDirectory).Path
if (-not $directory.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Restore source must remain inside the private Scholarium backup root."
}

$manifestPath = Join-Path $directory "manifest.json"
$snapshot = Join-Path $directory "scholarium-d1.sqlite"
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$actualHash = (Get-FileHash -LiteralPath $snapshot -Algorithm SHA256).Hash
if ($actualHash -ne $manifest.sha256) { throw "Backup hash verification failed." }

$restoreDirectory = Join-Path $directory "restore-rehearsal"
$restored = Join-Path $restoreDirectory "scholarium-d1-restored.sqlite"
if (Test-Path -LiteralPath $restored) { Remove-Item -LiteralPath $restored -Force }
$helper = Join-Path (Split-Path $PSScriptRoot -Parent) "teach\backup-local-d1.mjs"
$result = (& node --no-warnings $helper $snapshot $restored) | ConvertFrom-Json
if ($result.quickCheck -ne "ok" -or $result.applicationTables -ne $manifest.applicationTables) {
    throw "Restore rehearsal validation failed."
}

[pscustomobject]@{ RestoredPath = $restored; QuickCheck = $result.quickCheck; ApplicationTables = $result.applicationTables; AppliedMigrations = $result.appliedMigrations; SourceHashVerified = $true; ProductionOverwritten = $false }
