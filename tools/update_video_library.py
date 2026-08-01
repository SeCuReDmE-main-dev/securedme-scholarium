from __future__ import annotations

import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import datetime
from pathlib import Path


REPO = Path(__file__).resolve().parents[1]
CHANNEL_ID = "UCYHLMJuIoJre3n39z7LUGIg"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
DATA_PATH = REPO / "docs" / "data" / "video-library.json"
PAGE_PATH = REPO / "docs" / "media" / "video-library.md"
NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "SecuredMeDocs/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def duration_seconds(video_id: str) -> int | None:
    try:
        page = fetch(f"https://www.youtube.com/watch?v={video_id}")
    except Exception:
        return None
    match = re.search(r'"lengthSeconds":"(\d+)"', page)
    return int(match.group(1)) if match else None


def duration_label(seconds: int | None) -> str:
    if seconds is None:
        return "Duration unavailable"
    minutes, remaining = divmod(seconds, 60)
    return f"{minutes}:{remaining:02d}"


def load_feed() -> list[dict[str, object]]:
    root = ET.fromstring(fetch(FEED_URL))
    videos: list[dict[str, object]] = []
    for entry in root.findall("atom:entry", NS):
        video_id = entry.findtext("yt:videoId", namespaces=NS)
        if not video_id:
            continue
        published = entry.findtext("atom:published", namespaces=NS) or ""
        seconds = duration_seconds(video_id)
        videos.append(
            {
                "video_id": video_id,
                "title": entry.findtext("atom:title", namespaces=NS) or video_id,
                "published": published,
                "date": published[:10],
                "duration_seconds": seconds,
                "format": "short" if seconds is not None and seconds <= 180 else "long",
                "url": f"https://youtu.be/{video_id}",
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            }
        )
    return videos


def render(videos: list[dict[str, object]]) -> str:
    grouped: dict[str, list[dict[str, object]]] = defaultdict(list)
    for video in videos:
        grouped[str(video["date"])].append(video)
    lines = [
        "# Video library",
        "",
        "Short and long-form videos are indexed together so a daily publication can keep both formats connected. The catalogue is a dated snapshot of the public SeCuReDmE YouTube feed.",
        "",
        f"**Channel:** [SeCuReDmE on YouTube](https://www.youtube.com/channel/{CHANNEL_ID})",
        "",
        f"**Indexed videos:** {len(videos)}",
        "",
        f"**Last synchronized:** {datetime.now().astimezone().isoformat(timespec='seconds')}",
        "",
        "!!! info \"Daily publishing pattern\"",
        "    When both formats exist, publish the short entry as the discovery surface and the long entry as the complete explanation. A missing pair remains visible instead of being invented.",
        "",
    ]
    for date in sorted(grouped, reverse=True):
        lines.extend([f"## {date}", "", '<div class="se-video-grid">'])
        for video in sorted(grouped[date], key=lambda item: str(item["format"])):
            label = "Short" if video["format"] == "short" else "Long form"
            lines.extend(
                [
                    f'<a class="se-video-card" href="{video["url"]}">',
                    f'  <img src="{video["thumbnail"]}" alt="Thumbnail for {video["title"]}">',
                    "  <span>",
                    f"    <b>{video['title']}</b>",
                    f"    <small>{label} · {duration_label(video['duration_seconds'])}</small>",
                    "  </span>",
                    "</a>",
                ]
            )
        lines.extend(["</div>", ""])
    lines.extend(
        [
            "## Maintenance",
            "",
            "Refresh the committed catalogue without adding a build-time network dependency:",
            "",
            "```powershell",
            "python tools/update_video_library.py",
            "mkdocs build --strict",
            "```",
            "",
            "The generated JSON snapshot is stored in `docs/data/video-library.json`.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> None:
    videos = load_feed()
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "channel_id": CHANNEL_ID,
                "source": FEED_URL,
                "videos": videos,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    PAGE_PATH.write_text(render(videos), encoding="utf-8", newline="\n")
    print(f"Indexed {len(videos)} videos")


if __name__ == "__main__":
    main()
