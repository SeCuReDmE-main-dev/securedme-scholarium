from __future__ import annotations

import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


USER_AGENT = "Scholarium-Teach-Research/0.1 (+https://www.scholarium.securedme.ca)"
CROSSREF = "https://api.crossref.org/works"
EMPIRICAL = re.compile(
    r"\b(randomi[sz]ed|trial|experiment(?:al)?|intervention|longitudinal|prospective|controlled|"
    r"evaluation|effects? of|impact of|predict(?:s|ed|ive)?|association|cohort|feasibility|pilot study)\b",
    re.IGNORECASE,
)
EXCLUDED = re.compile(
    r"\b(systematic review|scoping review|meta-analysis|review of|protocol|editorial|commentary|"
    r"perspective|bibliometric|correction|retraction|erratum)\b",
    re.IGNORECASE,
)


CATEGORIES = [
    {
        "id": "mastery_retrieval",
        "label": "Mastery, retrieval, spacing and formative feedback",
        "target": 15,
        "queries": [
            "retrieval practice experiment students",
            "spaced repetition controlled learning students",
            "formative assessment intervention students",
            "mastery learning experimental study education",
        ],
    },
    {
        "id": "language_learning",
        "label": "Second-language learning, pronunciation and captioned media",
        "target": 15,
        "queries": [
            "second language learning experiment students",
            "foreign language pronunciation training experiment",
            "captioned video language learning intervention",
            "spaced vocabulary learning experiment",
        ],
    },
    {
        "id": "accessibility_udl",
        "label": "Accessibility, universal design and assistive learning",
        "target": 15,
        "queries": [
            "universal design for learning intervention students",
            "assistive technology education controlled trial",
            "captioning deaf students learning experiment",
            "augmentative communication classroom intervention",
        ],
    },
    {
        "id": "neurodiversity",
        "label": "Autism, ADHD, dyslexia, Tourette and motor diversity",
        "target": 20,
        "queries": [
            "autism classroom intervention trial",
            "ADHD classroom intervention randomized",
            "dyslexia reading intervention randomized",
            "Tourette school intervention study",
            "dyspraxia education intervention study",
        ],
    },
    {
        "id": "strengths_motivation",
        "label": "Strengths, motivation, agency and learner identity",
        "target": 15,
        "queries": [
            "self determination intervention students experiment",
            "strengths based intervention students trial",
            "growth mindset intervention randomized students",
            "student agency intervention longitudinal",
        ],
    },
    {
        "id": "social_belonging_safety",
        "label": "Belonging, peer learning, bullying prevention and digital participation",
        "target": 15,
        "queries": [
            "student belonging intervention randomized",
            "peer learning intervention experiment students",
            "bullying prevention randomized trial school",
            "digital citizenship intervention students evaluation",
        ],
    },
    {
        "id": "sport_music_creativity",
        "label": "Sport, music, arts, spatial reasoning and creativity",
        "target": 15,
        "queries": [
            "sport participation academic longitudinal students",
            "physical activity cognition school randomized trial",
            "music education intervention students experiment",
            "arts education creativity intervention students",
            "spatial reasoning training experiment students",
        ],
    },
    {
        "id": "legal_institutional",
        "label": "Privacy, minors, accessibility and AI governance",
        "target": 15,
        "queries": [],
    },
]


OFFICIAL_SOURCES = [
    ("Quebec National Assembly", "Act respecting the protection of personal information in the private sector", "https://www.legisquebec.gouv.qc.ca/en/document/cs/P-39.1", "Quebec", "1993-06-15"),
    ("Quebec National Assembly", "Act respecting Access to documents held by public bodies and the Protection of personal information", "https://www.legisquebec.gouv.qc.ca/en/document/cs/A-2.1", "Quebec", "1982-06-22"),
    ("Quebec National Assembly", "Act to modernize legislative provisions as regards the protection of personal information", "https://www.publicationsduquebec.gouv.qc.ca/fileadmin/Fichiers_client/lois_et_reglements/LoisAnnuelles/en/2021/2021C25A.PDF", "Quebec", "2021-09-22"),
    ("Commission d'accès à l'information du Québec", "Guide to conducting a privacy impact assessment", "https://www.cai.gouv.qc.ca/uploads/pdfs/CAI_GU_EFVP.pdf", "Quebec", "2024-04-01"),
    ("Commission d'accès à l'information du Québec", "Privacy incidents guidance", "https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/incidents-confidentialite", "Quebec", "2023-09-22"),
    ("Parliament of Canada", "Personal Information Protection and Electronic Documents Act", "https://laws-lois.justice.gc.ca/eng/acts/P-8.6/index.html", "Canada", "2000-04-13"),
    ("Parliament of Canada", "Privacy Act", "https://laws-lois.justice.gc.ca/eng/acts/P-21/index.html", "Canada", "1983-07-01"),
    ("Office of the Privacy Commissioner of Canada", "Privacy and youth", "https://www.priv.gc.ca/en/privacy-topics/information-and-advice-for-individuals/privacy-and-kids/", "Canada", "2024-01-01"),
    ("French Republic", "Law no. 78-17 on information technology, data files and civil liberties", "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000886460", "France", "1978-01-06"),
    ("CNIL", "Data protection impact assessment", "https://www.cnil.fr/en/privacy-impact-assessment-pia", "France", "2018-05-25"),
    ("CNIL", "Eight recommendations to enhance the protection of children online", "https://www.cnil.fr/en/digital-rights-children", "France", "2021-06-01"),
    ("European Parliament and Council", "General Data Protection Regulation (EU) 2016/679", "https://eur-lex.europa.eu/eli/reg/2016/679/oj", "European Union", "2016-04-27"),
    ("European Parliament and Council", "Artificial Intelligence Act (EU) 2024/1689", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", "European Union", "2024-06-13"),
    ("United Nations", "Convention on the Rights of the Child", "https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child", "International", "1989-11-20"),
    ("United Nations", "Convention on the Rights of Persons with Disabilities", "https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-persons-disabilities", "International", "2006-12-13"),
]


def request_json(url: str, attempts: int = 3) -> dict[str, Any]:
    last: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.load(response)
        except Exception as exc:  # network retries are bounded and reported
            last = exc
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Request failed after {attempts} attempts: {url}: {last}")


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def date_from_parts(item: dict[str, Any]) -> str:
    parts = item.get("published", {}).get("date-parts", [[]])[0]
    if not parts:
        return ""
    padded = list(parts[:3]) + [1] * (3 - len(parts[:3]))
    return f"{int(padded[0]):04d}-{int(padded[1]):02d}-{int(padded[2]):02d}"


def authors(item: dict[str, Any]) -> list[str]:
    output = []
    for author in item.get("author", []):
        name = clean(" ".join(part for part in [author.get("given", ""), author.get("family", "")] if part))
        if name:
            output.append(name)
    return output[:30]


def stable_id(prefix: str, identity: str) -> str:
    return f"{prefix}-{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:20]}"


def citation_text(author_names: list[str], issued: str, title: str, container: str, doi: str) -> str:
    author = author_names[0] + (" et al." if len(author_names) > 1 else "")
    return f"{author} ({issued[:4]}). {title}. {container}. https://doi.org/{doi}"


def crossref_candidates(category: dict[str, Any], retrieved_at: str) -> list[dict[str, Any]]:
    candidates: dict[str, dict[str, Any]] = {}
    select = "DOI,title,author,published,URL,container-title,license,type,publisher,update-to"
    for query in category["queries"]:
        params = {
            "query.bibliographic": query,
            "filter": "type:journal-article,from-pub-date:2000-01-01,has-license:true",
            "rows": 100,
            "select": select,
            "sort": "relevance",
            "order": "desc",
        }
        payload = request_json(CROSSREF + "?" + urllib.parse.urlencode(params))
        for rank, item in enumerate(payload.get("message", {}).get("items", [])):
            doi = str(item.get("DOI", "")).strip().lower()
            title = clean((item.get("title") or [""])[0])
            names = authors(item)
            issued = date_from_parts(item)
            licenses = sorted({entry.get("URL", "").strip() for entry in item.get("license", []) if entry.get("URL")})
            if not doi or not title or not names or not issued or not licenses:
                continue
            if EXCLUDED.search(title) or not EMPIRICAL.search(title) or item.get("update-to"):
                continue
            container = clean((item.get("container-title") or [""])[0])
            score = 100 - rank + sum(5 for term in query.lower().split() if term in title.lower())
            card = {
                "schema": "synthia.education.source-card.v1",
                "sourceCardId": stable_id("source", doi),
                "partition": "preparation",
                "category": category["id"],
                "sourceType": "peer_reviewed_journal_article",
                "title": title,
                "authors": names,
                "issuingAuthority": clean(item.get("publisher", "")),
                "issued": issued,
                "canonicalUrl": f"https://doi.org/{doi}",
                "doi": doi,
                "containerTitle": container,
                "licenseUrls": licenses,
                "citation": citation_text(names, issued, title, container, doi),
                "metadataSource": "Crossref REST API member-deposited metadata",
                "metadataRetrievedAt": retrieved_at,
                "metadataRights": "Crossref bibliographic metadata reusable; abstracts are not stored",
                "primaryEvidenceCheck": {
                    "journalArticle": True,
                    "empiricalTitleMarker": EMPIRICAL.search(title).group(0).lower(),
                    "reviewProtocolMarkerAbsent": True,
                    "methodReviewRequired": True,
                },
                "licenseVerification": "publisher-deposited URL present; resolution and article-level terms require human review",
                "classificationAuthority": "Synthia traceability support under human review",
                "admissionReason": "metadata complete; empirical candidate; not yet method-reviewed",
                "score": score,
                "queryProvenance": query,
            }
            if doi not in candidates or score > candidates[doi]["score"]:
                candidates[doi] = card
        time.sleep(0.15)
    return sorted(candidates.values(), key=lambda card: (-card["score"], card["doi"]))


def official_cards(retrieved_at: str) -> list[dict[str, Any]]:
    cards = []
    for authority, title, url, jurisdiction, issued in OFFICIAL_SOURCES:
        cards.append({
            "schema": "synthia.education.source-card.v1",
            "sourceCardId": stable_id("source", url),
            "partition": "preparation",
            "category": "legal_institutional",
            "sourceType": "official_primary_document",
            "title": title,
            "authors": [authority],
            "issuingAuthority": authority,
            "issued": issued,
            "canonicalUrl": url,
            "doi": None,
            "containerTitle": jurisdiction,
            "licenseUrls": [],
            "citation": f"{authority} ({issued[:4]}). {title}. {url}",
            "metadataSource": "official issuing-authority URL",
            "metadataRetrievedAt": retrieved_at,
            "metadataRights": "official public document; reuse and republication remain subject to issuing-authority terms",
            "primaryEvidenceCheck": {"officialAuthority": True, "methodReviewRequired": False},
            "licenseVerification": "official source; no content copied into the card",
            "classificationAuthority": "Synthia traceability support under human and legal review",
            "admissionReason": "official source metadata complete; legal applicability still requires qualified review",
            "queryProvenance": "curated official authority registry",
        })
    return cards


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="docs/teach/corpus")
    args = parser.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    selected: list[dict[str, Any]] = []
    diagnostics = []
    for category in CATEGORIES:
        if category["id"] == "legal_institutional":
            cards = official_cards(retrieved_at)
        else:
            candidates = crossref_candidates(category, retrieved_at)
            cards = candidates[: category["target"]]
            diagnostics.append({"category": category["id"], "candidateCount": len(candidates), "selectedCount": len(cards)})
        if len(cards) != category["target"]:
            raise RuntimeError(f"Category {category['id']} produced {len(cards)} of {category['target']} required cards")
        selected.extend(cards)
    if len(selected) != 125:
        raise RuntimeError(f"Expected 125 cards, got {len(selected)}")
    identities = [card["doi"] or card["canonicalUrl"] for card in selected]
    if len(set(identities)) != 125 or len({card["sourceCardId"] for card in selected}) != 125:
        raise RuntimeError("Source cards are not unique")
    categories_payload = {
        "schema": "synthia.education.source-categories.v1",
        "generatedAt": retrieved_at,
        "totalTarget": 125,
        "categories": [{key: value for key, value in category.items() if key != "queries"} for category in CATEGORIES],
    }
    write_json(out / "source-categories.v1.json", categories_payload)
    with (out / "source-cards.jsonl").open("w", encoding="utf-8", newline="\n") as stream:
        for card in selected:
            stream.write(json.dumps(card, ensure_ascii=False, sort_keys=True) + "\n")
    manifest = {
        "schema": "synthia.education.corpus-manifest.v1",
        "generatedAt": retrieved_at,
        "cardCount": len(selected),
        "uniqueIdentityCount": len(set(identities)),
        "partitions": {"approved": 0, "preparation": 125, "quarantine": 0},
        "categories": {category["id"]: category["target"] for category in CATEGORIES},
        "diagnostics": diagnostics,
        "crossrefPolicy": {
            "apiKeyUsed": False,
            "abstractStored": False,
            "licenseUrlPresenceRequired": True,
            "retractionsAndUpdatesExcludedWhenVisible": True,
            "humanMethodReviewRequired": True,
        },
        "authorityBoundary": "Synthia organizes provenance and uncertainty; it does not certify research quality, legal applicability, or educational truth.",
    }
    write_json(out / "corpus-manifest.json", manifest)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
