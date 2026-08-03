"""Derived telemetry admission. This module has no access to learner state."""

from __future__ import annotations

from .models import TelemetryEvent


class TelemetryAdmissionError(ValueError):
    pass


def admit_derived_event(event: TelemetryEvent) -> dict[str, object]:
    """Return a compact insert projection or reject personal/raw data."""
    if event.contains_identity or event.contains_raw_answer or event.contains_audio:
        raise TelemetryAdmissionError("telemetry_contains_prohibited_data")
    return {
        "occurred_at": event.occurred_at.isoformat(),
        "event_id": event.event_id,
        "event_type": event.event_type,
        "block_id": event.block_id,
        "block_version": event.block_version,
        "decision_digest": event.decision_digest,
        "latency_ms": event.latency_ms,
        "error_code": event.error_code,
        "contains_identity": False,
        "contains_raw_answer": False,
        "contains_audio": False,
    }
