"""Make the legacy signed MkDocs workflow deploy the Sphinx output."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def on_post_build(config, **kwargs) -> None:
    source_root = ROOT / ".suite-sources"
    subprocess.run(
        [
            sys.executable,
            "tools/build_sphinx_docs.py",
            "--source-root",
            str(source_root),
            "--clean",
            "--skip-sync",
        ],
        cwd=ROOT,
        check=True,
    )
    site_dir = Path(config.site_dir)
    sphinx_output = ROOT / "build" / "html"
    if site_dir.exists():
        shutil.rmtree(site_dir)
    shutil.copytree(sphinx_output, site_dir)
