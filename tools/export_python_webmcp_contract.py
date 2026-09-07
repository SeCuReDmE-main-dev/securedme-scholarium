"""Export a Python WebMCP registry into the suite's static evidence format.

This is intentionally a build-time adapter. It imports a product's maintained
registry, never executes a domain handler, and emits deterministic JSON for the
cross-repository Evidence Gate.
"""

from __future__ import annotations

import argparse
import importlib
import json
import sys
from pathlib import Path


def fixture_value(name: str, schema: dict[str, object]) -> object:
    if name == "approval":
        return {"id": "approval:fixture", "humanConfirmed": True}
    if name == "idempotencyKey":
        return "fixture-idempotency-0001"
    if schema.get("type") == "array" or name.endswith("Ids") or name in {"events", "evidence", "sourceIndexes"}:
        return []
    if schema.get("type") == "object" or name in {"measurements", "payload", "case", "claim"}:
        return {}
    if schema.get("type") in {"number", "integer"}:
        return 1
    if schema.get("type") == "boolean":
        return False
    return "fixture"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    sys.path.insert(0, str(Path.cwd()))
    payload = importlib.import_module(args.module).manifest()
    tools = payload["tools"]
    fixtures: dict[str, object] = {}
    for tool in tools:
        schema = tool["inputSchema"]
        valid = {name: fixture_value(name, schema.get("properties", {}).get(name, {})) for name in schema.get("required", [])}
        item: dict[str, object] = {
            "validInput": valid,
            "invalidInput": {"unexpected": True},
            "expectedStatus": "unavailable" if tool.get("availability") != "available" else "completed" if tool["mode"] == "READ" else "staged" if tool["mode"] == "STAGE" else "executed",
        }
        if tool["mode"] == "EXECUTE":
            item["unauthorizedInput"] = {key: value for key, value in valid.items() if key != "approval"}
            item["expectedUnauthorizedStatus"] = "unavailable" if tool.get("availability") != "available" else "unauthorized"
        fixtures[tool["name"]] = item

    domain = [tool["name"] for tool in tools if tool["name"] not in {"securedme_companion_context", "securedme_qbit_plan_handoff"}]
    common = ["securedme_companion_context", "securedme_qbit_plan_handoff"]
    journeys = [[common[0], domain[index], common[1]] for index in range(6)]

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "manifest.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.output / "fixtures.json").write_text(json.dumps({"schema": "securedme.webmcp.fixtures.v1", "tools": fixtures, "journeys": journeys}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
