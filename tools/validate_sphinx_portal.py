from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import yaml
import polib


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CONFIG = ROOT / "suite-sources.yml"
SELF_REPOSITORY = "securedme-scholarium"
REQUIRED_CONTRACT_KEYS = {
    "schema",
    "slug",
    "title",
    "version",
    "status",
    "license",
    "summary",
    "identity",
    "runtime",
    "source",
    "documentation",
    "commands",
    "boundaries",
}
REQUIRED_PUBLIC_PAGES = {
    "index.md",
    "quickstart.md",
    "architecture.md",
    "interfaces.md",
    "operations.md",
}
RUNTIME_TYPES = {"browser-app", "local-app", "cli", "api", "research"}
BLOCKED_PARTS = {
    "node_modules",
    "node_modules.a1-incomplete",
    ".git",
    ".venv",
    "dist",
    "build",
    "coverage",
    "__pycache__",
}


def resolve_repository_root(source_root: Path, repository: str) -> Path:
    if repository == SELF_REPOSITORY:
        return ROOT
    return source_root / repository


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"[FAIL] {message}")
    print(f"[OK] {message}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=ROOT.parent)
    return parser.parse_args()


def validate_contract(repository_root: Path, expected: dict) -> dict:
    path = repository_root / "docs" / "tool-doc.yml"
    require(path.exists(), f"{expected['repository']} exposes docs/tool-doc.yml")
    contract = yaml.safe_load(path.read_text(encoding="utf-8"))
    missing = REQUIRED_CONTRACT_KEYS - set(contract)
    require(not missing, f"{expected['repository']} contract has every required key")
    require(contract["schema"] == "securedme.tool-doc.v2", f"{contract['slug']} uses tool-doc.v2")
    require(contract["slug"] == expected["slug"], f"{contract['slug']} matches suite registry")
    require(contract["runtime"]["type"] in RUNTIME_TYPES, f"{contract['slug']} runtime is supported")
    logo = repository_root / contract["identity"]["logo"]
    require(logo.is_file(), f"{contract['slug']} identity asset exists")
    public_root = repository_root / contract["documentation"]["public_root"]
    require(public_root.is_dir(), f"{contract['slug']} public docs root exists")
    public_pages = {path.name for path in public_root.glob("*.md")}
    require(
        REQUIRED_PUBLIC_PAGES <= public_pages,
        f"{contract['slug']} exposes the five standard technical pages",
    )
    for file_path in public_root.rglob("*"):
        if file_path.is_file():
            require(
                not any(part in BLOCKED_PARTS for part in file_path.parts),
                f"{contract['slug']} allowlist excludes dependency and build paths",
            )
    return contract


def validate_prompts() -> None:
    prompt_root = DOCS / "prompts"
    prompt_pages = sorted(prompt_root.glob("CP-*.md"))
    require(len(prompt_pages) == 40, "exactly 40 collaboration prompt pages exist")
    expected = [f"CP-{number:02d}" for number in range(1, 41)]
    actual = [path.stem for path in prompt_pages]
    require(actual == expected, "prompt identifiers are continuous from CP-01 to CP-40")
    for path in prompt_pages:
        text = path.read_text(encoding="utf-8")
        require(
            all(marker in text for marker in ("## English", "## Francais", "## Espanol")),
            f"{path.stem} contains all three language contracts",
        )
        require("HUMAN STOP" in text, f"{path.stem} contains an explicit human stop")
    prompt_data = json.loads((DOCS / "data" / "collaboration-prompts.json").read_text(encoding="utf-8"))
    records = prompt_data["prompts"]
    require(prompt_data["schema"] == "securedme.collaboration-prompts.v2", "prompt manifest uses v2 schema")
    require(len(records) == 40, "prompt manifest contains exactly 40 records")
    metadata = {"tool", "role", "difficulty", "task_type", "result_type", "expected_result"}
    require(all(metadata <= set(record) for record in records), "every prompt exposes all filter metadata")
    require(len({record["id"] for record in records}) == 40, "prompt manifest identifiers are unique")
    index = (prompt_root / "index.md").read_text(encoding="utf-8")
    require('data-se-filter-panel="prompts"' in index, "prompt index exposes the interactive filter contract")


def validate_learning_assets() -> None:
    quickstarts = list((DOCS / "tools").glob("*/quickstart.md"))
    require(len(quickstarts) == 12, "all twelve tools expose a quickstart")
    require(
        (DOCS / "getting-started" / "15-minute-tutorial.md").exists(),
        "suite-level 15-minute tutorial exists",
    )
    video_data = json.loads((DOCS / "data" / "video-library.json").read_text(encoding="utf-8"))
    videos = video_data["videos"]
    require(bool(videos), "video library is not empty")
    require(len({video["video_id"] for video in videos}) == len(videos), "video identifiers are unique")
    require(video_data["schema"] == "securedme.video-library.v2", "video manifest uses v2 schema")
    required = {
        "video_id",
        "title",
        "date",
        "language",
        "tool",
        "topic",
        "duration_seconds",
        "format",
        "url",
        "thumbnail",
        "paired_video_id",
        "transcript",
    }
    require(all(required <= set(video) for video in videos), "every video exposes required metadata")
    video_ids = {video["video_id"] for video in videos}
    require(
        all(not video["paired_video_id"] or video["paired_video_id"] in video_ids for video in videos),
        "every declared video pair resolves inside the manifest",
    )
    require(
        all(isinstance(video["transcript"], dict) and "status" in video["transcript"] for video in videos),
        "every video declares transcript availability without inventing content",
    )
    page = (DOCS / "media" / "video-library.md").read_text(encoding="utf-8")
    require('data-se-filter-panel="videos"' in page, "video library exposes the interactive filter contract")


def validate_translations() -> None:
    for language in ("fr", "es"):
        locale_root = DOCS / "locales" / language / "LC_MESSAGES"
        catalogs = sorted(locale_root.rglob("*.po"))
        require(len(catalogs) == 105, f"{language} exposes all 105 gettext catalogs")
        entries = [entry for path in catalogs for entry in polib.pofile(str(path)) if not entry.obsolete]
        require(all(entry.msgstr for entry in entries), f"{language} gettext entries are complete")
        translated = sum(entry.msgstr != entry.msgid for entry in entries)
        require(translated >= 150, f"{language} contains substantive localized documentation")
        for slug in (
            "algoquest-qbit",
            "algorithm-builder",
            "ffed-qlc",
            "fnp-qnn",
            "fnpqnn-gateway",
            "quanthor",
            "retailguard",
            "scholarium",
            "synthia",
            "tesla-workbench",
            "visual-algorithm-designer",
            "vot-guardian",
        ):
            page = polib.pofile(str(locale_root / "tools" / slug / "index.po"))
            require(
                sum(entry.msgstr != entry.msgid for entry in page if not entry.obsolete) >= 3,
                f"{language} localizes the {slug} entry page",
            )


def main() -> None:
    args = parse_args()
    config = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    require(config["schema"] == "securedme.suite-sources.v2", "suite registry uses v2 schema")
    require(len(config["tools"]) == 12, "suite registry contains exactly twelve tools")
    slugs = [item["slug"] for item in config["tools"]]
    require(len(set(slugs)) == 12, "suite tool slugs are unique")
    contracts = [
        validate_contract(resolve_repository_root(args.source_root, item["repository"]), item)
        for item in config["tools"]
    ]
    require(len(contracts) == 12, "all tool documentation contracts validate")
    validate_prompts()
    validate_learning_assets()
    validate_translations()
    require((DOCS / "conf.py").exists(), "Sphinx configuration exists")
    print("Sphinx portal contract validation passed")


if __name__ == "__main__":
    main()
