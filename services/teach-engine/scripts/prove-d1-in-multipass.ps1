[CmdletBinding()]
param(
  [string]$Instance = "scholarium-teach-alpha",
  [string]$RemoteRoot = "/home/ubuntu/scholarium-d1-proof"
)

$ErrorActionPreference = "Stop"
$serviceRoot = Split-Path -Parent $PSScriptRoot
$harness = Join-Path $serviceRoot "tests\d1-linux-harness"
$archive = Join-Path $env:TEMP ("scholarium-d1-proof-" + [guid]::NewGuid().ToString("N") + ".tar.gz")
try {
  if (-not (Test-Path -LiteralPath (Join-Path $harness "package-lock.json"))) { throw "D1 harness lockfile is missing." }
  & tar -C $harness -czf $archive .
  & multipass exec $Instance -- bash -lc "sudo rm -rf '$RemoteRoot' && mkdir -p '$RemoteRoot'"
  & multipass transfer $archive "${Instance}:$RemoteRoot/harness.tar.gz"
  # Node is intentionally not installed on the alpha VM. The proof runs in a
  # disposable Node 22 container against files that exist only inside the VM.
  & multipass exec $Instance -- bash -lc "cd '$RemoteRoot' && tar -xzf harness.tar.gz && rm harness.tar.gz && docker run --rm -v '${RemoteRoot}:/work' -w /work node:22-bookworm-slim bash -lc 'npm ci --ignore-scripts && node prove.mjs'"
  if ($LASTEXITCODE -ne 0) { throw "Linux D1 proof failed." }
} finally {
  & multipass exec $Instance -- bash -lc "sudo rm -rf '$RemoteRoot' && test ! -e '$RemoteRoot'"
  if ($LASTEXITCODE -ne 0) { Write-Warning "The disposable D1 harness cleanup could not be verified." }
  Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
}
