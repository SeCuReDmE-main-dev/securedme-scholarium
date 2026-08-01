# SecuredMe Scholarium quickstart

## Requirements

Use a clean checkout, the runtime declared by the repository, and its committed lockfiles. Confirm the active branch before installing anything.

```powershell
git status --short --branch
```

## Install

```powershell
cd apps/web
npm install
```

## Start

```powershell
npm run dev
```

## Verify

```powershell
npm test
npm run build
```

## Human acceptance

Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.
