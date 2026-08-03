from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AdapterResult:
    available: bool
    status: str
    payload: dict[str, Any]


@dataclass(frozen=True)
class CapabilityManifest:
    """A reviewed, non-pedagogical external observer contract.

    The manifest is intentionally not inferred from a caller supplied route.
    A module must be separately reviewed before it can be placed in the
    published capability registry.
    """

    capability_id: str
    server_version: str
    image_digest: str
    route: str
    method: str
    encoding: str
    permitted_profiles: tuple[str, ...]
    retain_request: bool = False
    retain_response: bool = False
    mesh_enabled: bool = False
    can_change_mastery: bool = False

    def __post_init__(self) -> None:
        if not self.route.startswith("/v1/") or "{" in self.route:
            raise ValueError("capability routes must be fixed /v1 paths")
        if self.method not in {"GET", "POST"}:
            raise ValueError("capability method is not allowed")
        if not self.image_digest.startswith("sha256:"):
            raise ValueError("capability image must be pinned by sha256 digest")
        if self.retain_request or self.retain_response or self.mesh_enabled or self.can_change_mastery:
            raise ValueError("Scholarium observer capabilities are non-retaining, non-mesh, and non-authoritative")


class CodeProjectAdapter:
    """Fail-closed health client; generic inference dispatch is forbidden."""

    def __init__(self, base_url: str | None, timeout_seconds: float = 2.0):
        self.base_url = base_url.rstrip("/") if base_url else None
        self.timeout_seconds = timeout_seconds

    def health(self) -> AdapterResult:
        if not self.base_url:
            return AdapterResult(False, "not_configured", {})
        request = urllib.request.Request(f"{self.base_url}/v1/status/ping", method="GET")
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read(16_000))
            return AdapterResult(True, "available", body if isinstance(body, dict) else {})
        except (urllib.error.URLError, TimeoutError, ValueError, json.JSONDecodeError):
            return AdapterResult(False, "unavailable", {})

    def observe(self, manifest: CapabilityManifest, payload: bytes, subject_kind: str) -> AdapterResult:
        """Do not dispatch until a server capability registry is implemented.

        This explicit abstention prevents a generic route from becoming an
        accidental authority or silently sending raw observations to an
        unreviewed CodeProject module.
        """

        del manifest, payload, subject_kind
        return AdapterResult(False, "capability_not_activated", {})


class TelemetrySink:
    """Optional derived-event sink. Canonical decisions never depend on it."""

    def emit(self, event: dict[str, Any]) -> bool:
        return False
