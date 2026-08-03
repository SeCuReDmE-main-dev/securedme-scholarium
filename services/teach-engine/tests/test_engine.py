import unittest
from datetime import datetime, timezone
from pathlib import Path

from scholarium_teach_engine.blocks import load_block
from scholarium_teach_engine.engine import DecisionEngine, replay
from scholarium_teach_engine.models import AttemptEnvelope, DecisionKind, MasteryState, NodeProgress


ROOT = Path(__file__).resolve().parents[1]


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = DecisionEngine(load_block(ROOT / "packs" / "castellano-latam-neutral-1.0.0.source.json"))
        self.checkpoint = self.engine.initial_checkpoint("session-test")

    def attempt(self, **updates):
        values = dict(
            request_id="request-1",
            idempotency_key="attempt-1",
            node_id=self.checkpoint.current_node_id,
            answer="ma",
            assistance="none",
            occurred_at=datetime(2026, 8, 2, tzinfo=timezone.utc),
            recall_delay_seconds=600,
            checkpoint=self.checkpoint,
        )
        values.update(updates)
        return AttemptEnvelope(**values)

    def test_guided_answer_does_not_advance(self):
        receipt = self.engine.decide(self.attempt(assistance="full_model"))
        self.assertEqual(receipt.decision, DecisionKind.HOLD)
        self.assertEqual(receipt.next_checkpoint.current_node_id, "syllable-ma-series")

    def test_independent_delayed_answer_advances(self):
        receipt = self.engine.decide(self.attempt())
        self.assertEqual(receipt.decision, DecisionKind.ADVANCE)
        self.assertEqual(receipt.next_checkpoint.current_node_id, "sound-ma-series")

    def test_diacritics_are_not_removed(self):
        receipt = self.engine.decide(self.attempt(answer="má"))
        self.assertEqual(receipt.decision, DecisionKind.REVIEW)

    def test_writing_is_locked_without_reading_mastery(self):
        progress = dict(self.checkpoint.progress)
        for node in self.engine.ordered[:-1]:
            progress[node.node_id] = NodeProgress(state=MasteryState.MASTERED, attempts=1, evidence=("independent",))
        progress["reading-mama"] = NodeProgress(state=MasteryState.RECALLED, attempts=1, evidence=("independent",))
        checkpoint = self.checkpoint.model_copy(update={"current_node_id": "writing-mama", "progress": progress})
        receipt = self.engine.decide(self.attempt(node_id="writing-mama", answer="mama", reading_mastery_demonstrated=True, checkpoint=checkpoint))
        self.assertEqual(receipt.decision, DecisionKind.HOLD)

    def test_replay_reconstructs_receipt_checkpoint(self):
        attempt = self.attempt()
        expected = self.engine.decide(attempt).next_checkpoint
        self.assertEqual(replay(self.engine, [attempt]), expected)


if __name__ == "__main__":
    unittest.main()
