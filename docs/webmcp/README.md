# Scholarium WebMCP, companion, and Evidence Gate

Status: public pre-alpha. This implementation exposes reviewable browser tools; it does not make Scholarium, Qbit, Codex, Gemini, or the companion an autonomous educational, scientific, editorial, safety, or progression authority.

## Canonical sources

- Runtime manifest: `apps/web/public/webmcp/securedme-scholarium.manifest.json`
- Manifest schema: `docs/webmcp/schemas/securedme.webmcp.v1.schema.json`
- Hero Book schema: `docs/webmcp/schemas/HeroBookPanelState.v1.schema.json`
- Browser bridge: `apps/web/app/components/webmcp-bridge.tsx`
- Handlers and sanitized envelopes: `apps/web/lib/webmcp/`
- Shared extension: `companion/`
- Local evaluator: `tools/webmcp_evidence_gate.mjs`
- Deterministic fixtures: `tools/webmcp-fixtures/scholarium.json`

The `/app` page publishes exactly twelve descriptors: the ten Scholarium tools below and two common tools. A descriptor is registered only when the browser exposes `document.modelContext.registerTool`. The machine-readable manifest remains available at `/api/v1/webmcp/manifest` even when the experimental browser runtime is absent. Its repository source remains `apps/web/public/webmcp/securedme-scholarium.manifest.json`.

## Common tools

| Tool | Mode | Boundary |
| --- | --- | --- |
| `securedme_companion_context` | READ | Returns product, capability-only session state, and a sanitized Hero Book projection. It excludes display name, email, identity, secrets, raw prompts, answers, audio, and evidence content. |
| `securedme_qbit_plan_handoff` | STAGE | Creates a pointer-only return plan. It never advances AlgoQuest, admits evidence, awards tokens, or changes a milestone. |

## Scholarium tools

| Tool | Mode | Current state |
| --- | --- | --- |
| `scholarium_search_publications` | READ | Calls the public lexical search endpoint. |
| `scholarium_inspect_publication` | READ | Reads and filters the public feed projection. |
| `scholarium_inspect_provenance` | READ | Reads a public provenance receipt without turning it into a truth claim. |
| `scholarium_inspect_teach_lesson` | READ | Reads the public deterministic starter lesson; no checkpoint change. |
| `scholarium_inspect_integrations` | READ | Reads consent-first integration contracts; listing is not connection proof. |
| `scholarium_stage_publication_draft` | STAGE | Creates a local review proposal; no publication or upload. |
| `scholarium_stage_formalization` | STAGE | Uses the existing non-blocking QuaNthoR preview endpoint. |
| `scholarium_stage_tool_connection` | STAGE | Creates a scope proposal; no consent record or redirect. |
| `scholarium_prepare_webauth_handoff` | STAGE | Creates a credential-free pointer plan for the official Codex/OpenAI or Antigravity/Gemini route. |
| `scholarium_submit_publication` | EXECUTE | `planned` and fail-closed. The existing publication API has no WebMCP one-use approval or idempotency contract, so the tool does not claim success. |

Every result uses `securedme.webmcp.v1`, an explicit status, a receipt summary, and a content-free trace. Network handlers use same-origin credentials, an eight-second timeout, a 256 KB response cap, and explicit HTTP failure results.

## Hero Book projection

`HeroBookPanelState.v1` can describe the Hero Book, hero role, mission, journey step, declared talents, inventory kind and state, deterministic-die receipt reference, decisions, story points, pedagogical evidence references, Knowledge Token count, milestones, specialist, return channel, and revision.

The companion projection deliberately removes the hero's name and identifier, seed material, inventory labels, evidence content, raw answers, raw prompts, provider sessions, and credential-shaped fields. The state declares `canonicalStateOwner: algoquest`; Scholarium only reads the projection and stages returns.

## Companion MV3

Load `companion/` as an unpacked extension in Chrome or Edge. Its only permissions are:

```json
["activeTab", "scripting", "sidePanel", "storage"]
```

It has no host permissions. The active tab must be a known SecuredMe Education hostname. Unknown pages are rejected. The side panel renders forms from the page manifest, shows the persistent sanitized cockpit, and prepares a pointer-only Qbit return. EXECUTE controls remain disabled when the descriptor is unavailable.

The theme registry covers the twelve locked slugs. Product-specific tokens come from the internal Stitch `DESIGN.md` where present. Missing product design files use the accessible SecuredMe Education fallback and record that fallback in `sourceStatus`; no missing palette is invented. RetailGuard is mapped to the V.I.S Guardian internal workbench source. VAD records both its dark Education workbench and its light cyber-heritage source.

## Evidence Gate

Run from the repository root:

```powershell
node tools/webmcp_evidence_gate.mjs --check --require-b-plus
node tools/webmcp_evidence_gate.mjs --require-b-plus
node tools/webmcp_evidence_gate.mjs --require-b-plus --require-suite-complete
```

The first command is read-only and suitable for tests. The second writes JSON, HTML, Markdown, SARIF, and a SHA-bound receipt under `output/webmcp-evidence/`. The third also fails unless the twelve exports produce 144 descriptors, 122 unique names, 72 journeys, B+ per product, and no absolute barrier. `tools/webmcp-product-matrix.json` declares repository and export candidates; `--manifest=<slug>=<path>` and `--fixtures=<slug>=<path>` can bind a nonstandard export without copying it. Only the two common tool names may repeat across products.

The evaluator checks descriptor counts, global collisions, closed input schemas, modes, handlers or explicit unavailability, execute approval/idempotency shape, fail-closed boundaries, permission minimization, deterministic positive and invalid fixtures, six agentic journeys per product, theme provenance, and WCAG text contrast. Missing sibling exports are reported as `not_available`; they are never synthesized.

The local score reserves five discovery points for live browser qualification. A local A- therefore does not claim that Chrome or Edge discovery ran. Browser versions, WebMCP flags, extension loading, actual `getTools()` discovery, and the same journeys in both browsers remain separate qualification evidence.

## Known gaps

- Live Chrome and Edge discovery are not executed by the local CLI.
- The execute publication wrapper is intentionally unavailable pending a server-side one-use approval and idempotency contract.
- Other product manifests and handlers remain owned by their product repositories; this repository does not simulate them.
- The companion stores only a sanitized local projection. Cross-product durable Hero Book persistence remains an AlgoQuest-owned integration task.
