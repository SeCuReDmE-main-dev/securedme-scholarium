from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from worker_adapter import canonical_json, reserve_nonce, verify_manifest


SECRET = "synthetic-media-manifest-secret-000000000000000000000000"


def manifest() -> dict:
    issued = datetime(2026, 7, 15, 20, 0, tzinfo=timezone.utc)
    payload = {
        "schema": "scholarium.quantech-media-job.v1",
        "jobId": "job-001",
        "requestId": "request-001",
        "nonce": "nonce-001",
        "issuedAt": issued.isoformat().replace("+00:00", "Z"),
        "expiresAt": (issued + timedelta(minutes=10)).isoformat().replace("+00:00", "Z"),
        "provider": {"endpoint": "http://127.0.0.1:7476", "loopbackOnly": True},
    }
    signature = hmac.new(SECRET.encode(), canonical_json(payload).encode(), hashlib.sha256).hexdigest()
    return {**payload, "signature": f"hmac-sha256:{signature}"}


def test_verifies_signature_lifetime_and_loopback() -> None:
    value = manifest()
    verified = verify_manifest(value, SECRET, datetime(2026, 7, 15, 20, 5, tzinfo=timezone.utc))
    assert verified["jobId"] == "job-001"
    value["provider"]["endpoint"] = "https://example.com"
    with pytest.raises(ValueError, match="loopback"):
        verify_manifest(value, SECRET, datetime(2026, 7, 15, 20, 5, tzinfo=timezone.utc))


def test_rejects_tampering_expiry_and_nonce_replay(tmp_path: Path) -> None:
    value = manifest()
    current = datetime(2026, 7, 15, 20, 5, tzinfo=timezone.utc)
    tampered = json.loads(json.dumps(value))
    tampered["jobId"] = "changed"
    with pytest.raises(ValueError, match="signature mismatch"):
        verify_manifest(tampered, SECRET, datetime(2026, 7, 15, 20, 5, tzinfo=timezone.utc))
    with pytest.raises(ValueError, match="expired"):
        verify_manifest(value, SECRET, datetime(2026, 7, 15, 20, 11, tzinfo=timezone.utc))
    ledger = tmp_path / "nonces.json"
    reserve_nonce(verify_manifest(value, SECRET, current), ledger, current)
    with pytest.raises(ValueError, match="already used"):
        reserve_nonce(verify_manifest(value, SECRET, current), ledger, current)
