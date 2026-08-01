from __future__ import annotations

import json
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
SUITE = REPO.parent
CATALOG = REPO / "docs" / "data" / "tools.json"
OUTPUT = REPO / "docs" / "tools"


def github_root(repository: str) -> str:
    return f"https://github.com/SeCuReDmE-main-dev/{repository}"


def stack_signals(root: Path) -> list[str]:
    signals: list[str] = []
    if (root / "package.json").exists():
        signals.append("Node.js / JavaScript")
    if (root / "pyproject.toml").exists() or (root / "requirements.txt").exists():
        signals.append("Python")
    if (root / "mkdocs.yml").exists():
        signals.append("MkDocs documentation")
    return signals or ["See the repository README"]


def document_links(root: Path, repository: str) -> list[str]:
    labels = {
        "README.md": "Project README",
        "CONTRIBUTING.md": "Contribution guide",
        "SECURITY.md": "Security policy",
        "SAFETY.md": "Safety boundary",
        "LICENSE": "License",
        "AGENTS.md": "Agent instructions",
    }
    links: list[str] = []
    for filename, label in labels.items():
        if (root / filename).exists():
            links.append(f"- [{label}]({github_root(repository)}/blob/HEAD/{filename})")
    return links


def render_tool(tool: dict[str, str]) -> str:
    root = SUITE / tool["repo"]
    repo_url = github_root(tool["repo"])
    signals = ", ".join(f"`{item}`" for item in stack_signals(root))
    links = "\n".join(document_links(root, tool["repo"]))
    return f"""# {tool['title']}

<div class="se-tool-meta">
  <span>{tool['classification']}</span>
  <span>Developer guide</span>
</div>

{tool['summary']}

## Start here

1. Read the repository README before installing anything.
2. Read `CONTRIBUTING.md` before changing code or opening an issue.
3. Confirm the active branch and local changes with `git status --short --branch`.
4. Use the repository's declared environment and lockfiles.
5. Run the documented checks before proposing a change.

```powershell
git clone {repo_url}.git
cd {tool['repo']}
git status --short --branch
```

!!! important "Human review boundary"
    Generated output, simulations, classifications, and agent suggestions remain reviewable artifacts. They do not become scientific, legal, security, or editorial authority by themselves.

## Technology signals

{signals}

These signals are detected from public repository files. The README remains authoritative for exact installation and execution commands.

## Developer workflow

```text
Understand the boundary -> reproduce the current state -> make one bounded change
-> run the relevant checks -> inspect the diff -> document limits
```

## Canonical project documents

{links}

## Open the project

- [Public project surface]({tool['public_url']})
- [Source repository]({repo_url})
- [Issues]({repo_url}/issues)
"""


def render_index(tools: list[dict[str, str]]) -> str:
    cards = []
    for tool in tools:
        cards.append(
            f"""<a class="se-doc-card" href="{tool['slug']}/">
  <strong>{tool['title']}</strong>
  <span>{tool['classification']}</span>
  <p>{tool['summary']}</p>
</a>"""
        )
    return """# Developer tool library

Twelve public tool guides, one consistent onboarding contract. Each page points back to the repository documents that remain authoritative for installation, contribution, safety, and licensing.

<div class="se-doc-grid">
""" + "\n".join(cards) + "\n</div>\n"


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    tools = data["tools"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "index.md").write_text(render_index(tools), encoding="utf-8", newline="\n")
    for tool in tools:
        (OUTPUT / f"{tool['slug']}.md").write_text(
            render_tool(tool), encoding="utf-8", newline="\n"
        )
    print(f"Generated {len(tools)} developer guides in {OUTPUT}")


if __name__ == "__main__":
    main()
