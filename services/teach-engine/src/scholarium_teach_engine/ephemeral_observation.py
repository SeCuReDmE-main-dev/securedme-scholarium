"""Tenebris-style ephemeral observations for Teach.

The module overwrites its mutable working buffer and releases references. Python
cannot prove physical zeroisation of every immutable ingress copy, so receipts
make only application-level cleanup claims.
"""

from __future__ import annotations

import io
import math
import wave
from array import array

from .canonical import digest
from .models import EphemeralObservationRequest, EphemeralObservationResult, PurgeReceipt

MAX_AUDIO_BYTES = 2_000_000
MAX_DURATION_MS = 10_000


def _overwrite(buffer: bytearray) -> None:
    for index in range(len(buffer)):
        buffer[index] = 0


def _receipt(observation_id: str, status: str, reason: str) -> PurgeReceipt:
    unsigned = {
        "observation_id": observation_id,
        "status": status,
        "reason": reason,
        "input_retained": False,
        "raw_features_retained": False,
    }
    return PurgeReceipt(**unsigned, receipt_digest=digest(unsigned))


def _result(request: EphemeralObservationRequest, *, status: str, quality_bucket: str, duration_bucket: str, reason: str, purge_status: str, purge_reason: str) -> EphemeralObservationResult:
    return EphemeralObservationResult(
        request_id=request.request_id,
        observation_id=request.observation_id,
        status=status,
        quality_bucket=quality_bucket,
        duration_bucket=duration_bucket,
        reason=reason,
        purge_receipt=_receipt(request.observation_id, purge_status, purge_reason),
    )


def observe_ephemeral_wav(request: EphemeralObservationRequest, payload: bytes) -> EphemeralObservationResult:
    """Inspect WAV signal quality only; no voice features leave this function."""
    buffer = bytearray(payload)
    try:
        if request.content_type not in {"audio/wav", "audio/x-wav"}:
            return _result(request, status="rejected", quality_bucket="none", duration_bucket="none", reason="content_type_rejected", purge_status="application_buffer_overwritten", purge_reason="rejected_before_analysis")
        if not request.consent:
            return _result(request, status="rejected", quality_bucket="none", duration_bucket="none", reason="consent_required", purge_status="application_buffer_overwritten", purge_reason="rejected_before_analysis")
        if request.subject_kind not in {"synthetic", "consenting_adult"}:
            return _result(request, status="rejected", quality_bucket="none", duration_bucket="none", reason="minor_pilot_blocked", purge_status="application_buffer_overwritten", purge_reason="rejected_before_analysis")
        if len(buffer) > MAX_AUDIO_BYTES:
            return _result(request, status="abstain", quality_bucket="none", duration_bucket="over_10s", reason="too_long", purge_status="application_buffer_overwritten", purge_reason="rejected_before_analysis")
        try:
            with wave.open(io.BytesIO(buffer), "rb") as wav:
                channels, width, rate, frames = wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()
                if channels not in {1, 2} or width != 2 or not 8_000 <= rate <= 48_000:
                    raise ValueError("unsupported")
                duration_ms = round(frames * 1000 / rate)
                samples = array("h", wav.readframes(frames))
        except (wave.Error, EOFError, ValueError):
            return _result(request, status="abstain", quality_bucket="none", duration_bucket="none", reason="unsupported_format", purge_status="application_buffer_overwritten", purge_reason="processing_error")
        if duration_ms < 150:
            return _result(request, status="abstain", quality_bucket="low", duration_bucket="under_150ms", reason="too_short", purge_status="application_buffer_overwritten", purge_reason="processed")
        if duration_ms > MAX_DURATION_MS:
            return _result(request, status="abstain", quality_bucket="none", duration_bucket="over_10s", reason="too_long", purge_status="application_buffer_overwritten", purge_reason="processed")
        rms = math.sqrt(sum(sample * sample for sample in samples) / max(1, len(samples))) / 32768
        # Preserve the pre-existing quality threshold while returning only a
        # coarse bucket; the intermediate RMS value never leaves this scope.
        if rms * 20 < 0.12:
            return _result(request, status="abstain", quality_bucket="low", duration_bucket="150ms_to_10s", reason="low_signal", purge_status="application_buffer_overwritten", purge_reason="processed")
        return _result(request, status="observed", quality_bucket="usable", duration_bucket="150ms_to_10s", reason="usable_signal", purge_status="application_buffer_overwritten", purge_reason="processed")
    except Exception:
        return _result(request, status="abstain", quality_bucket="none", duration_bucket="none", reason="processing_error", purge_status="application_buffer_overwritten", purge_reason="processing_error")
    finally:
        _overwrite(buffer)
