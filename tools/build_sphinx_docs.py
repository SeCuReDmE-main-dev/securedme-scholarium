from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
BUILD = ROOT / "build"
LANGUAGES = ("en", "fr", "es")
CANONICAL_ROOT = "https://docs.securedme.ca"
DEFAULT_DESCRIPTION = (
    "Public developer documentation for the twelve SeCuReDmE Education tools, "
    "including quickstarts, interfaces, operating limits, prompts, and videos."
)


def run(*args: str, env: dict[str, str] | None = None) -> None:
    subprocess.run(args, cwd=ROOT, check=True, env=env)


def root_index() -> str:
    return """<!doctype html>
<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>SeCuReDmE Developer Library</title><link rel=\"canonical\" href=\"https://docs.securedme.ca/en/\"><script>const l=(navigator.language||'en').slice(0,2);location.replace(['en','fr','es'].includes(l)?`/${l}/`:'/en/');</script><noscript><meta http-equiv=\"refresh\" content=\"0;url=/en/\"></noscript></head><body><a href=\"/en/\">Open documentation</a></body></html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, default=ROOT.parent)
    parser.add_argument("--clean", action="store_true")
    parser.add_argument("--skip-sync", action="store_true")
    return parser.parse_args()


def page_url(output_root: Path, page: Path) -> str:
    relative = page.relative_to(output_root).as_posix()
    if relative.endswith("index.html"):
        relative = relative[: -len("index.html")]
    elif relative.endswith(".html"):
        relative = relative[: -len(".html")]
    return f"{CANONICAL_ROOT}/{relative}".replace("//", "/").replace("https:/", "https://")


def translated_page_urls(output_root: Path, page: Path) -> dict[str, str]:
    relative = page.relative_to(output_root).as_posix()
    parts = relative.split("/", 1)
    suffix = parts[1] if len(parts) == 2 else ""
    urls = {}
    for language in LANGUAGES:
        candidate = output_root / language / suffix
        if candidate.is_file():
            urls[language] = page_url(output_root, candidate)
    return urls


def inject_page_metadata(output_root: Path) -> None:
    for language in LANGUAGES:
        for page in sorted((output_root / language).rglob("*.html")):
            source = page.read_text(encoding="utf-8")
            if "data-securedme-seo=\"v2\"" in source:
                continue
            source = re.sub(
                r'\s*<link\s+rel=["\']canonical["\'][^>]*>\s*',
                "\n",
                source,
                flags=re.IGNORECASE,
            )
            canonical = page_url(output_root, page)
            title_match = source.split("<title>", 1)
            title = "SeCuReDmE Developer Library"
            if len(title_match) == 2 and "</title>" in title_match[1]:
                title = html.unescape(title_match[1].split("</title>", 1)[0]).strip()
            alternates = translated_page_urls(output_root, page)
            links = "\n".join(
                f'<link rel="alternate" hreflang="{code}" href="{url}">'
                for code, url in alternates.items()
            )
            if "en" in alternates:
                links += f'\n<link rel="alternate" hreflang="x-default" href="{alternates["en"]}">'
            structured = json.dumps(
                {
                    "@context": "https://schema.org",
                    "@type": "TechArticle",
                    "headline": title,
                    "url": canonical,
                    "inLanguage": language,
                    "isPartOf": {
                        "@type": "WebSite",
                        "name": "SeCuReDmE Developer Library",
                        "url": CANONICAL_ROOT,
                    },
                    "author": {"@type": "Person", "name": "Jean-Sebastien Beaulieu"},
                },
                ensure_ascii=True,
            )
            metadata = f"""
<!-- securedme-seo:v2 -->
<meta data-securedme-seo="v2" name="description" content="{html.escape(DEFAULT_DESCRIPTION, quote=True)}">
<link rel="canonical" href="{canonical}">
{links}
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(title, quote=True)}">
<meta property="og:description" content="{html.escape(DEFAULT_DESCRIPTION, quote=True)}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="SeCuReDmE Developer Library">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{structured}</script>
"""
            page.write_text(source.replace("</head>", f"{metadata}</head>", 1), encoding="utf-8")


def write_discovery_assets(output_root: Path) -> None:
    pages = [page for language in LANGUAGES for page in sorted((output_root / language).rglob("*.html"))]
    urls = "\n".join(
        f"  <url><loc>{escape(page_url(output_root, page))}</loc><lastmod>{date.today().isoformat()}</lastmod></url>"
        for page in pages
    )
    sitemap = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    (output_root / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (output_root / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {CANONICAL_ROOT}/sitemap.xml\n",
        encoding="ascii",
    )


def main() -> None:
    args = parse_args()
    if args.clean and BUILD.exists():
        shutil.rmtree(BUILD)
    if not args.skip_sync:
        run(sys.executable, "tools/sync_suite_docs.py", "--source-root", str(args.source_root))
    run(sys.executable, "tools/validate_sphinx_portal.py", "--source-root", str(args.source_root))
    run(sys.executable, "tools/update_translations.py")
    for language in LANGUAGES:
        env = os.environ.copy()
        env["DOCS_LANGUAGE"] = language
        run(
            sys.executable,
            "-m",
            "sphinx",
            "-W",
            "--keep-going",
            "-b",
            "html",
            str(DOCS),
            str(BUILD / "html" / language),
            env=env,
        )
    output = BUILD / "html"
    output.mkdir(parents=True, exist_ok=True)
    (output / "index.html").write_text(root_index(), encoding="utf-8")
    (output / "CNAME").write_text("docs.securedme.ca\n", encoding="ascii")
    inject_page_metadata(output)
    write_discovery_assets(output)
    run(sys.executable, "tools/validate_built_site.py", str(output))
    print("Built Sphinx documentation for en, fr, and es")


if __name__ == "__main__":
    main()
