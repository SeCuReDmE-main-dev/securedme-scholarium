import json
import tempfile
import unittest
from pathlib import Path

from scholarium_teach_engine.blocks import BlockValidationError, compile_block, load_block, validate_block


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "packs" / "castellano-latam-neutral-1.0.0.source.json"


class BlockTests(unittest.TestCase):
    def test_compilation_is_reproducible(self):
        with tempfile.TemporaryDirectory() as directory:
            first = compile_block(SOURCE, Path(directory) / "first.json")
            second = compile_block(SOURCE, Path(directory) / "second.json")
            self.assertEqual(first.content_digest, second.content_digest)
            self.assertEqual((Path(directory) / "first.json").read_bytes(), (Path(directory) / "second.json").read_bytes())

    def test_path_has_five_required_kinds(self):
        block = load_block(SOURCE)
        self.assertEqual([node.kind.value for node in block.nodes], ["syllable", "sound", "composition", "reading", "writing"])

    def test_picture_answer_is_rejected(self):
        block = load_block(SOURCE)
        nodes = list(block.nodes)
        nodes[0] = nodes[0].model_copy(update={"picture_as_answer": True})
        with self.assertRaisesRegex(BlockValidationError, "picture_as_answer"):
            validate_block(block.model_copy(update={"nodes": tuple(nodes), "content_digest": None, "policy_digest": None}))

    def test_isolated_vowel_entry_is_rejected(self):
        block = load_block(SOURCE)
        nodes = list(block.nodes)
        nodes[0] = nodes[0].model_copy(update={"target": "a", "syllables": ("a",)})
        with self.assertRaisesRegex(BlockValidationError, "isolated_vowel"):
            validate_block(block.model_copy(update={"nodes": tuple(nodes), "content_digest": None, "policy_digest": None}))

    def test_missing_provenance_is_rejected(self):
        block = load_block(SOURCE)
        with self.assertRaisesRegex(BlockValidationError, "provenance"):
            validate_block(block.model_copy(update={"provenance": (), "content_digest": None, "policy_digest": None}))


if __name__ == "__main__":
    unittest.main()
