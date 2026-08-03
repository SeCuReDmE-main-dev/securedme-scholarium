"""Privacy boundaries for learner, educator, and organization projections."""

from __future__ import annotations

from enum import Enum

from pydantic import Field, model_validator

from .models import Sha256, StableId, StrictModel

MINIMUM_AGGREGATE_COHORT = 10


class PrivacyScope(str, Enum):
    LEARNER_PRIVATE = "learner_private"
    EDUCATOR_PRIVATE = "educator_private"
    ORGANIZATION_AGGREGATE = "organization_aggregate"


class ConsentPurpose(str, Enum):
    EPHEMERAL_AUDIO = "ephemeral_audio"
    MODALITY_PREFERENCE = "modality_preference"
    SUITE_SIGNAL = "suite_signal"


class ConsentRecord(StrictModel):
    consent_id: StableId
    subject_pseudonym: StableId
    purpose: ConsentPurpose
    status: str = Field(pattern=r"^(granted|revoked|expired)$")
    policy_version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    receipt_digest: Sha256
    expires_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    revoked_at: str | None = None

    def usable(self, now: str) -> bool:
        return self.status == "granted" and self.revoked_at is None and now < self.expires_at


class EducatorLearnerAssignment(StrictModel):
    assignment_id: StableId
    educator_pseudonym: StableId
    learner_pseudonym: StableId
    status: str = Field(pattern=r"^(active|revoked)$")
    expires_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    revoked_at: str | None = None

    def active_for(self, educator_pseudonym: str, learner_pseudonym: str, now: str) -> bool:
        return self.status == "active" and self.revoked_at is None and now < self.expires_at and self.educator_pseudonym == educator_pseudonym and self.learner_pseudonym == learner_pseudonym


class OrganizationAggregate(StrictModel):
    aggregate_id: StableId
    organization_scope: StableId
    metric_key: str = Field(pattern=r"^(engine_availability|engine_error_count|decision_count)$")
    time_bucket: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    cohort_size: int = Field(ge=MINIMUM_AGGREGATE_COHORT)
    value_integer: int = Field(ge=0)
    source_window_digest: Sha256
    contains_identity: bool = False
    contains_raw_answer: bool = False
    contains_audio: bool = False

    @model_validator(mode="after")
    def anonymous_only(self):
        if self.contains_identity or self.contains_raw_answer or self.contains_audio:
            raise ValueError("organization_aggregate_must_not_contain_personal_or_raw_learning_data")
        return self


class TransactionKind(str, Enum):
    LEARNING = "learning"
    EPHEMERAL_OBSERVATION = "ephemeral_observation"
    TELEMETRY = "telemetry"
    AGGREGATE_PROJECTION = "aggregate_projection"


class TransactionBoundary(StrictModel):
    transaction_id: StableId
    kind: TransactionKind
    source_digest: Sha256
    destination_scope: PrivacyScope
    can_change_mastery: bool = False
    contains_identity: bool = False
    contains_raw_answer: bool = False
    contains_audio: bool = False

    @model_validator(mode="after")
    def enforce_boundaries(self):
        if self.kind is TransactionKind.EPHEMERAL_OBSERVATION and self.destination_scope is not PrivacyScope.LEARNER_PRIVATE:
            raise ValueError("ephemeral_observation_cannot_leave_learner_private_boundary")
        if self.kind is TransactionKind.TELEMETRY and (self.contains_identity or self.contains_raw_answer or self.contains_audio):
            raise ValueError("telemetry_must_be_non_identifying")
        if self.kind is TransactionKind.AGGREGATE_PROJECTION and self.destination_scope is not PrivacyScope.ORGANIZATION_AGGREGATE:
            raise ValueError("aggregate_projection_requires_organization_scope")
        if self.kind is not TransactionKind.LEARNING and self.can_change_mastery:
            raise ValueError("only_learning_transactions_can_change_mastery")
        return self


def may_view_learner_projection(*, requester_pseudonym: str, learner_pseudonym: str, assignments: tuple[EducatorLearnerAssignment, ...], now: str) -> bool:
    if requester_pseudonym == learner_pseudonym:
        return True
    return any(assignment.active_for(requester_pseudonym, learner_pseudonym, now) for assignment in assignments)
