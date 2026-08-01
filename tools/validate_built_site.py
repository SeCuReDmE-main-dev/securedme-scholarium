from __future__ import annotations

import argparse
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


LANGUAGES = ("en", "fr", "es")
SECRET_PATTERNS = {
    "private Windows user path": re.compile(r"[A-Za-z]:\\Users\\", re.IGNORECASE),
    "private suite drive path": re.compile(r"\bZ:\\", re.IGNORECASE),
    "authorization bearer value": re.compile(r"Authorization:\s*Bearer\s+[^\s<]{8,}", re.IGNORECASE),
    "provider token": re.compile(r"\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{20,}"),
    "assigned secret": re.compile(
        r"\b[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)\s*=\s*[^\s<]{8,}",
        re.IGNORECASE,
    ),
}


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str]] = []
        self.canonicals = 0
        self.hreflangs: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in {"a", "link"} and values.get("href"):
            self.references.append(("href", values["href"] or ""))
        if tag in {"img", "script", "source"} and values.get("src"):
            self.references.append(("src", values["src"] or ""))
        if tag == "link" and values.get("rel") == "canonical":
            self.canonicals += 1
        if tag == "link" and values.get("rel") == "alternate" and values.get("hreflang"):
            self.hreflangs.add(values["hreflang"] or "")


def resolve_reference(page: Path, output_root: Path, value: str) -> Path | None:
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or value.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    raw_path = unquote(parsed.path)
    if not raw_path:
        return None
    candidate = output_root / raw_path.lstrip("/") if raw_path.startswith("/") else page.parent / raw_path
    candidate = Path(os.path.abspath(os.path.normpath(candidate)))
    try:
        candidate.relative_to(output_root)
    except ValueError as error:
        raise AssertionError(f"Reference escapes build root: {page} -> {value}") from error
    if raw_path.endswith("/"):
        candidate /= "index.html"
    elif candidate.is_dir():
        candidate /= "index.html"
    return candidate


def validate(output_root: Path) -> dict[str, object]:
    output_root = output_root.resolve()
    if not (output_root / "index.html").is_file():
        raise AssertionError(f"Missing root index: {output_root}")

    pages = sorted(output_root.rglob("*.html"))
    if not pages:
        raise AssertionError("No HTML pages were built")
    language_counts = {
        language: len(list((output_root / language).rglob("*.html"))) for language in LANGUAGES
    }
    for language, count in language_counts.items():
        if count < 100:
            raise AssertionError(f"{language} edition is incomplete: {count} HTML pages")

    broken: list[str] = []
    secret_hits: list[str] = []
    metadata_errors: list[str] = []
    checked_references = 0
    reference_exists: dict[Path, bool] = {}
    required_hreflangs = {"en", "fr", "es", "x-default"}

    for page in pages:
        text = page.read_text(encoding="utf-8", errors="replace")
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(text):
                secret_hits.append(f"{page.relative_to(output_root).as_posix()}: {label}")

        parser = ReferenceParser()
        parser.feed(text)
        is_language_page = page.relative_to(output_root).parts[0] in LANGUAGES
        if is_language_page:
            if parser.canonicals != 1:
                metadata_errors.append(f"{page.relative_to(output_root)}: canonical={parser.canonicals}")
            if parser.hreflangs != required_hreflangs:
                metadata_errors.append(
                    f"{page.relative_to(output_root)}: hreflang={sorted(parser.hreflangs)}"
                )

        for kind, value in parser.references:
            target = resolve_reference(page, output_root, value)
            if target is None:
                continue
            checked_references += 1
            if target not in reference_exists:
                reference_exists[target] = target.is_file()
            if not reference_exists[target]:
                broken.append(f"{page.relative_to(output_root).as_posix()} [{kind}] {value}")

    if broken:
        raise AssertionError("Broken internal references:\n" + "\n".join(broken[:30]))
    if secret_hits:
        raise AssertionError("Secret or private path patterns found:\n" + "\n".join(secret_hits[:30]))
    if metadata_errors:
        raise AssertionError("Metadata contract failures:\n" + "\n".join(metadata_errors[:30]))

    report = {
        "schema": "securedme.built-docs-validation.v1",
        "html_pages": len(pages),
        "language_pages": language_counts,
        "checked_internal_references": checked_references,
        "broken_internal_references": 0,
        "secret_or_private_path_hits": 0,
        "metadata_errors": 0,
    }
    (output_root / "validation-report.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate a built SeCuReDmE documentation portal.")
    parser.add_argument("output_root", type=Path)
    return parser.parse_args()


def main() -> None:
    report = validate(parse_args().output_root)
    print(json.dumps(report))


if __name__ == "__main__":
    main()
