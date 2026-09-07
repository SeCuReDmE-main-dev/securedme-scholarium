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
npm run webmcp:evaluate
```

To inspect the adaptive side panel, load `companion/` as an unpacked Manifest V3 extension in Chrome or Edge, open a supported SecuredMe Education page, and use the extension action. Unknown pages are refused and no host permission is requested.

## Human acceptance

Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.
