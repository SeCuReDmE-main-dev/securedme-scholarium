#!/usr/bin/env python3
"""Fail when the alpha deploy surface drifts from its versioned settings schema."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "infra" / "settings" / "scholarium.teach.settings.v1.json"
COMPOSE_FILES = [
    ROOT / "infra" / "compose" / "compose.alpha.yml",
    ROOT / "infra" / "compose" / "compose.tunnel.yml",
    ROOT / "infra" / "compose" / "compose.observer.yml",
]
DEPLOY = ROOT / "scripts" / "deploy-multipass-alpha.ps1"
PATTERN = re.compile(r"\$\{([A-Z][A-Z0-9_]+)(?::[^}]*)?\}")


def main() -> int:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    allowed = set(schema["settings"])
    referenced = set()
    for path in [*COMPOSE_FILES, DEPLOY]:
        referenced.update(PATTERN.findall(path.read_text(encoding="utf-8")))
    unknown = sorted(referenced - allowed)
    required = {
        key for key, metadata in schema["settings"].items() if metadata.get("required")
    }
    deploy_text = DEPLOY.read_text(encoding="utf-8")
    missing_required = sorted(key for key in required if key not in deploy_text)
    if unknown or missing_required:
        print(json.dumps({"unknown": unknown, "missing_required": missing_required}))
        return 1
    print(json.dumps({"status": "valid", "settings": len(allowed), "referenced": len(referenced)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
