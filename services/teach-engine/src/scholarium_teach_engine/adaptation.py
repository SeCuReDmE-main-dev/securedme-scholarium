"""Presentation adaptation contracts with no learner diagnosis or auto-routing."""

from __future__ import annotations

from enum import Enum

from pydantic import Field

from .canonical import digest
from .models import Sha256, StableId, StrictModel


class Modality(str, Enum):
    TEXT = "text"
    SOUND = "sound"
    SPATIAL = "spatial"
    MANIPULATION = "manipulation"
    RHYTHM = "rhythm"
    ANIMATION = "animation"


class LearnerModalityPreference(StrictModel):
    schema_id: str = "scholarium.teach.modality-preference.v1"
    learner_pseudonym: StableId
    modality: Modality
    declared_preference: str = Field(pattern=r"^(prefer|avoid|neutral)$")
    consented_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    expires_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    revoked_at: str | None = None


class ModalityTrial(StrictModel):
    schema_id: str = "scholarium.teach.modality-trial.v1"
    trial_id: StableId
    learner_pseudonym: StableId
    node_id: StableId
    modality: Modality
    same_pedagogical_order: bool = True
    success: bool
    delay_ms: int = Field(ge=0, le=3_600_000)
    requested_help: bool
    delayed_recall: bool
    transfer: bool
    explicitly_refused: bool
    raw_answer_stored: bool = False
    diagnostic: bool = False


class ModalityOffer(StrictModel):
    schema_id: str = "scholarium.teach.modality-offer.v1"
    learner_pseudonym: StableId
    node_id: StableId
    current_modality: Modality
    suggested_modality: Modality
    reason: str = Field(min_length=1, max_length=240)
    requires_explicit_acceptance: bool = True
    changes_pedagogical_order: bool = False


class SuiteLearningSignal(StrictModel):
    schema_id: str = "scholarium.suite.learning-signal.v1"
    tenant_id: StableId
    learner_pseudonym: StableId
    source_tool: StableId
    emitted_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    expires_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    revoked_at: str | None = None
    signal_kind: str = Field(pattern=r"^(modality_preference|presentation_trial)$")
    payload_digest: Sha256
    has_raw_answer: bool = False
    has_diagnosis: bool = False
    persistence_authorized: bool = False


def propose_modality(trials: tuple[ModalityTrial, ...], preference: LearnerModalityPreference, current: Modality) -> ModalityOffer | None:
    """Offer, never enact, a presentation change from comparable evidence."""
    usable = [trial for trial in trials if trial.same_pedagogical_order and not trial.explicitly_refused]
    if preference.declared_preference == "avoid" or not usable:
        return None
    successes = [trial for trial in usable if trial.success and trial.delayed_recall and trial.transfer]
    by_modality: dict[Modality, list[ModalityTrial]] = {}
    for trial in successes:
        by_modality.setdefault(trial.modality, []).append(trial)
    ranked = sorted(by_modality.items(), key=lambda pair: (-len(pair[1]), sum(item.delay_ms for item in pair[1]) / len(pair[1]), pair[0].value))
    if not ranked or ranked[0][0] is current:
        return None
    return ModalityOffer(learner_pseudonym=preference.learner_pseudonym, node_id=ranked[0][1][0].node_id, current_modality=current, suggested_modality=ranked[0][0], reason="Comparable completed trials support an optional presentation experiment.")


def signal_for_trial(*, tenant_id: str, source_tool: str, trial: ModalityTrial, emitted_at: str, expires_at: str) -> SuiteLearningSignal:
    payload = trial.model_dump(mode="json")
    return SuiteLearningSignal(tenant_id=tenant_id, learner_pseudonym=trial.learner_pseudonym, source_tool=source_tool, emitted_at=emitted_at, expires_at=expires_at, signal_kind="presentation_trial", payload_digest=digest(payload))
