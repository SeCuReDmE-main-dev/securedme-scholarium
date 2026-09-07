# Operations and contribution

## Configuration

Keep secrets outside documentation and source control. Use `.env.example` as the public contract and store real values only in the designated local settings surface.

## Testing

Run the repository checks listed in the quickstart. A passing narrow test does not prove unrelated interfaces or scientific claims.

For the local WebMCP gate:

```powershell
node tools/webmcp_evidence_gate.mjs --check --require-b-plus
node tools/webmcp_evidence_gate.mjs --require-b-plus
node tools/webmcp_evidence_gate.mjs --require-b-plus --require-suite-complete
```

Generated JSON, HTML, Markdown, SARIF, and SHA-bound receipts are written under `output/webmcp-evidence/`. The suite gate loads the twelve repository exports declared in `tools/webmcp-product-matrix.json`, permits only the two shared tool-name repetitions, and requires 144 descriptors, 122 unique names, and 72 journeys. Missing exports remain explicit. Chrome and Edge discovery remain `not_run` until tested in those browsers; the local score must not be presented as browser evidence.

For a production-runtime smoke check, build and start the Vinext server, then
verify both the application page and the versioned manifest endpoint:

```powershell
cd apps/web
npm run build
npm start
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/app
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3000/api/v1/webmcp/manifest
```

Both requests must return HTTP 200, `/app` must contain nonblank Scholarium
HTML, and the manifest must declare `securedme.webmcp.v1`, twelve tools, and
`canonicalStateOwner: algoquest`. The local Node production runner reads
configuration from `process.env` only when the Cloudflare runtime module is not
available; an absent session secret remains a fail-closed unauthenticated state.

## Troubleshooting

1. Confirm the repository and branch.
2. Reproduce with the smallest supported input.
3. Capture the exact command and error.
4. Check the documented runtime and lockfile.
5. Open an issue with secret-free evidence.

## Security and privacy

Scholarium organizes and publishes reviewed material; it is not an academic, legal, or taxonomic authority.

## Contributing

Read `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md`, and the repository license when present. Keep changes bounded and include the checks that justify acceptance.

## Releases

The current public documentation describes `pre-alpha` with status `public-pre-alpha`. Consult the repository history and release notes for changes.
