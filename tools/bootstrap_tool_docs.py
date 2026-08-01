from __future__ import annotations

import argparse
import shutil
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
SUITE = ROOT.parent


TOOLS = [
    {
        "slug": "algoquest-qbit", "repo": "algoquest-ams-discovry-labs-module-", "title": "AlgoQuest Qbit Education", "version": "0.0.0", "status": "public-preview", "license": "LicenseRef-SEL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://algoquest.securedme.ca", "logo": "assets/brand-selected/algoquest-logo-lockup.png",
        "summary": "Interactive algorithm learning through bounded, inspectable challenges for students and teachers.",
        "install": ["npm install"], "start": ["npm run dev"], "test": ["npm test"],
        "interfaces": ["React learning interface", "Teacher planning surface", "Vite development server"],
        "architecture": "A React and TypeScript learning client organized around challenges, guided planning, and reviewable learner actions.",
        "boundary": "Learning output is formative evidence. It is not a credential, assessment authority, or autonomous teaching decision.",
    },
    {
        "slug": "algorithm-builder", "repo": "algorithm-builder-app", "title": "Algorithm Builder", "version": "1.0.0", "status": "in-development", "license": "LicenseRef-SEL-2.0", "runtime": "browser-app", "availability": "pending", "url": "https://algorithm-builder.securedme.ca", "logo": "docs/assets/education/education-icon.png",
        "summary": "A visual workspace for composing, inspecting, and explaining algorithm structures.",
        "install": ["npm install"], "start": ["npm start"], "test": ["npm test"],
        "interfaces": ["React visual builder", "Express service", "WebSocket collaboration channel"],
        "architecture": "A React client and Express service coordinate visual graph editing, persistence, and inspectable algorithm structure.",
        "boundary": "The builder supports explanation and experimentation; generated structures remain subject to code review and tests.",
    },
    {
        "slug": "ffed-qlc", "repo": "FfeD-QLC-MVP", "title": "FfeD-QLC", "version": "0.1.0", "status": "public-preview", "license": "LicenseRef-SECL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://ffed-qlc.securedme.ca", "logo": "assets/Logo Final.png",
        "summary": "A bounded admissibility workbench for structured quantum and logical-computation experiments.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -e .[dev]", "npm install"], "start": ["npm run dev", ".venv\\Scripts\\ffed-qlc --help"], "test": [".venv\\Scripts\\python -m pytest", "npm run build"],
        "interfaces": ["Vite research workbench", "ffed-qlc command line", "Optional FastAPI adapter"],
        "architecture": "A Python admissibility core is exposed through bounded CLI, API, and browser-facing study surfaces.",
        "boundary": "Candidate admission is a software decision trace, not proof of a physical or quantum claim.",
    },
    {
        "slug": "fnp-qnn", "repo": "FNP-QNN-MVP", "title": "FNP-QNN", "version": "1.3.0a0", "status": "public-preview", "license": "LicenseRef-SEL-2.0", "runtime": "local-app", "availability": "verified", "url": "https://fnpqnn.securedme.ca", "logo": "web/landing/assets/fnp-qnn-logo.png",
        "summary": "A governed local simulator for repeatable mathematical and neural-network experiments.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -e ."], "start": [".venv\\Scripts\\fnp-qnn --help", ".venv\\Scripts\\fnp-qnn-tui"], "test": [".venv\\Scripts\\python -m pytest"],
        "interfaces": ["fnp-qnn CLI", "fnp-qnn TUI", "FastAPI simulator service", "Local operator panel"],
        "architecture": "A Python simulator core feeds CLI, TUI, API, and optional containerized services while retaining an inspectable event trail.",
        "boundary": "Simulation, surrogate output, and numerical agreement do not constitute physical detection or experimental validation.",
    },
    {
        "slug": "fnpqnn-gateway", "repo": "fnpqnn_gateway_MVP", "title": "FNP-QNN Gateway", "version": "0.1.0", "status": "local-api", "license": "LicenseRef-SEL-2.0", "runtime": "api", "availability": "pending", "url": "https://gateway.securedme.ca", "logo": "docs/public/assets/fnp-qnn-gateway-logo.png", "copy_logo_from": "FNP-QNN-MVP/web/landing/assets/fnp-qnn-logo.png",
        "summary": "The shared CLI, MCP, and service boundary for controlled FNP-QNN access.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -e ."], "start": [".venv\\Scripts\\fnpqnn-gateway --help", ".venv\\Scripts\\fnpqnn-gateway-mcp"], "test": [".venv\\Scripts\\python -m pytest"],
        "interfaces": ["fnpqnn-gateway CLI", "MCP server", "Typed adapter boundary"],
        "architecture": "A narrow Python gateway converts reviewed client requests into typed simulator and audit operations.",
        "boundary": "The gateway transports and validates requests; it does not convert model output into scientific authority.",
    },
    {
        "slug": "retailguard", "repo": "market-guardian-retailguard", "title": "Market Guardian / RetailGuard", "version": "pre-alpha", "status": "public-preview", "license": "LicenseRef-SECL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://market-guardian.securedme.ca", "logo": "assets/logo/logo dark/5.png",
        "summary": "A defensive retail-security learning environment focused on explainable safeguards and review.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -r requirements.txt"], "start": ["Consult README.md for the selected supervised scenario"], "test": [".venv\\Scripts\\python -m pytest"],
        "interfaces": ["Public defensive learning surface", "Scenario fixtures", "Human review ledger"],
        "architecture": "Defensive scenarios are converted into reviewable risk signals without exposing offensive automation as a product surface.",
        "boundary": "RetailGuard is for prevention, simulation, and supervised defensive education only.",
    },
    {
        "slug": "quanthor", "repo": "QuaNThoR", "title": "QuaNThoR", "version": "pre-alpha", "status": "public-pre-alpha", "license": "LicenseRef-SEL-2.0", "runtime": "local-app", "availability": "verified", "url": "https://quanthor.securedme.ca", "logo": "assets/Logo branding 1th draft/first draft.png",
        "summary": "A formalization coach that moves informal mathematical claims toward reviewable structure.",
        "install": ["docker compose build"], "start": ["docker compose up", "Open http://localhost:5050"], "test": ["Invoke-WebRequest http://localhost:5050/health"],
        "interfaces": ["Local proof editor", "POST /verify", "POST /route", "POST /draft", "Optional HippoRAG retrieval"],
        "architecture": "A local editor routes claims through bounded drafting, verification, provenance, and optional retrieval services.",
        "boundary": "Formalization assistance does not establish a theorem until an accepted proof and qualified review exist.",
    },
    {
        "slug": "scholarium", "repo": "securedme-scholarium", "title": "SecuredMe Scholarium", "version": "pre-alpha", "status": "public-pre-alpha", "license": "LicenseRef-SEL-2.0", "runtime": "browser-app", "availability": "pending", "url": "https://scholarium.securedme.ca", "logo": "apps/web/public/brand/logos/final/1.webp",
        "summary": "The public education and research commons and the suite documentation aggregator.",
        "install": ["cd apps/web", "npm install"], "start": ["npm run dev"], "test": ["npm test", "npm run build"],
        "interfaces": ["Public research commons", "Teach workspace", "Publication routes", "Sphinx documentation aggregator"],
        "architecture": "A public web application and a separate static documentation pipeline share reviewed suite metadata without sharing private state.",
        "boundary": "Scholarium organizes and publishes reviewed material; it is not an academic, legal, or taxonomic authority.",
    },
    {
        "slug": "synthia", "repo": "Synthia", "title": "Synthia", "version": "0.1.0", "status": "public-preview", "license": "LicenseRef-SEL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://synthia.securedme.ca", "logo": "assets/logo/light/logo 4 light .png",
        "summary": "A traceability system for scientific candidate memories, lexicons, sources, and uncertainty.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -e ."], "start": [".venv\\Scripts\\synthia --help"], "test": [".venv\\Scripts\\python -m pytest"],
        "interfaces": ["synthia CLI", "Static trace lab", "Candidate-memory manifest", "Optional RethinkDB adapter"],
        "architecture": "A Python taxonomy-memory core emits traceable candidate records for human review and optional persistence.",
        "boundary": "Preserve I -> I_system^S -> H_lex -> G_lex -> I_lexicon; Synthia supports traceability and does not certify taxonomy or science.",
    },
    {
        "slug": "tesla-workbench", "repo": "tesla-resonance-recovery-workbench", "title": "Tesla Resonance Recovery Workbench", "version": "0.1.0", "status": "local-research", "license": "LicenseRef-SEL-2.0", "runtime": "research", "availability": "pending", "url": "https://tesla-recovery.securedme.ca", "logo": "docs/assets/education/education-icon.png",
        "summary": "A reproducible local workbench for recovery, comparison, and validation of resonance records.",
        "install": ["python -m venv .venv", ".venv\\Scripts\\python -m pip install -e ."], "start": ["Consult README.md for a reviewed recovery payload"], "test": [".venv\\Scripts\\python -m pytest"],
        "interfaces": ["Python workbench", "Structured payloads", "Recovery and comparison reports"],
        "architecture": "Local Python modules transform explicit source records into reproducible comparison artifacts.",
        "boundary": "Recovered records and resonance comparisons remain historical or computational evidence, not physical validation.",
    },
    {
        "slug": "vot-guardian", "repo": "V.O.T-Guardian", "title": "V.O.T. Guardian", "version": "pre-alpha", "status": "public-preview", "license": "LicenseRef-SECL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://vot-guardian.securedme.ca", "logo": "web/landing/assets/logo-stamp.png",
        "summary": "A defensive cybersecurity training surface for transparent, human-reviewed threat reasoning.",
        "install": ["Consult README.md and the frontend package manifest"], "start": ["Start the documented supervised frontend workflow"], "test": ["Run the repository test suite before accepting a change"],
        "interfaces": ["Vue defensive training UI", "Scenario review controls", "Explainable evidence surfaces"],
        "architecture": "A defensive interface organizes scenario evidence, explanations, and human acceptance without autonomous enforcement.",
        "boundary": "V.O.T. Guardian must not be used for attack, surveillance, autonomous accusation, or unsupervised enforcement.",
    },
    {
        "slug": "visual-algorithm-designer", "repo": "VisualAlgorithmDesigner", "title": "Visual Algorithm Designer", "version": "pre-alpha", "status": "public-preview", "license": "LicenseRef-SEL-2.0", "runtime": "browser-app", "availability": "verified", "url": "https://visual-algorithm.securedme.ca", "logo": "assets/logo final/Dark/1.png",
        "summary": "A visual editor for assembling, inspecting, testing, and communicating algorithms.",
        "install": ["cd RaySight-frontend", "npm install"], "start": ["npm run dev"], "test": ["npm test", "npm run build"],
        "interfaces": ["React algorithm canvas", "Algorithm palette", "Properties and explanation panels", "Backend service"],
        "architecture": "A React canvas and backend service coordinate graph editing, subpipeline reuse, explanation, and validation.",
        "boundary": "Visual composition does not guarantee algorithmic correctness; tests and code review remain required.",
    },
]


def code_block(commands: list[str]) -> str:
    return "\n".join(commands)


def index_page(tool: dict) -> str:
    interfaces = "\n".join(f"- {item}" for item in tool["interfaces"])
    return f"""# {tool['title']}

<div class="se-tool-header">
  <img src="../../_static/tools/{tool['slug']}/logo{Path(tool['logo']).suffix.lower()}" alt="{tool['title']} identity">
  <div><strong>{tool['title']}</strong><span>{tool['status']} · {tool['runtime']} · version {tool['version']}</span></div>
</div>

{tool['summary']}

## Public status

- **Runtime:** `{tool['runtime']}`
- **Availability:** `{tool['availability']}`
- **License:** `{tool['license']}`
- **Version:** `{tool['version']}`

<div class="se-actions">
  <a href="{tool['url']}">{'Open tool' if tool['runtime'] == 'browser-app' else 'Open technical surface'}</a>
  <a href="https://github.com/SeCuReDmE-main-dev/{tool['repo']}">Source</a>
  <a href="https://github.com/SeCuReDmE-main-dev/{tool['repo']}/issues">Issues</a>
</div>

## Interfaces

{interfaces}

```{{important}}
{tool['boundary']}
```

```{{toctree}}
:maxdepth: 2

quickstart
architecture
interfaces
operations
```
"""


def quickstart_page(tool: dict) -> str:
    return f"""# {tool['title']} quickstart

## Requirements

Use a clean checkout, the runtime declared by the repository, and its committed lockfiles. Confirm the active branch before installing anything.

```powershell
git status --short --branch
```

## Install

```powershell
{code_block(tool['install'])}
```

## Start

```powershell
{code_block(tool['start'])}
```

## Verify

```powershell
{code_block(tool['test'])}
```

## Human acceptance

Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.
"""


def architecture_page(tool: dict) -> str:
    return f"""# Architecture

{tool['architecture']}

## Data flow

```text
Reviewed input -> typed boundary -> tool mechanism -> reviewable artifact -> human decision
```

## Provenance

Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.

## Failure behavior

Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.
"""


def interfaces_page(tool: dict) -> str:
    lines = "\n".join(f"- **{item}:** use only through the documented repository route." for item in tool["interfaces"])
    return f"""# Interfaces

{lines}

## Interface contract

Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.

## Compatibility

Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.
"""


def operations_page(tool: dict) -> str:
    return f"""# Operations and contribution

## Configuration

Keep secrets outside documentation and source control. Use `.env.example` as the public contract and store real values only in the designated local settings surface.

## Testing

Run the repository checks listed in the quickstart. A passing narrow test does not prove unrelated interfaces or scientific claims.

## Troubleshooting

1. Confirm the repository and branch.
2. Reproduce with the smallest supported input.
3. Capture the exact command and error.
4. Check the documented runtime and lockfile.
5. Open an issue with secret-free evidence.

## Security and privacy

{tool['boundary']}

## Contributing

Read `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md`, and the repository license when present. Keep changes bounded and include the checks that justify acceptance.

## Releases

The current public documentation describes `{tool['version']}` with status `{tool['status']}`. Consult the repository history and release notes for changes.
"""


def write_tool(tool: dict, suite: Path) -> None:
    repository = suite / tool["repo"]
    if not repository.exists():
        raise SystemExit(f"Missing repository: {repository}")
    if tool.get("copy_logo_from"):
        source = suite / tool["copy_logo_from"]
        destination = repository / tool["logo"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    contract = {
        "schema": "securedme.tool-doc.v2",
        "slug": tool["slug"],
        "title": tool["title"],
        "version": tool["version"],
        "status": tool["status"],
        "license": tool["license"],
        "summary": tool["summary"],
        "identity": {"logo": tool["logo"], "family": "FNP-QNN" if tool["slug"] == "fnpqnn-gateway" else tool["title"]},
        "runtime": {"type": tool["runtime"], "availability": tool["availability"], "public_url": tool["url"]},
        "source": {"repository": f"https://github.com/SeCuReDmE-main-dev/{tool['repo']}", "issues": f"https://github.com/SeCuReDmE-main-dev/{tool['repo']}/issues"},
        "documentation": {"public_root": "docs/public", "source_language": "en", "languages": ["en", "fr", "es"]},
        "commands": {"install": tool["install"], "start": tool["start"], "test": tool["test"]},
        "boundaries": {"authority": tool["boundary"], "human_review_required": True},
    }
    docs = repository / "docs"
    public = docs / "public"
    public.mkdir(parents=True, exist_ok=True)
    (docs / "tool-doc.yml").write_text(yaml.safe_dump(contract, sort_keys=False, allow_unicode=True), encoding="utf-8", newline="\n")
    pages = {
        "index.md": index_page(tool),
        "quickstart.md": quickstart_page(tool),
        "architecture.md": architecture_page(tool),
        "interfaces.md": interfaces_page(tool),
        "operations.md": operations_page(tool),
    }
    for name, content in pages.items():
        (public / name).write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote tool-doc.v2 and public docs for {tool['title']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--suite-root", type=Path, default=SUITE)
    args = parser.parse_args()
    for tool in TOOLS:
        write_tool(tool, args.suite_root.resolve())


if __name__ == "__main__":
    main()
