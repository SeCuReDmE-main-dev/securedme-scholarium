from __future__ import annotations

import html
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
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


CURATION = {
    "pADapMCfTR0": ("en", "scholarium", "agent architecture", "siQuygli4aU"),
    "siQuygli4aU": ("en", "scholarium", "agent architecture", "pADapMCfTR0"),
    "MPowqNgUzhk": ("en", "scholarium", "planning and human review", "9sGT9xwR95o"),
    "9sGT9xwR95o": ("en", "scholarium", "planning and human review", "MPowqNgUzhk"),
    "1s6ugSBFqY4": ("en", "ffed-qlc", "evidence admission", None),
    "SQgqTwFjJ7M": ("en", "scholarium", "research commons", None),
    "9UqIJRJBjZk": ("fr", "algoquest-qbit", "zero trust classroom", "w_VrkmQOoDU"),
    "w_VrkmQOoDU": ("en", "algoquest-qbit", "zero trust classroom", "9UqIJRJBjZk"),
    "lYVIGz_7w7E": ("en", "quanthor", "formal verification", None),
    "RbDY5J1ihqM": ("es", "scholarium", "agricultural research", "HqTzFp0OfM0"),
    "HqTzFp0OfM0": ("es", "scholarium", "agricultural research", "RbDY5J1ihqM"),
    "H5j2Rakqg5I": ("en", "scholarium", "education suite", None),
    "sP6X3tMKo5s": ("en", "synthia", "responsible AI education", None),
    "gEdZr9EgO9A": ("en", "fnp-qnn", "simulation", None),
    "gzuWgO3sZT8": ("en", "synthia", "living systems", None),
}


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "SecuredMeDocs/2.0"})
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


def base_record(video_id: str, title: str, published: str, seconds: int | None) -> dict[str, object]:
    language, tool, topic, paired_video_id = CURATION.get(
        video_id, ("en", "scholarium", "uncategorized", None)
    )
    return {
        "video_id": video_id,
        "title": title,
        "published": published,
        "date": published[:10],
        "language": language,
        "tool": tool,
        "topic": topic,
        "duration_seconds": seconds,
        "format": "short" if seconds is not None and seconds <= 180 else "long",
        "url": f"https://youtu.be/{video_id}",
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
        "paired_video_id": paired_video_id,
        "transcript": {"status": "not-provided", "url": None},
    }


def load_feed() -> list[dict[str, object]]:
    root = ET.fromstring(fetch(FEED_URL))
    videos: list[dict[str, object]] = []
    for entry in root.findall("atom:entry", NS):
        video_id = entry.findtext("yt:videoId", namespaces=NS)
        if not video_id:
            continue
        published = entry.findtext("atom:published", namespaces=NS) or ""
        videos.append(
            base_record(
                video_id,
                entry.findtext("atom:title", namespaces=NS) or video_id,
                published,
                duration_seconds(video_id),
            )
        )
    return videos


def load_existing() -> list[dict[str, object]]:
    if not DATA_PATH.exists():
        return []
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    return list(payload.get("videos", []))


def enrich_existing(video: dict[str, object]) -> dict[str, object]:
    curated = base_record(
        str(video["video_id"]),
        str(video["title"]),
        str(video.get("published") or video.get("date") or ""),
        video.get("duration_seconds") if isinstance(video.get("duration_seconds"), int) else None,
    )
    curated.update(video)
    language, tool, topic, pair = CURATION.get(
        str(video["video_id"]),
        (
            str(curated.get("language", "en")),
            str(curated.get("tool", "scholarium")),
            str(curated.get("topic", "uncategorized")),
            curated.get("paired_video_id"),
        ),
    )
    curated.update({"language": language, "tool": tool, "topic": topic, "paired_video_id": pair})
    curated.setdefault("transcript", {"status": "not-provided", "url": None})
    return curated


def merge_videos(existing: list[dict[str, object]], current: list[dict[str, object]]) -> list[dict[str, object]]:
    merged = {str(video["video_id"]): enrich_existing(video) for video in existing}
    for video in current:
        previous = merged.get(str(video["video_id"]), {})
        preserved = {
            key: previous[key]
            for key in ("language", "tool", "topic", "paired_video_id", "transcript")
            if key in previous
        }
        merged[str(video["video_id"])] = {**video, **preserved}
    return sorted(merged.values(), key=lambda item: (str(item["published"]), str(item["video_id"])), reverse=True)


def render(videos: list[dict[str, object]]) -> str:
    lines = [
        "# Video library",
        "",
        "Short and long-form videos are indexed together. Historical entries are preserved even when they leave the YouTube feed window; a missing pair or transcript remains visible instead of being invented.",
        "",
        f"**Channel:** [SeCuReDmE on YouTube](https://www.youtube.com/channel/{CHANNEL_ID})  ",
        f"**Indexed videos:** {len(videos)}  ",
        f"**Last synchronized:** {datetime.now().astimezone().isoformat(timespec='seconds')}",
        "",
        '<div class="se-filter-panel" data-se-filter-panel="videos"></div>',
        '<p class="se-filter-count" data-se-filter-count="videos" aria-live="polite"></p>',
        '<div class="se-video-grid" data-se-filter-grid="videos">',
    ]
    by_id = {str(video["video_id"]): video for video in videos}
    for video in videos:
        title = html.escape(str(video["title"]), quote=True)
        pair_id = video.get("paired_video_id")
        pair = by_id.get(str(pair_id)) if pair_id else None
        transcript = video.get("transcript") if isinstance(video.get("transcript"), dict) else {}
        transcript_status = str(transcript.get("status", "not-provided"))
        pair_html = (
            f'<a href="{pair["url"]}">Paired {pair["format"]}</a>' if pair else "No verified pair"
        )
        transcript_url = transcript.get("url")
        transcript_html = (
            f'<a href="{html.escape(str(transcript_url), quote=True)}">Transcript</a>'
            if transcript_url
            else f"Transcript: {html.escape(transcript_status)}"
        )
        lines.extend(
            [
                (
                    f'<article class="se-video-card" data-tool="{video["tool"]}" '
                    f'data-language="{video["language"]}" data-topic="{html.escape(str(video["topic"]), quote=True)}" '
                    f'data-date="{video["date"]}" data-format="{video["format"]}">'
                ),
                f'  <a class="se-video-media" href="{video["url"]}">',
                f'    <img src="{video["thumbnail"]}" alt="Thumbnail for {title}">',
                "  </a>",
                '  <div class="se-video-copy">',
                f'    <strong><a href="{video["url"]}">{title}</a></strong>',
                f'    <small>{video["date"]} · {video["language"].upper()} · {video["tool"]}</small>',
                f'    <small>{video["format"]} · {duration_label(video.get("duration_seconds"))} · {video["topic"]}</small>',
                f'    <small>{pair_html} · {transcript_html}</small>',
                "  </div>",
                "</article>",
            ]
        )
    lines.extend(
        [
            "</div>",
            "",
            "## Maintenance",
            "",
            "Refresh the committed catalogue without adding a build-time network dependency:",
            "",
            "```powershell",
            "python tools/update_video_library.py",
            "python tools/build_sphinx_docs.py",
            "```",
            "",
            "The JSON snapshot is stored in `docs/data/video-library.json`. Curated fields survive future feed updates.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> None:
    existing = load_existing()
    current = load_feed()
    videos = merge_videos(existing, current)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_text(
        json.dumps(
            {
                "schema": "securedme.video-library.v2",
                "channel_id": CHANNEL_ID,
                "source": FEED_URL,
                "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
                "videos": videos,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    PAGE_PATH.write_text(render(videos), encoding="utf-8", newline="\n")
    print(f"Indexed {len(videos)} videos without deleting historical entries")


if __name__ == "__main__":
    main()
