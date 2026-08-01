"""Compatibility entry point used by the signed GitHub Pages workflow."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / ".suite-sources"


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def main() -> None:
    run(
        sys.executable,
        "tools/sync_suite_docs.py",
        "--fetch",
        "--source-root",
        str(SOURCE_ROOT),
    )
    run(
        sys.executable,
        "tools/validate_sphinx_portal.py",
        "--source-root",
        str(SOURCE_ROOT),
    )


if __name__ == "__main__":
    main()
