from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "suite-sources.yml"
DOCS = ROOT / "docs"
SELF_REPOSITORY = "securedme-scholarium"
ALLOWED_ASSETS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(*args: str, cwd: Path | None = None) -> str:
    result = subprocess.run(
        args,
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.stdout.strip()


def load_config() -> dict:
    return yaml.safe_load(CONFIG.read_text(encoding="utf-8"))


def fetch_sources(config: dict, source_root: Path) -> None:
    source_root.mkdir(parents=True, exist_ok=True)
    organization = config["organization"]
    for item in config["tools"]:
        # The aggregator owns this script and its own documentation contract.
        # In CI, use the checked-out commit instead of cloning an older ref of
        # the repository currently being built.
        if item["repository"] == SELF_REPOSITORY:
            continue
        destination = source_root / item["repository"]
        if not destination.exists():
            destination.mkdir(parents=True)
            run("git", "init", cwd=destination)
            run(
                "git",
                "remote",
                "add",
                "origin",
                f"https://github.com/{organization}/{item['repository']}.git",
                cwd=destination,
            )
        run(
            "git",
            "fetch",
            "--filter=blob:none",
            "--depth",
            "1",
            "origin",
            item["ref"],
            cwd=destination,
        )
        run("git", "sparse-checkout", "init", "--cone", cwd=destination)
        run("git", "sparse-checkout", "set", "docs", cwd=destination)
        run("git", "checkout", "--detach", item["ref"], cwd=destination)
        contract = read_contract(destination)
        logo_parent = Path(contract["identity"]["logo"]).parent.as_posix()
        sparse_paths = ["docs"]
        if logo_parent != ".":
            sparse_paths.append(logo_parent)
        run("git", "sparse-checkout", "set", *sparse_paths, cwd=destination)


def resolve_repository_root(source_root: Path, repository: str) -> Path:
    if repository == SELF_REPOSITORY:
        return ROOT
    return source_root / repository


def read_contract(repository_root: Path) -> dict:
    contract_path = repository_root / "docs" / "tool-doc.yml"
    if not contract_path.exists():
        raise SystemExit(f"Missing tool-doc.v2 contract: {contract_path}")
    contract = yaml.safe_load(contract_path.read_text(encoding="utf-8"))
    if contract.get("schema") != "securedme.tool-doc.v2":
        raise SystemExit(f"Unsupported documentation contract: {contract_path}")
    return contract


def copy_public_tree(source: Path, destination: Path) -> list[dict[str, str]]:
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    files: list[dict[str, str]] = []
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ALLOWED_ASSETS | {".md"}:
            continue
        relative = path.relative_to(source)
        if any(part.startswith(".") for part in relative.parts):
            continue
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        files.append({"path": relative.as_posix(), "sha256": sha256(target)})
    return files


def copy_logo(repository_root: Path, contract: dict) -> str:
    source = repository_root / contract["identity"]["logo"]
    if not source.exists():
        raise SystemExit(f"Missing identity asset: {source}")
    suffix = source.suffix.lower()
    target_dir = DOCS / "_static" / "tools" / contract["slug"]
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"logo{suffix}"
    shutil.copy2(source, target)
    return f"_static/tools/{contract['slug']}/{target.name}"


def render_index(contracts: list[dict]) -> str:
    lines = [
        "# Tool library",
        "",
        "The Education catalogue is the public entry point. This library exposes the technical contract behind every destination.",
        "",
        "| Tool | Runtime | Status | Documentation | Source |",
        "| --- | --- | --- | --- | --- |",
    ]
    for contract in contracts:
        lines.append(
            f"| {contract['title']} | `{contract['runtime']['type']}` | "
            f"{contract['status']} | [Open](./{contract['slug']}/index.md) | "
            f"[GitHub]({contract['source']['repository']}) |"
        )
    lines.extend(["", "```{toctree}", ":maxdepth: 2", ":hidden:", ""])
    lines.extend(f"{contract['slug']}/index" for contract in contracts)
    lines.extend(["```", ""])
    return "\n".join(lines)


def synchronize(source_root: Path) -> dict:
    config = load_config()
    contracts: list[dict] = []
    lock_entries: list[dict] = []
    for item in config["tools"]:
        repository_root = resolve_repository_root(source_root, item["repository"])
        contract = read_contract(repository_root)
        if contract["slug"] != item["slug"]:
            raise SystemExit(
                f"Slug mismatch for {item['repository']}: {contract['slug']} != {item['slug']}"
            )
        public_root = repository_root / contract["documentation"]["public_root"]
        if not public_root.exists():
            raise SystemExit(f"Missing public documentation root: {public_root}")
        files = copy_public_tree(public_root, DOCS / "tools" / contract["slug"])
        logo = copy_logo(repository_root, contract)
        contracts.append(contract)
        lock_entries.append(
            {
                "slug": contract["slug"],
                "repository": item["repository"],
                "requested_ref": item["ref"],
                "resolved_commit": run("git", "rev-parse", "HEAD", cwd=repository_root),
                "contract_sha256": sha256(repository_root / "docs" / "tool-doc.yml"),
                "logo": logo,
                "files": files,
            }
        )
    (DOCS / "tools" / "index.md").write_text(
        render_index(contracts), encoding="utf-8", newline="\n"
    )
    lock = {
        "schema": "securedme.suite-docs-lock.v2",
        "canonical_url": config["canonical_docs_url"],
        "catalog_url": config["catalog_url"],
        "tools": lock_entries,
    }
    lock_path = DOCS / "data" / "suite-docs-lock.json"
    lock_path.write_text(
        json.dumps(lock, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Synchronized {len(contracts)} tool documentation contracts")
    return lock


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=ROOT.parent)
    parser.add_argument("--fetch", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_root = args.source_root.resolve()
    config = load_config()
    if args.fetch:
        fetch_sources(config, source_root)
    synchronize(source_root)


if __name__ == "__main__":
    main()
