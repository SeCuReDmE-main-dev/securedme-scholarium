from __future__ import annotations

from pathlib import Path

from .blocks import load_block
from .models import BlockManifest


class BlockRegistry:
    def __init__(self, pack_root: Path):
        self.pack_root = pack_root
        self._blocks: dict[tuple[str, str], BlockManifest] = {}

    def load_published(self) -> None:
        for path in sorted(self.pack_root.glob("*.json")):
            if path.name.endswith(".source.json"):
                continue
            block = load_block(path)
            if block.status != "published":
                continue
            key = (block.block_id, block.version)
            if key in self._blocks:
                raise ValueError(f"duplicate published block: {key}")
            self._blocks[key] = block

    def get(self, block_id: str, version: str) -> BlockManifest:
        try:
            return self._blocks[(block_id, version)]
        except KeyError as error:
            raise KeyError("unknown_or_unpublished_block") from error

    def all(self) -> tuple[BlockManifest, ...]:
        return tuple(self._blocks[key] for key in sorted(self._blocks))
