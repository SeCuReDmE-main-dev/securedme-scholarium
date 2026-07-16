param(
    [string]$WebRoot = "C:\Users\jeans\Desktop\Case study\modele\securedme-scholarium\apps\web",
    [string]$BackupRoot = "C:\Users\jeans\Desktop\Private\ScholariumBackups",
    [ValidateRange(2, 30)][int]$Retain = 7
)

$ErrorActionPreference = "Stop"
$resolvedWebRoot = (Resolve-Path -LiteralPath $WebRoot).Path
$privateRoot = [IO.Path]::GetFullPath("C:\Users\jeans\Desktop\Private")
$resolvedBackupRoot = [IO.Path]::GetFullPath($BackupRoot)
if (-not $resolvedBackupRoot.StartsWith($privateRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "BackupRoot must remain inside Desktop\Private."
}

$databaseRoot = Join-Path $resolvedWebRoot ".wrangler\state\v3\d1\miniflare-D1DatabaseObject"
$source = Get-ChildItem -LiteralPath $databaseRoot -File -Filter "*.sqlite" |
    Where-Object { $_.Name -ne "metadata.sqlite" } |
    Sort-Object Length -Descending |
    Select-Object -First 1
if (-not $source) { throw "No local Scholarium D1 database was found." }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirectory = Join-Path $resolvedBackupRoot $stamp
$snapshot = Join-Path $backupDirectory "scholarium-d1.sqlite"
$helper = Join-Path (Split-Path $PSScriptRoot -Parent) "teach\backup-local-d1.mjs"
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
$result = (& node --no-warnings $helper $source.FullName $snapshot) | ConvertFrom-Json
if ($result.quickCheck -ne "ok") { throw "Backup quick_check failed." }

$manifest = [ordered]@{
    schema = "scholarium.private-backup-manifest.v1"
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    sourceKind = "local-synthetic-d1"
    containsRealLearnerData = $false
    snapshot = "scholarium-d1.sqlite"
    sha256 = (Get-FileHash -LiteralPath $snapshot -Algorithm SHA256).Hash
    applicationTables = $result.applicationTables
    appliedMigrations = $result.appliedMigrations
    restoreCommand = "Test-ScholariumRestore.ps1 -BackupDirectory <private-backup-directory>"
}
[IO.File]::WriteAllText((Join-Path $backupDirectory "manifest.json"), ($manifest | ConvertTo-Json -Depth 4), [Text.UTF8Encoding]::new($false))

$rotated = @()
$directories = Get-ChildItem -LiteralPath $resolvedBackupRoot -Directory | Sort-Object Name -Descending
foreach ($old in ($directories | Select-Object -Skip $Retain)) {
    $resolvedOld = [IO.Path]::GetFullPath($old.FullName)
    if (-not $resolvedOld.StartsWith($resolvedBackupRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Rotation target escaped the private backup root."
    }
    Remove-Item -LiteralPath $resolvedOld -Recurse -Force
    $rotated += $old.Name
}

[pscustomobject]@{ BackupDirectory = $backupDirectory; Hash = $manifest.sha256; QuickCheck = $result.quickCheck; ApplicationTables = $result.applicationTables; AppliedMigrations = $result.appliedMigrations; Rotated = $rotated }
