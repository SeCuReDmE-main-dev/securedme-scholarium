from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


StableId = Annotated[str, StringConstraints(pattern=r"^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,179}$")]
Sha256 = Annotated[str, StringConstraints(pattern=r"^sha256:[a-f0-9]{64}$")]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)


class NodeKind(str, Enum):
    SYLLABLE = "syllable"
    SOUND = "sound"
    COMPOSITION = "composition"
    READING = "reading"
    WRITING = "writing"


class MasteryState(str, Enum):
    NEW = "new"
    GUIDED = "guided"
    RECALLED = "recalled"
    CONTEXTUALIZED = "contextualized"
    MASTERED = "mastered"
    REVIEW = "review"


class DecisionKind(str, Enum):
    ADVANCE = "advance"
    REVIEW = "review"
    HOLD = "hold"
    ABSTAIN = "abstain"
    HUMAN_REVIEW = "human_review"


class ProvenanceRef(StrictModel):
    source_id: StableId
    source_type: Literal["expert_message", "research", "editorial", "standard", "software"]
    citation: Annotated[str, StringConstraints(min_length=1, max_length=1000)]
    evidence_level: Literal["hypothesis", "observational", "experimental", "standard", "implementation"]


class LanguageProfile(StrictModel):
    profile_id: StableId
    locale: Literal["es-419"]
    display_name: Literal["Castellano"]
    regional_scope: Literal["latin-american-neutral-initial"]


class LearningNode(StrictModel):
    node_id: StableId
    kind: NodeKind
    position: Annotated[int, Field(ge=0, le=10_000)]
    prompt: Annotated[str, StringConstraints(min_length=1, max_length=500)]
    target: Annotated[str, StringConstraints(min_length=1, max_length=120)]
    syllables: tuple[Annotated[str, StringConstraints(min_length=1, max_length=12)], ...]
    prerequisites: tuple[StableId, ...] = ()
    required_evidence: tuple[Literal["independent", "delayed_recall", "recomposition", "transfer", "reading_mastery"], ...] = ()
    picture_as_answer: bool = False
    audio_ref: str | None = None


class BlockManifest(StrictModel):
    schema_id: Literal["scholarium.teach.block-manifest.v1"] = "scholarium.teach.block-manifest.v1"
    block_id: StableId
    version: Annotated[str, StringConstraints(pattern=r"^\d+\.\d+\.\d+$")]
    engine_api_major: Literal[1]
    status: Literal["draft", "published", "revoked"]
    language_profile: LanguageProfile
    entry_node_id: StableId
    nodes: tuple[LearningNode, ...]
    provenance: tuple[ProvenanceRef, ...]
    content_digest: Sha256 | None = None
    policy_digest: Sha256 | None = None


class NodeProgress(StrictModel):
    state: MasteryState = MasteryState.NEW
    attempts: Annotated[int, Field(ge=0, le=1_000_000)] = 0
    evidence: tuple[str, ...] = ()


class CheckpointProjection(StrictModel):
    schema_id: Literal["scholarium.teach.checkpoint.v1"] = "scholarium.teach.checkpoint.v1"
    session_id: StableId
    block_id: StableId
    block_version: str
    block_digest: Sha256
    policy_digest: Sha256
    current_node_id: StableId
    sequence: Annotated[int, Field(ge=0)] = 0
    progress: dict[StableId, NodeProgress] = Field(default_factory=dict)


class AttemptEnvelope(StrictModel):
    schema_id: Literal["scholarium.teach.attempt.v1"] = "scholarium.teach.attempt.v1"
    request_id: StableId
    idempotency_key: StableId
    node_id: StableId
    answer: Annotated[str, StringConstraints(max_length=600)]
    assistance: Literal["none", "hint", "first_segment", "segmented", "full_model"] = "full_model"
    occurred_at: datetime
    recall_delay_seconds: Annotated[int, Field(ge=0, le=31_536_000)] = 0
    recomposition_demonstrated: bool = False
    transfer_demonstrated: bool = False
    reading_mastery_demonstrated: bool = False
    response_time_ms: Annotated[int, Field(ge=0, le=3_600_000)] = 0
    checkpoint: CheckpointProjection

    @field_validator("occurred_at")
    @classmethod
    def timezone_required(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("occurred_at requires a timezone")
        return value


class EvidenceRecord(StrictModel):
    answer_matches: bool
    evidence: tuple[str, ...]
    missing: tuple[str, ...]
    assistance: str
    diagnostic: Literal[False] = False


class DecisionReceipt(StrictModel):
    schema_id: Literal["scholarium.teach.decision-receipt.v1"] = "scholarium.teach.decision-receipt.v1"
    request_id: StableId
    idempotency_key: StableId
    decision: DecisionKind
    previous_checkpoint_digest: Sha256
    attempt_digest: Sha256
    block_digest: Sha256
    policy_digest: Sha256
    evidence: EvidenceRecord
    next_checkpoint: CheckpointProjection
    next_review_at: datetime | None = None
    decision_digest: Sha256


class AudioObservation(StrictModel):
    schema_id: Literal["scholarium.teach.audio-observation.v1"] = "scholarium.teach.audio-observation.v1"
    request_id: StableId
    status: Literal["observed", "abstain"]
    quality: Annotated[float, Field(ge=0, le=1)]
    confidence: Annotated[float, Field(ge=0, le=1)]
    duration_ms: Annotated[int, Field(ge=0, le=10_000)]
    reason: Literal["usable_signal", "too_short", "too_long", "unsupported_format", "low_signal", "minor_pilot_blocked"]
    sample_retained: Literal[False] = False
    can_change_mastery: Literal[False] = False


class EphemeralObservationRequest(StrictModel):
    """Metadata for an in-memory observation. The media payload is never modelled."""

    schema_id: Literal["scholarium.teach.ephemeral-observation-request.v1"] = "scholarium.teach.ephemeral-observation-request.v1"
    request_id: StableId
    observation_id: StableId
    purpose: Literal["audio_quality"]
    consent: bool
    subject_kind: Literal["synthetic", "consenting_adult", "minor"]
    content_type: Literal["audio/wav", "audio/x-wav"]


class PurgeReceipt(StrictModel):
    """Evidence of application-level cleanup, not a claim of secure memory erasure."""

    schema_id: Literal["scholarium.teach.purge-receipt.v1"] = "scholarium.teach.purge-receipt.v1"
    observation_id: StableId
    status: Literal["application_buffer_overwritten", "references_released", "failed"]
    reason: Literal["processed", "rejected_before_analysis", "processing_error", "cleanup_error"]
    input_retained: Literal[False] = False
    raw_features_retained: Literal[False] = False
    receipt_digest: Sha256


class EphemeralObservationResult(StrictModel):
    schema_id: Literal["scholarium.teach.ephemeral-observation-result.v1"] = "scholarium.teach.ephemeral-observation-result.v1"
    request_id: StableId
    observation_id: StableId
    status: Literal["observed", "abstain", "rejected", "purge_failed"]
    quality_bucket: Literal["none", "low", "usable"]
    duration_bucket: Literal["none", "under_150ms", "150ms_to_10s", "over_10s"]
    reason: Literal["usable_signal", "too_short", "too_long", "unsupported_format", "low_signal", "minor_pilot_blocked", "consent_required", "content_type_rejected", "processing_error", "purge_failed"]
    purge_receipt: PurgeReceipt
    can_change_mastery: Literal[False] = False


class TelemetryEvent(StrictModel):
    schema_id: Literal["scholarium.teach.telemetry.v1"] = "scholarium.teach.telemetry.v1"
    event_id: StableId
    occurred_at: datetime
    event_type: Literal["decision", "engine_error", "audio_abstention", "outbox_delivery"]
    block_id: StableId
    block_version: str
    decision_digest: Sha256 | None = None
    latency_ms: Annotated[int, Field(ge=0, le=3_600_000)]
    error_code: str | None = None
    contains_identity: Literal[False] = False
    contains_raw_answer: Literal[False] = False
    contains_audio: Literal[False] = False
