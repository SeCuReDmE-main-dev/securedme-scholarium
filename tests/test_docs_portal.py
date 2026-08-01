from __future__ import annotations

import importlib.util
import json
import re
import tempfile
import unittest
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]


def load_build_module():
    path = ROOT / "tools" / "build_sphinx_docs.py"
    spec = importlib.util.spec_from_file_location("build_sphinx_docs", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def load_built_validator_module():
    path = ROOT / "tools" / "validate_built_site.py"
    spec = importlib.util.spec_from_file_location("validate_built_site", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def write_complete_language_fixtures(root: Path) -> None:
    metadata = (
        "<link rel='canonical' href='https://docs.securedme.ca/'>"
        "<link rel='alternate' hreflang='en' href='https://docs.securedme.ca/en/'>"
        "<link rel='alternate' hreflang='fr' href='https://docs.securedme.ca/fr/'>"
        "<link rel='alternate' hreflang='es' href='https://docs.securedme.ca/es/'>"
        "<link rel='alternate' hreflang='x-default' href='https://docs.securedme.ca/en/'>"
    )
    for language in ("en", "fr", "es"):
        language_root = root / language
        language_root.mkdir()
        for index in range(100):
            (language_root / f"page-{index}.html").write_text(metadata, encoding="utf-8")


class RegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.registry = yaml.safe_load((ROOT / "suite-sources.yml").read_text(encoding="utf-8"))

    def test_registry_has_twelve_unique_pinned_tools(self) -> None:
        tools = self.registry["tools"]
        self.assertEqual(self.registry["schema"], "securedme.suite-sources.v2")
        self.assertEqual(len(tools), 12)
        self.assertEqual(len({tool["slug"] for tool in tools}), 12)
        self.assertTrue(all(re.fullmatch(r"[0-9a-f]{40}", tool["ref"]) for tool in tools))

    def test_ci_fetch_uses_sparse_checkout(self) -> None:
        source = (ROOT / "tools" / "sync_suite_docs.py").read_text(encoding="utf-8")
        self.assertIn('"fetch",\n            "--filter=blob:none"', source)
        self.assertIn('"sparse-checkout", "set", "docs"', source)

    def test_aggregator_resolution_is_independent_of_checkout_name(self) -> None:
        sync = importlib.util.spec_from_file_location(
            "sync_suite_docs", ROOT / "tools" / "sync_suite_docs.py"
        )
        module = importlib.util.module_from_spec(sync)
        assert sync.loader
        sync.loader.exec_module(module)
        source_root = ROOT / "external-sources"
        self.assertEqual(module.resolve_repository_root(source_root, "securedme-scholarium"), ROOT)
        self.assertEqual(module.resolve_repository_root(source_root, "QuaNThoR"), source_root / "QuaNThoR")

    def test_lock_matches_registry_and_contains_sha256(self) -> None:
        lock = json.loads((ROOT / "docs" / "data" / "suite-docs-lock.json").read_text(encoding="utf-8"))
        self.assertEqual(lock["schema"], "securedme.suite-docs-lock.v2")
        self.assertEqual({tool["slug"] for tool in lock["tools"]}, {tool["slug"] for tool in self.registry["tools"]})
        for tool in lock["tools"]:
            self.assertRegex(tool["contract_sha256"], r"^[0-9a-f]{64}$")
            self.assertTrue(tool["files"])
            self.assertTrue(all(re.fullmatch(r"[0-9a-f]{64}", item["sha256"]) for item in tool["files"]))
            self.assertFalse(any("node_modules" in item["path"] or ".env" in item["path"] for item in tool["files"]))


class LearningAssetTests(unittest.TestCase):
    def test_prompt_contract(self) -> None:
        data = json.loads((ROOT / "docs" / "data" / "collaboration-prompts.json").read_text(encoding="utf-8"))
        self.assertEqual(data["schema"], "securedme.collaboration-prompts.v2")
        self.assertEqual(len(data["prompts"]), 40)
        self.assertEqual(len({record["id"] for record in data["prompts"]}), 40)

    def test_video_pairs_resolve(self) -> None:
        data = json.loads((ROOT / "docs" / "data" / "video-library.json").read_text(encoding="utf-8"))
        self.assertEqual(data["schema"], "securedme.video-library.v2")
        ids = {video["video_id"] for video in data["videos"]}
        self.assertTrue(ids)
        for video in data["videos"]:
            pair = video["paired_video_id"]
            self.assertTrue(pair is None or pair in ids)
            self.assertIn("status", video["transcript"])


class DiscoveryAssetTests(unittest.TestCase):
    def test_metadata_sitemap_and_robots_are_generated(self) -> None:
        build = load_build_module()
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            for language in build.LANGUAGES:
                page = output / language / "guide" / "index.html"
                page.parent.mkdir(parents=True)
                page.write_text(
                    '<html><head><title>Guide</title><link rel="canonical" href="legacy.html"></head><body></body></html>',
                    encoding="utf-8",
                )
            build.inject_page_metadata(output)
            build.write_discovery_assets(output)
            rendered = (output / "fr" / "guide" / "index.html").read_text(encoding="utf-8")
            self.assertIn('rel="canonical" href="https://docs.securedme.ca/fr/guide/"', rendered)
            self.assertEqual(rendered.count('rel="canonical"'), 1)
            self.assertIn('hreflang="en"', rendered)
            self.assertIn('application/ld+json', rendered)
            self.assertIn("https://docs.securedme.ca/es/guide/", (output / "sitemap.xml").read_text(encoding="utf-8"))
            self.assertIn("Sitemap: https://docs.securedme.ca/sitemap.xml", (output / "robots.txt").read_text(encoding="ascii"))


class BuiltSiteValidationTests(unittest.TestCase):
    def test_broken_internal_reference_is_rejected(self) -> None:
        module = load_built_validator_module()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "index.html").write_text("<a href='missing.html'>Missing</a>", encoding="utf-8")
            write_complete_language_fixtures(root)
            with self.assertRaisesRegex(AssertionError, "Broken internal references"):
                module.validate(root)

    def test_private_path_is_rejected(self) -> None:
        module = load_built_validator_module()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "index.html").write_text(r"C:\Users\example\private", encoding="utf-8")
            write_complete_language_fixtures(root)
            with self.assertRaisesRegex(AssertionError, "Secret or private path patterns"):
                module.validate(root)

    def test_reference_cannot_escape_build_root(self) -> None:
        module = load_built_validator_module()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "index.html").write_text("<a href='../outside.html'>Outside</a>", encoding="utf-8")
            write_complete_language_fixtures(root)
            with self.assertRaisesRegex(AssertionError, "Reference escapes build root"):
                module.validate(root)


if __name__ == "__main__":
    unittest.main()
