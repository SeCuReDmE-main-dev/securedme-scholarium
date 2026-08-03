from __future__ import annotations

import unicodedata
from datetime import timedelta

from .canonical import digest
from .models import (
    AttemptEnvelope,
    BlockManifest,
    CheckpointProjection,
    DecisionKind,
    DecisionReceipt,
    EvidenceRecord,
    MasteryState,
    NodeKind,
    NodeProgress,
)


def normalized_reading(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value).casefold().strip().split())


class DecisionEngine:
    def __init__(self, block: BlockManifest):
        if not block.content_digest or not block.policy_digest:
            raise ValueError("validated block digests are required")
        self.block = block
        self.nodes = {node.node_id: node for node in block.nodes}
        self.ordered = sorted(block.nodes, key=lambda node: node.position)

    def initial_checkpoint(self, session_id: str) -> CheckpointProjection:
        return CheckpointProjection(
            session_id=session_id,
            block_id=self.block.block_id,
            block_version=self.block.version,
            block_digest=self.block.content_digest,
            policy_digest=self.block.policy_digest,
            current_node_id=self.block.entry_node_id,
            progress={node.node_id: NodeProgress() for node in self.ordered},
        )

    def cards(self, checkpoint: CheckpointProjection, count: int = 3):
        current = self.nodes[checkpoint.current_node_id]
        return self.ordered[current.position:current.position + max(1, min(count, 3))]

    def decide(self, attempt: AttemptEnvelope) -> DecisionReceipt:
        checkpoint = attempt.checkpoint
        if checkpoint.block_digest != self.block.content_digest or checkpoint.policy_digest != self.block.policy_digest:
            raise ValueError("checkpoint_block_or_policy_mismatch")
        if attempt.node_id != checkpoint.current_node_id:
            raise ValueError("attempt_node_is_not_current")
        node = self.nodes[attempt.node_id]
        previous = checkpoint.progress.get(node.node_id, NodeProgress())
        answer_matches = normalized_reading(attempt.answer) == normalized_reading(node.target)
        evidence = set(previous.evidence)
        if answer_matches and attempt.assistance == "none":
            evidence.add("independent")
        if answer_matches and attempt.assistance == "none" and attempt.recall_delay_seconds >= 600:
            evidence.add("delayed_recall")
        if answer_matches and attempt.recomposition_demonstrated:
            evidence.add("recomposition")
        if answer_matches and attempt.transfer_demonstrated:
            evidence.add("transfer")
        if answer_matches and attempt.reading_mastery_demonstrated:
            evidence.add("reading_mastery")

        required = set(node.required_evidence)
        if node.kind is NodeKind.WRITING:
            reading_nodes = [candidate for candidate in self.ordered if candidate.kind is NodeKind.READING]
            reading_mastered = all(checkpoint.progress.get(candidate.node_id, NodeProgress()).state is MasteryState.MASTERED for candidate in reading_nodes)
            if not reading_mastered:
                return self._receipt(attempt, DecisionKind.HOLD, previous, evidence, required | {"reading_mastery"})

        if not answer_matches:
            return self._receipt(attempt, DecisionKind.REVIEW, previous, evidence, required)
        if required.issubset(evidence):
            return self._receipt(attempt, DecisionKind.ADVANCE, previous, evidence, required)
        return self._receipt(attempt, DecisionKind.HOLD, previous, evidence, required)

    def _receipt(self, attempt, decision, previous, evidence, required):
        checkpoint = attempt.checkpoint
        progress = dict(checkpoint.progress)
        if decision is DecisionKind.ADVANCE:
            state = MasteryState.MASTERED
        elif decision is DecisionKind.REVIEW:
            state = MasteryState.REVIEW
        elif "delayed_recall" in evidence:
            state = MasteryState.CONTEXTUALIZED
        elif "independent" in evidence:
            state = MasteryState.RECALLED
        else:
            state = MasteryState.GUIDED
        progress[attempt.node_id] = NodeProgress(state=state, attempts=previous.attempts + 1, evidence=tuple(sorted(evidence)))
        current = self.nodes[attempt.node_id]
        if decision is DecisionKind.ADVANCE and current.position + 1 < len(self.ordered):
            next_node_id = self.ordered[current.position + 1].node_id
        else:
            next_node_id = attempt.node_id
        next_checkpoint = checkpoint.model_copy(update={
            "current_node_id": next_node_id,
            "sequence": checkpoint.sequence + 1,
            "progress": progress,
        })
        evidence_record = EvidenceRecord(
            answer_matches=normalized_reading(attempt.answer) == normalized_reading(current.target),
            evidence=tuple(sorted(evidence)),
            missing=tuple(sorted(required - evidence)),
            assistance=attempt.assistance,
        )
        base = {
            "request_id": attempt.request_id,
            "idempotency_key": attempt.idempotency_key,
            "decision": decision.value,
            "previous_checkpoint_digest": digest(checkpoint.model_dump(mode="json")),
            "attempt_digest": digest(attempt.model_dump(mode="json")),
            "block_digest": self.block.content_digest,
            "policy_digest": self.block.policy_digest,
            "evidence": evidence_record.model_dump(mode="json"),
            "next_checkpoint": next_checkpoint.model_dump(mode="json"),
            "next_review_at": (attempt.occurred_at + timedelta(minutes=5 if decision is not DecisionKind.ADVANCE else 60)).isoformat(),
        }
        return DecisionReceipt(**base, decision_digest=digest(base))


def replay(engine: DecisionEngine, attempts: list[AttemptEnvelope]) -> CheckpointProjection:
    if not attempts:
        raise ValueError("at_least_one_attempt_required")
    checkpoint = attempts[0].checkpoint
    for attempt in attempts:
        if attempt.checkpoint != checkpoint:
            raise ValueError("replay_checkpoint_chain_broken")
        checkpoint = engine.decide(attempt).next_checkpoint
    return checkpoint
