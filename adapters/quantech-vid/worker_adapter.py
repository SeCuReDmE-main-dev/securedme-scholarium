from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


SCHEMA = "scholarium.quantech-media-job.v1"
DEFAULT_SECRET_ENV = "SCHOLARIUM_MEDIA_MANIFEST_SECRET"


def canonical_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def parse_time(value: object) -> datetime:
    if not isinstance(value, str):
        raise ValueError("Manifest timestamps must be strings.")
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def verify_manifest(manifest: dict, secret: str, now: datetime | None = None) -> dict:
    if len(secret) < 32:
        raise ValueError("The dedicated media manifest secret must contain at least 32 characters.")
    if manifest.get("schema") != SCHEMA:
        raise ValueError("Unsupported media manifest schema.")
    provider = manifest.get("provider") or {}
    endpoint = str(provider.get("endpoint") or "")
    parsed = urlparse(endpoint)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"} or parsed.port != 7476:
        raise ValueError("QuaNTecH-ViD endpoint must remain loopback port 7476.")
    issued_at = parse_time(manifest.get("issuedAt"))
    expires_at = parse_time(manifest.get("expiresAt"))
    current = now or datetime.now(timezone.utc)
    lifetime = (expires_at - issued_at).total_seconds()
    if expires_at <= current or lifetime < 60 or lifetime > 900:
        raise ValueError("Media manifest is expired or has an invalid lifetime.")
    signature = str(manifest.get("signature") or "")
    if not signature.startswith("hmac-sha256:"):
        raise ValueError("Media manifest signature is missing.")
    unsigned = dict(manifest)
    unsigned.pop("signature", None)
    expected = hmac.new(secret.encode("utf-8"), canonical_json(unsigned).encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature.removeprefix("hmac-sha256:"), expected):
        raise ValueError("Media manifest signature mismatch.")
    return unsigned


def reserve_nonce(manifest: dict, ledger_path: Path, now: datetime | None = None) -> None:
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    active: dict[str, str] = {}
    if ledger_path.exists():
        try:
            active = json.loads(ledger_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            raise ValueError("Nonce ledger cannot be verified.")
    current = now or datetime.now(timezone.utc)
    active = {nonce: expiry for nonce, expiry in active.items() if parse_time(expiry) > current}
    nonce = str(manifest.get("nonce") or "")
    if not nonce or nonce in active:
        raise ValueError("Media manifest nonce is missing or was already used.")
    active[nonce] = str(manifest["expiresAt"])
    temporary = ledger_path.with_suffix(".tmp")
    temporary.write_text(json.dumps(active, indent=2, sort_keys=True), encoding="utf-8")
    temporary.replace(ledger_path)


def request_json(url: str, payload: dict | None = None) -> dict:
    body = canonical_json(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "Scholarium-QuaNTecH-Adapter/1.0"},
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"QuaNTecH-ViD returned HTTP {exc.code}.") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError("QuaNTecH-ViD loopback worker is unavailable.") from exc


def dispatch(manifest: dict, secret: str, ledger_path: Path) -> dict:
    unsigned = verify_manifest(manifest, secret)
    reserve_nonce(unsigned, ledger_path)
    endpoint = unsigned["provider"]["endpoint"].rstrip("/")
    health = request_json(f"{endpoint}/api/v1/health")
    project_path = unsigned["provider"].get("projectManifestPath")
    validation = None
    if project_path:
        validation = request_json(f"{endpoint}/api/v1/projects/validate", {"manifest_path": project_path})
    digest = hashlib.sha256(canonical_json(unsigned).encode("utf-8")).hexdigest()
    return {
        "schema": "scholarium.quantech-worker-receipt.v1",
        "status": "validated" if validation else "needs_local_project_manifest",
        "manifestDigest": f"sha256:{digest}",
        "jobId": unsigned["jobId"],
        "provider": {
            "name": "QuaNTecH-ViD",
            "version": health.get("version"),
            "loopback": health.get("loopback") is True,
        },
        "project": None if not validation else {
            "slug": validation.get("slug"),
            "duration": validation.get("duration"),
            "locales": validation.get("locales"),
            "profiles": validation.get("profiles"),
            "scenes": validation.get("scenes"),
        },
        "renderSubmitted": False,
        "publicationPerformed": False,
        "rawScriptLogged": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify and dispatch a signed Scholarium media manifest to loopback QuaNTecH-ViD.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--ledger", type=Path, default=Path("runtime/scholarium-media-nonces.json"))
    parser.add_argument("--secret-env", default=DEFAULT_SECRET_ENV)
    args = parser.parse_args()
    secret = os.getenv(args.secret_env, "")
    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        receipt = dispatch(manifest, secret, args.ledger)
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "rejected", "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
