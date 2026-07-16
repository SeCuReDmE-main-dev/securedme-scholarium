from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


HIERARCHY = "I -> I_system^S -> H_lex -> G_lex -> I_lexicon"
USER_AGENT = "Scholarium-Teach-Corpus-Validator/1.0 (+https://www.scholarium.securedme.ca)"
REQUIRED_FIELDS = (
    "schema",
    "sourceCardId",
    "partition",
    "category",
    "sourceType",
    "title",
    "authors",
    "issued",
    "canonicalUrl",
    "citation",
    "metadataSource",
    "metadataRetrievedAt",
    "metadataRights",
    "classificationAuthority",
)

CONCEPTS = {
    "mastery_retrieval": ("mastery", "retrieval", "spacing", "feedback", "recall", "assessment"),
    "language_learning": ("language", "vocabulary", "pronunciation", "caption", "speaking", "bilingual"),
    "accessibility_udl": ("accessibility", "universal design", "assistive", "caption", "communication"),
    "neurodiversity": ("autism", "adhd", "dyslexia", "tourette", "dyspraxia", "neurodiversity"),
    "strengths_motivation": ("strength", "motivation", "agency", "identity", "mindset", "self-determination"),
    "social_belonging_safety": ("belonging", "peer", "bullying", "safety", "citizenship", "participation"),
    "sport_music_creativity": ("sport", "physical activity", "music", "art", "spatial", "creativity"),
    "legal_institutional": ("privacy", "minor", "accessibility", "artificial intelligence", "rights", "consent"),
}


def load_cards(path: Path) -> list[dict[str, Any]]:
    cards = []
    with path.open(encoding="utf-8") as stream:
        for line_number, line in enumerate(stream, start=1):
            if not line.strip():
                continue
            card = json.loads(line)
            missing = [field for field in REQUIRED_FIELDS if not card.get(field)]
            if missing:
                raise ValueError(f"Line {line_number} is missing required fields: {', '.join(missing)}")
            if card["schema"] != "synthia.education.source-card.v1":
                raise ValueError(f"Line {line_number} has unsupported schema {card['schema']}")
            cards.append(card)
    if len(cards) != 125:
        raise ValueError(f"Expected exactly 125 source cards, received {len(cards)}")
    ids = [card["sourceCardId"] for card in cards]
    identities = [card.get("doi") or card["canonicalUrl"] for card in cards]
    if len(set(ids)) != len(ids) or len(set(identities)) != len(identities):
        raise ValueError("Source-card identifiers and DOI/URL identities must be unique")
    return cards


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def digest_json(payload: Any) -> str:
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def run_synthia(card: dict[str, Any], python: Path, repo: Path) -> dict[str, Any]:
    text = f"{card['title']} | {card['category']} | {card.get('containerTitle', '')}"[:1400]
    command = [str(python), "-m", "synthia_core.cli", "lexicon", "classify", "--text", text, "--domain", "education"]
    completed = subprocess.run(command, cwd=repo, capture_output=True, text=True, encoding="utf-8", timeout=45, check=False)
    if completed.returncode != 0:
        raise RuntimeError(f"Synthia failed for {card['sourceCardId']}: {completed.stderr.strip()}")
    raw = json.loads(completed.stdout)
    if raw.get("hierarchy") != HIERARCHY:
        raise RuntimeError(f"Synthia hierarchy drift for {card['sourceCardId']}")
    return {
        "schema": "synthia.education.lexicon-classification.v1",
        "sourceCardId": card["sourceCardId"],
        "domain": raw.get("domain"),
        "matchedTerms": raw.get("matched_terms", []),
        "hierarchy": raw["hierarchy"],
        "classificationFamily": raw.get("plithogenic_profile", {}).get("classification_family"),
        "classifiedAs": raw.get("plithogenic_profile", {}).get("plithogenic_classified_as"),
        "weightedTruth": raw.get("plithogenic_profile", {}).get("weighted_cumulative_truth"),
        "contradictionSummary": raw.get("plithogenic_profile", {}).get("contradiction_summary"),
        "rawReceiptDigest": f"sha256:{digest_json(raw)}",
        "authorityBoundary": "Synthia organizes lexicon traceability and uncertainty; human review owns educational, legal, and research-quality decisions.",
    }


def verify_url(card: dict[str, Any]) -> dict[str, Any]:
    url = card["canonicalUrl"]
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/pdf,*/*"}, method="HEAD")
    status: int | None = None
    final_url = url
    outcome = "reachable"
    detail = ""
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.status
            final_url = response.geturl()
    except urllib.error.HTTPError as exc:
        status = exc.code
        outcome = "reachable_with_http_restriction" if exc.code in {401, 403, 405, 429} else "http_error"
        detail = str(exc.reason)
    except Exception as exc:  # A transient network failure does not prove that a source is invalid.
        outcome = "network_unresolved"
        detail = type(exc).__name__
    return {
        "schema": "synthia.education.url-verification.v1",
        "sourceCardId": card["sourceCardId"],
        "canonicalUrl": url,
        "finalUrl": final_url,
        "httpStatus": status,
        "outcome": outcome,
        "detail": detail,
        "rightsReview": card.get("licenseVerification") or "Official primary document; reuse and jurisdictional applicability require human review.",
    }


def concepts_for(card: dict[str, Any]) -> list[str]:
    title = card["title"].lower()
    matches = [concept for concept in CONCEPTS[card["category"]] if concept in title]
    return sorted(set(matches or [CONCEPTS[card["category"]][0]]))


def build_openie_packet(card: dict[str, Any], classification: dict[str, Any], verification: dict[str, Any]) -> dict[str, Any]:
    concepts = concepts_for(card)
    entities = [
        {"id": card["sourceCardId"], "type": "source", "label": card["title"]},
        {"id": f"category:{card['category']}", "type": "education_category", "label": card["category"]},
        {"id": f"authority:{hashlib.sha256(card['issuingAuthority'].encode('utf-8')).hexdigest()[:16]}", "type": "issuing_authority", "label": card["issuingAuthority"]},
    ]
    entities.extend({"id": f"concept:{re.sub(r'[^a-z0-9]+', '-', concept).strip('-')}", "type": "candidate_concept", "label": concept} for concept in concepts)
    relations = [
        {"subject": card["sourceCardId"], "predicate": "classified_in", "object": f"category:{card['category']}", "status": "metadata_supported"},
        {"subject": card["sourceCardId"], "predicate": "issued_by", "object": entities[2]["id"], "status": "metadata_supported"},
    ]
    relations.extend({"subject": card["sourceCardId"], "predicate": "mentions_candidate_concept", "object": entity["id"], "status": "title_match_or_category_fallback"} for entity in entities[3:])
    unresolved = []
    if card.get("primaryEvidenceCheck", {}).get("methodReviewRequired"):
        unresolved.append("method_review_required")
    if "require human review" in (card.get("licenseVerification") or "").lower() or card["sourceType"] == "official_primary_document":
        unresolved.append("rights_or_applicability_review_required")
    if verification["outcome"] not in {"reachable", "reachable_with_http_restriction"}:
        unresolved.append("canonical_url_not_resolved_during_run")
    if not classification["matchedTerms"]:
        unresolved.append("no_seeded_synthia_education_term_match")
    return {
        "schema": "synthia.education.openie-packet.v1",
        "sourceCardId": card["sourceCardId"],
        "partition": card["partition"],
        "entities": entities,
        "relations": relations,
        "contradictions": [],
        "unresolvedLayers": sorted(set(unresolved)),
        "sourceEvidence": {"citation": card["citation"], "canonicalUrl": card["canonicalUrl"]},
        "hierarchy": HIERARCHY,
        "authorityBoundary": "Relations are metadata and title-derived candidates, not validated causal or pedagogical claims.",
    }


def build_graph_shards(cards: list[dict[str, Any]], packets: list[dict[str, Any]], output: Path) -> dict[str, Any]:
    cards_by_id = {card["sourceCardId"]: card for card in cards}
    packets_by_partition: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for packet in packets:
        packets_by_partition[packet["partition"]].append(packet)
    partition_manifests = {}
    for partition in ("approved", "preparation", "quarantine"):
        shards = []
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for packet in packets_by_partition[partition]:
            grouped[cards_by_id[packet["sourceCardId"]]["category"]].append(packet)
        for category, category_packets in sorted(grouped.items()):
            node_map: dict[str, dict[str, Any]] = {}
            edges = []
            for packet in category_packets:
                for entity in packet["entities"]:
                    node_map[entity["id"]] = entity
                for index, relation in enumerate(packet["relations"]):
                    edges.append({"id": f"edge:{packet['sourceCardId']}:{index}", "source": relation["subject"], "target": relation["object"], "predicate": relation["predicate"], "status": relation["status"]})
            shard = {
                "schema": "synthia.education.graph-shard.v1",
                "partition": partition,
                "category": category,
                "nodes": sorted(node_map.values(), key=lambda node: node["id"]),
                "edges": sorted(edges, key=lambda edge: edge["id"]),
                "sourceCardIds": sorted(packet["sourceCardId"] for packet in category_packets),
                "authorityBoundary": "Graph membership is a traceability state, not approval of a scientific, legal, or pedagogical claim.",
            }
            shard_name = f"{category}.json"
            write_json(output / "graphs" / partition / shard_name, shard)
            shards.append({"path": f"{partition}/{shard_name}", "nodeCount": len(shard["nodes"]), "edgeCount": len(shard["edges"]), "sourceCount": len(shard["sourceCardIds"]), "digest": f"sha256:{digest_json(shard)}"})
        manifest = {
            "schema": "synthia.education.partition-graph.v1",
            "partition": partition,
            "sourceCount": len(packets_by_partition[partition]),
            "shards": shards,
            "authorityBoundary": "Only a qualified human review can move a source into approved.",
        }
        write_json(output / "graphs" / f"{partition}.json", manifest)
        partition_manifests[partition] = manifest
    return partition_manifests


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate and classify the Scholarium Teach education corpus.")
    parser.add_argument("--cards", type=Path, default=Path("docs/teach/corpus/source-cards.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("docs/teach/corpus"))
    parser.add_argument("--synthia-python", type=Path, required=True)
    parser.add_argument("--synthia-repo", type=Path, required=True)
    parser.add_argument("--skip-url-check", action="store_true")
    args = parser.parse_args()

    cards = load_cards(args.cards)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    classifications = [run_synthia(card, args.synthia_python, args.synthia_repo) for card in cards]
    if args.skip_url_check:
        verifications = [{"schema": "synthia.education.url-verification.v1", "sourceCardId": card["sourceCardId"], "canonicalUrl": card["canonicalUrl"], "finalUrl": card["canonicalUrl"], "httpStatus": None, "outcome": "not_checked", "detail": "", "rightsReview": card.get("licenseVerification") or "human review required"} for card in cards]
    else:
        with ThreadPoolExecutor(max_workers=16) as executor:
            verifications = list(executor.map(verify_url, cards))
    classification_by_id = {row["sourceCardId"]: row for row in classifications}
    verification_by_id = {row["sourceCardId"]: row for row in verifications}
    packets = [build_openie_packet(card, classification_by_id[card["sourceCardId"]], verification_by_id[card["sourceCardId"]]) for card in cards]
    partitions = build_graph_shards(cards, packets, args.output)

    write_jsonl(args.output / "synthia-classifications.jsonl", classifications)
    write_jsonl(args.output / "url-verifications.jsonl", verifications)
    write_jsonl(args.output / "openie-packets.jsonl", packets)
    manifest = {
        "schema": "synthia.education.classification-run.v1",
        "generatedAt": generated_at,
        "sourceCardCount": len(cards),
        "classificationCount": len(classifications),
        "openiePacketCount": len(packets),
        "urlVerificationCount": len(verifications),
        "partitions": {name: payload["sourceCount"] for name, payload in partitions.items()},
        "urlOutcomes": dict(sorted((outcome, sum(1 for row in verifications if row["outcome"] == outcome)) for outcome in {row["outcome"] for row in verifications})),
        "hierarchy": HIERARCHY,
        "synthiaCommand": "python -m synthia_core.cli lexicon classify --text <bounded-source-text> --domain education",
        "synthiaInvocationCount": len(classifications),
        "promotionPolicy": "No source is promoted from preparation without qualified human method, rights, and applicability review.",
        "memoryGateway": {"store": "MemoryLake.index_records", "retrieval": "HippoRAG.retrieve_dpr", "generation": "Codex or Gemini", "intraPluginMemory": False},
        "authorityBoundary": "Synthia is traceability support. It does not certify taxonomy, law, pedagogy, or scientific truth.",
    }
    write_json(args.output / "classification-run.json", manifest)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
