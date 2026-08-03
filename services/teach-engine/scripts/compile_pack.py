from pathlib import Path

from scholarium_teach_engine.blocks import compile_block


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    block = compile_block(root / "packs" / "castellano-latam-neutral-1.0.0.source.json", root / "packs" / "castellano-latam-neutral-1.0.0.json")
    print(block.content_digest)
