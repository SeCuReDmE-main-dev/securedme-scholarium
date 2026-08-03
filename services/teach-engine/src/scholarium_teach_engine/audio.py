from __future__ import annotations

from .ephemeral_observation import MAX_AUDIO_BYTES, observe_ephemeral_wav
from .models import AudioObservation, EphemeralObservationRequest


def observe_wav(request_id: str, payload: bytes, *, consent: bool, subject_kind: str) -> AudioObservation:
    request = EphemeralObservationRequest(
        request_id=request_id,
        observation_id=f"observation-{request_id}",
        purpose="audio_quality",
        consent=consent,
        subject_kind=subject_kind,
        content_type="audio/wav",
    )
    result = observe_ephemeral_wav(request, payload)
    quality = {"none": 0.0, "low": 0.1, "usable": 0.75}[result.quality_bucket]
    duration = {"none": 0, "under_150ms": 149, "150ms_to_10s": 1_000, "over_10s": 10_000}[result.duration_bucket]
    legacy_reason = "minor_pilot_blocked" if result.reason in {"minor_pilot_blocked", "consent_required"} else result.reason
    return AudioObservation(request_id=request_id, status="observed" if result.status == "observed" else "abstain", quality=quality, confidence=quality, duration_ms=duration, reason=legacy_reason)
