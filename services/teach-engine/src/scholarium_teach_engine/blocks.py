from __future__ import annotations

import json
from pathlib import Path

from .canonical import digest
from .models import BlockManifest, NodeKind


class BlockValidationError(ValueError):
    pass


def validate_block(block: BlockManifest) -> BlockManifest:
    nodes = {node.node_id: node for node in block.nodes}
    if len(nodes) != len(block.nodes):
        raise BlockValidationError("duplicate_node_id")
    if block.entry_node_id not in nodes:
        raise BlockValidationError("missing_entry_node")
    entry = nodes[block.entry_node_id]
    if entry.kind is not NodeKind.SYLLABLE:
        raise BlockValidationError("entry_must_be_syllable")
    if len(entry.target) == 1 and entry.target.casefold() in {"a", "e", "i", "o", "u"}:
        raise BlockValidationError("isolated_vowel_entry_forbidden")
    for node in block.nodes:
        if node.picture_as_answer:
            raise BlockValidationError(f"picture_as_answer:{node.node_id}")
        for prerequisite in node.prerequisites:
            if prerequisite not in nodes:
                raise BlockValidationError(f"missing_prerequisite:{node.node_id}:{prerequisite}")
            if nodes[prerequisite].position >= node.position:
                raise BlockValidationError(f"non_prior_prerequisite:{node.node_id}:{prerequisite}")
    ordered = sorted(block.nodes, key=lambda node: node.position)
    if [node.position for node in ordered] != list(range(len(ordered))):
        raise BlockValidationError("positions_must_be_contiguous")
    kinds = [node.kind for node in ordered]
    expected = [NodeKind.SYLLABLE, NodeKind.SOUND, NodeKind.COMPOSITION, NodeKind.READING, NodeKind.WRITING]
    if kinds != expected:
        raise BlockValidationError("required_path_is_syllable_sound_composition_reading_writing")
    if not block.provenance:
        raise BlockValidationError("provenance_required")

    unsigned = block.model_dump(mode="json", exclude={"content_digest", "policy_digest"})
    policy = {
        "required_evidence": {node.node_id: list(node.required_evidence) for node in ordered},
        "path": [kind.value for kind in kinds],
        "writing_requires_reading": True,
        "audio_can_change_mastery": False,
    }
    return block.model_copy(update={"content_digest": digest(unsigned), "policy_digest": digest(policy)})


def load_block(path: Path) -> BlockManifest:
    block = BlockManifest.model_validate(json.loads(path.read_text(encoding="utf-8")))
    validated = validate_block(block.model_copy(update={"content_digest": None, "policy_digest": None}))
    if block.content_digest and block.content_digest != validated.content_digest:
        raise BlockValidationError("content_digest_mismatch")
    if block.policy_digest and block.policy_digest != validated.policy_digest:
        raise BlockValidationError("policy_digest_mismatch")
    return validated


def compile_block(source: Path, destination: Path) -> BlockManifest:
    block = load_block(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(block.model_dump(mode="json"), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return block
