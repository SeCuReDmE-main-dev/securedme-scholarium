from __future__ import annotations

import json
import os
from pathlib import Path


DOCS = Path(__file__).resolve().parent
LANGUAGE = os.environ.get("DOCS_LANGUAGE", "en")

project = "SeCuReDmE Developer Library"
author = "Jean-Sebastien Beaulieu"
copyright = "2026 Jean-Sebastien Beaulieu"
version = "2.0"
release = "2.0.0-pre-alpha"

extensions = ["myst_parser", "sphinx.ext.autosectionlabel", "sphinx.ext.extlinks"]
source_suffix = {".md": "markdown"}
master_doc = "index"
language = LANGUAGE
locale_dirs = ["locales/"]
gettext_compact = False
gettext_uuid = True
exclude_patterns = [
    "_build",
    "[A-Z]*.md",
    "IDEA_*.md",
    "accessibility/**",
    "design/**",
    "idea-captures/**",
    "public/**",
    "redesign/**",
    "teach/**",
    "tools/algoquest-qbit.md",
    "tools/algorithm-builder.md",
    "tools/ffed-qlc.md",
    "tools/fnp-qnn.md",
    "tools/fnpqnn-gateway.md",
    "tools/quanthor.md",
    "tools/retailguard.md",
    "tools/scholarium.md",
    "tools/synthia.md",
    "tools/tesla-workbench.md",
    "tools/visual-algorithm-designer.md",
    "tools/vot-guardian.md",
]

myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "fieldlist",
    "substitution",
    "tasklist",
]
myst_heading_anchors = 4
autosectionlabel_prefix_document = True
suppress_warnings = ["myst.xref_missing"]

html_theme = "sphinx_rtd_theme"
html_title = f"SeCuReDmE Developer Library - {LANGUAGE.upper()}"
html_logo = "assets/education/education-icon.png"
html_favicon = "assets/education/education-icon.png"
html_static_path = ["_static"]
html_css_files = ["securedme-sphinx.css"]
html_js_files = ["securedme-sphinx.js"]
html_baseurl = f"https://docs.securedme.ca/{LANGUAGE}/"
html_show_sourcelink = False
html_last_updated_fmt = "%Y-%m-%d"
html_theme_options = {
    "logo_only": False,
    "prev_next_buttons_location": "both",
    "style_external_links": True,
    "style_nav_header_background": "#070d18",
    "collapse_navigation": False,
    "sticky_navigation": True,
    "navigation_depth": 4,
    "includehidden": True,
    "titles_only": False,
}
html_context = {
    "display_github": True,
    "github_user": "SeCuReDmE-main-dev",
    "github_repo": "securedme-scholarium",
    "github_version": "main",
    "conf_py_path": "/docs/",
    "current_language": LANGUAGE,
}


def add_page_metadata(app, pagename, templatename, context, doctree):
    manifest_path = DOCS / "data" / "suite-docs-lock.json"
    context["securedme_catalog_url"] = "https://securedme.ca/product/education/"
    context["securedme_docs_language"] = LANGUAGE
    if manifest_path.exists():
        context["securedme_suite_lock"] = json.loads(
            manifest_path.read_text(encoding="utf-8")
        )


def setup(app):
    app.connect("html-page-context", add_page_metadata)
    return {"version": "2.0", "parallel_read_safe": True}
