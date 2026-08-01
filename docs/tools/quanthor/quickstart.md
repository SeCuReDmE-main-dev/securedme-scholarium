# QuaNThoR quickstart

## Requirements

Use a clean checkout, the runtime declared by the repository, and its committed lockfiles. Confirm the active branch before installing anything.

```powershell
git status --short --branch
```

## Install

```powershell
docker compose build
```

## Start

```powershell
docker compose up
Open http://localhost:5050
```

## Verify

```powershell
Invoke-WebRequest http://localhost:5050/health
```

## Human acceptance

Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.
