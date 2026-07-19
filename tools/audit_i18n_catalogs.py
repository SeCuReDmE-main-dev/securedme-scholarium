from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
I18N_ROOT = ROOT / "apps" / "web" / "public" / "i18n"
OUTPUT = ROOT / "output" / "localization" / "i18n-quality-report.json"

FR_BLOCKED = [
    r"rang d'aliment",
    r"\bTRAIL\b",
    r"\bAccess\b",
    r"capsule d'Aucune",
    r"une capsule d'Aucune",
    r"Heureur",
    r"num[eé]risation secr[eè]te",
    r"\bfum[eé]e QA\b",
    r"\bretrait\b",
]

ES_BLOCKED = [
    r"\bCOMMONS\b",
    r"\bKNOWLEDGE TRAIL\b",
    r"\bAccessibility\b",
    r"\bAccess\b",
    r"\bArrowLeft\b",
    r"\bArrowRight\b",
    r"\bAdaptateurs prives\b",
    r"\bAucun cercle\b",
    r"\bAucun projet\b",
    r"\bAUTHOR-LED\b",
    r"\bAdaptive, multimodal learning\b",
    r"\bA public pre-alpha commons\b",
]

EN_WORDS = {
    "the", "with", "before", "after", "private", "public", "source", "review", "learning",
    "project", "profile", "publication", "provider", "checkout", "ranking", "access",
    "knowledge", "trail", "author", "created", "saved", "could", "never", "required",
    "prepared", "open", "choose", "stored",
}

FR_WORDS = {
    "avec", "avant", "apres", "après", "projet", "profil", "publication", "source",
    "auteur", "aucun", "aucune", "enseignant", "eleve", "élève", "donnees", "données",
    "revoir", "apprentissage",
}

ALLOWED_UNTRANSLATED = {
    "Open Hardware Collective",
    "SecuredMe Education",
    "SECUREDME EDUCATION",
}

ALLOWED_FR_VALUES = {
    "Aller au contenu principal",
    "Aucune reconnaissance.",
    "Auteur · URL · Date · Licence · Citation",
    "Consentements indisponibles.",
    "Conversation finale",
    "ESPAGNOL · CONVERSATION 01",
    "Expression originale",
    "D’une idée à un artefact public.",
    "Tableau indisponible.",
    "Temps restant du sprint",
    "Texte et choix disponibles",
    "◌ PUBLIC — VÉRIFICATION EN COURS",
}


def load(locale: str) -> dict[str, object]:
    return json.loads((I18N_ROOT / f"{locale}.json").read_text(encoding="utf-8"))


def hit(patterns: list[str], value: str) -> list[str]:
    return [pattern for pattern in patterns if re.search(pattern, value, re.IGNORECASE)]


def words(value: str) -> set[str]:
    return {word.casefold().strip(".,:;!?()[]{}’'\"") for word in value.split()}


def main() -> int:
    en = load("en-CA")["strings"]
    fr = load("fr-CA")["strings"]
    es = load("es")["strings"]
    issues: list[dict[str, object]] = []

    for key, value in fr.items():
        if key in ALLOWED_UNTRANSLATED or value in ALLOWED_FR_VALUES:
            continue
        blocked = hit(FR_BLOCKED, value)
        same_long = value == en.get(key) and len(value) >= 18
        value_words = words(value)
        english_leak = bool(value_words & EN_WORDS) and not bool(value_words & FR_WORDS) and len(value_words) >= 4
        if blocked or same_long or english_leak:
            issues.append({
                "locale": "fr-CA",
                "key": key,
                "value": value,
                "blocked": blocked,
                "sameAsEnglish": same_long,
                "englishLeak": english_leak,
            })

    for key, value in es.items():
        if key in ALLOWED_UNTRANSLATED:
            continue
        blocked = hit(ES_BLOCKED, value)
        same_long = value == en.get(key) and len(value) >= 18
        value_words = words(value)
        english_leak = bool(value_words & EN_WORDS) and len(value_words) >= 4
        french_leak = bool(value_words & FR_WORDS) and len(value_words) >= 2
        if blocked or same_long or english_leak or french_leak:
            issues.append({
                "locale": "es",
                "key": key,
                "value": value,
                "blocked": blocked,
                "sameAsEnglish": same_long,
                "englishLeak": english_leak,
                "frenchLeak": french_leak,
            })

    report = {
        "schema": "scholarium.i18n-quality.v1",
        "totalIssues": len(issues),
        "byLocale": {
            locale: sum(1 for issue in issues if issue["locale"] == locale)
            for locale in ("fr-CA", "es")
        },
        "issues": issues,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Scholarium i18n quality issues: {report['totalIssues']}")
    print(json.dumps(report["byLocale"], ensure_ascii=False))
    for issue in issues[:30]:
        print(f"{issue['locale']} :: {issue['key']} => {issue['value']}")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
