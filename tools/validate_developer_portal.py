from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"[FAIL] {message}")
    print(f"[OK] {message}")


def main() -> None:
    tools = json.loads((DOCS / "data" / "tools.json").read_text(encoding="utf-8"))["tools"]
    slugs = [tool["slug"] for tool in tools]
    require(len(tools) == 12, "catalogue contains exactly 12 tools")
    require(len(set(slugs)) == 12, "tool slugs are unique")
    require(
        all((DOCS / "tools" / f"{slug}.md").exists() for slug in slugs),
        "every tool has a developer page",
    )

    prompt_book = (DOCS / "teach" / "LIFE_SCIENCE_40_PROMPT_BOOK.md").read_text(
        encoding="utf-8"
    )
    prompt_ids = re.findall(r"(?m)^## (LS-\d{2})\b", prompt_book)
    expected = [f"LS-{number:02d}" for number in range(1, 41)]
    require(prompt_ids == expected, "collaboration prompts run continuously from LS-01 to LS-40")
    require(
        prompt_book.count("**Prompt de collaboration.**") == 40,
        "every prompt exposes a copyable collaboration contract",
    )
    require(prompt_book.count("ARRET HITL") == 40, "every prompt has a human stop gate")

    video_data = json.loads((DOCS / "data" / "video-library.json").read_text(encoding="utf-8"))
    videos = video_data["videos"]
    video_ids = [video["video_id"] for video in videos]
    require(bool(videos), "video library is not empty")
    require(len(video_ids) == len(set(video_ids)), "video identifiers are unique")
    require(
        all(video["format"] in {"short", "long"} for video in videos),
        "every video has a short or long format",
    )
    require(
        all(isinstance(video["duration_seconds"], int) for video in videos),
        "every indexed video has a measured duration",
    )

    tutorial = DOCS / "getting-started" / "15-minute-tutorial.md"
    require(tutorial.exists(), "15-minute tutorial exists")
    tutorial_text = tutorial.read_text(encoding="utf-8")
    require('=== "English"' in tutorial_text and '=== "Français"' in tutorial_text, "tutorial is bilingual")

    print(
        f"Portal contract valid: {len(tools)} tools, {len(prompt_ids)} prompts, "
        f"{len(videos)} videos"
    )


if __name__ == "__main__":
    main()
