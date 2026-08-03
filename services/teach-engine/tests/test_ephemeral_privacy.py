import io
import os
import struct
import time
import wave
from pathlib import Path

import pytest
from datetime import datetime, timezone

from scholarium_teach_engine.ephemeral_observation import observe_ephemeral_wav
from scholarium_teach_engine.models import EphemeralObservationRequest
from scholarium_teach_engine.privacy import (
    EducatorLearnerAssignment,
    OrganizationAggregate,
    PrivacyScope,
    TransactionBoundary,
    TransactionKind,
    may_view_learner_projection,
)
from scholarium_teach_engine.models import TelemetryEvent
from scholarium_teach_engine.telemetry import admit_derived_event
from scholarium_teach_engine.auth import signature
from scholarium_teach_engine.adapters import CapabilityManifest, CodeProjectAdapter


def _wav() -> bytes:
    stream = io.BytesIO()
    with wave.open(stream, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(16_000)
        output.writeframes(b"".join(struct.pack("<h", 3000 if index % 2 else -3000) for index in range(4_000)))
    return stream.getvalue()


def _request(**updates):
    base = {"request_id": "request-1", "observation_id": "observation-1", "purpose": "audio_quality", "consent": True, "subject_kind": "consenting_adult", "content_type": "audio/wav"}
    return EphemeralObservationRequest(**(base | updates))


def test_ephemeral_audio_returns_only_buckets_and_purge_proof():
    result = observe_ephemeral_wav(_request(), _wav())
    assert result.status == "observed"
    assert result.quality_bucket == "usable"
    assert result.purge_receipt.input_retained is False
    assert result.purge_receipt.raw_features_retained is False
    assert "vot" not in result.model_dump_json().lower()
    assert "mfcc" not in result.model_dump_json().lower()


def test_ephemeral_audio_rejects_minor_before_analysis():
    result = observe_ephemeral_wav(_request(subject_kind="minor"), _wav())
    assert result.status == "rejected"
    assert result.reason == "minor_pilot_blocked"
    assert result.can_change_mastery is False


def test_organization_aggregates_require_k_anonymity_and_no_personal_fields():
    valid = OrganizationAggregate(aggregate_id="aggregate-1", organization_scope="organization-1", metric_key="decision_count", time_bucket="2026-08-02T12:00:00Z", cohort_size=10, value_integer=30, source_window_digest="sha256:" + "a" * 64)
    assert valid.cohort_size == 10
    with pytest.raises(ValueError):
        OrganizationAggregate(aggregate_id="aggregate-2", organization_scope="organization-1", metric_key="decision_count", time_bucket="2026-08-02T12:00:00Z", cohort_size=9, value_integer=30, source_window_digest="sha256:" + "a" * 64)


def test_only_active_explicit_assignment_can_view_learner_projection():
    assignment = EducatorLearnerAssignment(assignment_id="assignment-1", educator_pseudonym="educator-1", learner_pseudonym="learner-1", status="active", expires_at="2026-09-01T00:00:00Z")
    assert may_view_learner_projection(requester_pseudonym="educator-1", learner_pseudonym="learner-1", assignments=(assignment,), now="2026-08-02T00:00:00Z")
    assert not may_view_learner_projection(requester_pseudonym="director-1", learner_pseudonym="learner-1", assignments=(assignment,), now="2026-08-02T00:00:00Z")


def test_non_learning_transactions_cannot_change_mastery_or_leak_telemetry():
    with pytest.raises(ValueError):
        TransactionBoundary(transaction_id="transaction-1", kind=TransactionKind.EPHEMERAL_OBSERVATION, source_digest="sha256:" + "a" * 64, destination_scope=PrivacyScope.LEARNER_PRIVATE, can_change_mastery=True)
    with pytest.raises(ValueError):
        TransactionBoundary(transaction_id="transaction-2", kind=TransactionKind.TELEMETRY, source_digest="sha256:" + "a" * 64, destination_scope=PrivacyScope.ORGANIZATION_AGGREGATE, contains_audio=True)


def test_telemetry_projection_rejects_personal_raw_or_audio_data():
    base = {"event_id": "event-1", "occurred_at": datetime.now(timezone.utc), "event_type": "decision", "block_id": "block-1", "block_version": "1.0.0", "latency_ms": 30}
    assert admit_derived_event(TelemetryEvent(**base))["contains_identity"] is False
    with pytest.raises(ValueError):
        TelemetryEvent(**base, contains_audio=True)


def test_audio_endpoint_requires_hmac_and_returns_non_authoritative_purge_receipt(monkeypatch):
    from fastapi.testclient import TestClient

    monkeypatch.setenv("SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET", "s" * 32)
    monkeypatch.setenv("SCHOLARIUM_TEACH_PACK_ROOT", str(Path(__file__).resolve().parents[1] / "packs"))
    from scholarium_teach_engine.app import app

    payload = _wav()
    timestamp, nonce, path = str(int(time.time())), "nonce-audio-1", "/internal/v1/audio-observations"
    signed = signature("s" * 32, "POST", path, int(timestamp), nonce, payload)
    client = TestClient(app)
    denied = client.post(path, content=payload, headers={"content-type": "audio/wav"})
    assert denied.status_code in {401, 503}
    response = client.post(path, content=payload, headers={
        "content-type": "audio/wav",
        "x-teach-timestamp": timestamp,
        "x-teach-nonce": nonce,
        "x-teach-signature": signed,
        "x-teach-request-id": "request-endpoint-1",
        "x-teach-observation-id": "observation-endpoint-1",
        "x-teach-observation-purpose": "audio_quality",
        "x-teach-audio-consent": "granted",
        "x-teach-subject-kind": "consenting_adult",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["can_change_mastery"] is False
    assert body["purge_receipt"]["input_retained"] is False


def test_codeproject_cannot_use_generic_routes_or_change_mastery():
    manifest = CapabilityManifest(
        capability_id="synthetic-quality-observer",
        server_version="2.9.5",
        image_digest="sha256:" + "a" * 64,
        route="/v1/sound/classify",
        method="POST",
        encoding="multipart/form-data",
        permitted_profiles=("synthetic",),
    )
    assert CodeProjectAdapter(None).observe(manifest, b"synthetic", "synthetic").status == "capability_not_activated"
    with pytest.raises(ValueError):
        CapabilityManifest(
            capability_id="unsafe",
            server_version="2.9.5",
            image_digest="sha256:" + "a" * 64,
            route="/v1/{capability}",
            method="POST",
            encoding="application/json",
            permitted_profiles=("synthetic",),
        )
