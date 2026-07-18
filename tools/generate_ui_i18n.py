from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import argostranslate.translate


ROOT = Path(__file__).resolve().parents[1]
APP_ROOT = ROOT / "apps" / "web" / "app"
OUTPUT_ROOT = ROOT / "apps" / "web" / "public" / "i18n"
SOURCE_REVISION = "2026-07-17.1"
PROTECTED_TERMS = [
    "SecuredMe", "Scholarium", "Teach", "Synthia", "QuaNTecH-ViD", "Academia.edu",
    "GitHub", "GitLab", "SourceForge", "YouTube", "TikTok", "Zenodo", "ORCID",
    "Theme", "Access", "Autism Calm", "ADHD Sprint", "Deep Work", "T-I-F", "API",
    "DOI", "RTMPS", "SRT", "WCAG", "AI", "RAG",
]
REQUIRED_UI_STRINGS = {
    "Sourd / langue signée", "Communication non verbale", "Lecture adaptée à la dyslexie",
    "Motricité adaptée à la dyspraxie", "Profils d’accès", "Prochain geste", "Prochain geste :",
    "Répondre à la question active", "répondre à la question active.", "Ta réponse",
    "Prêt pour une première tentative.", "Nouvelle", "Guidée", "Rappelée", "Contextualisée",
    "Maîtrisée", "À revoir", "wait", "hint", "first segment", "segmented", "full model",
}
SPANISH_LESSON_MARKERS = re.compile(
    r"\b(necesito|puedes|por favor|hola|donde|cómo|como estas|respuesta|pregunta)\b", re.IGNORECASE
)
FRENCH_MARKERS = {
    "a", "au", "aux", "avec", "ce", "cette", "dans", "de", "des", "du", "elle",
    "en", "enseignant", "est", "et", "etre", "faire", "il", "je", "la", "le", "les",
    "maitrisees", "ne", "nous", "pas", "plus", "pour", "question", "que", "qui", "sans",
    "sur", "une", "un", "vos", "votre",
}
FR_SINGLE_WORDS = {
    "Cours", "Forces", "Statistiques", "Sources", "Enseignant", "Controles", "Verifier",
    "Demarrer", "Reinitialiser", "Pause", "Portfolio", "Acces", "Langue", "Francais",
}

EN_OVERRIDES = {
    "Sauvegardes": "Saved",
    "Sourd / langue signée": "Deaf / signed language",
    "Communication non verbale": "Nonverbal communication",
    "Lecture adaptée à la dyslexie": "Dyslexia-friendly reading",
    "Motricité adaptée à la dyspraxie": "Dyspraxia-friendly motor controls",
    "Contraste élevé": "High contrast",
    "Saturation réduite": "Reduced saturation",
    "Densité calme": "Calm density",
    "Mouvement réduit": "Reduced motion",
    "Son actif": "Sound on",
    "Données réduites": "Data saver",
    "Ligne de lecture étroite": "Narrow reading measure",
    "Espacement de lecture": "Reading spacing",
    "Vitesse audio": "Audio speed",
    "Durée du sprint": "Sprint duration",
    "Communication": "Communication",
    "Voix facultative": "Voice optional",
    "Texte et choix disponibles": "Text and choices available",
    "Aucune pénalité de délai": "No delay penalty",
    "Phonétique": "Phonetics",
    "Vérifier": "Check",
    "Profils d’accès": "Access profiles",
    "Prochain geste": "Next action",
    "Prochain geste :": "Next action:",
    "Répondre à la question active": "Answer the active question",
    "répondre à la question active.": "answer the active question.",
    "Ta réponse": "Your answer",
    "Prêt pour une première tentative.": "Ready for a first attempt.",
    "Nouvelle": "New",
    "Guidée": "Guided",
    "Rappelée": "Recalled",
    "Contextualisée": "Contextualized",
    "Maîtrisée": "Mastered",
    "À revoir": "Review",
    "wait": "wait",
    "hint": "hint",
    "first segment": "first segment",
    "segmented": "segmented",
    "full model": "full model",
}

FR_OVERRIDES = {
    "Language": "Langue",
    "Theme": "Thème",
    "Access": "Accès",
    "Dark": "Sombre",
    "Light": "Clair",
    "Base": "Base",
    "Choose your reading profile": "Choisissez votre profil de lecture",
    "Stored only in this browser.": "Stocké uniquement dans ce navigateur.",
    "Standard Scholarium presentation": "Présentation Scholarium standard",
    "Softer effects, calmer spacing": "Effets adoucis et espacement plus calme",
    "Strong focus and action priority": "Mise au point renforcée et priorité à l’action",
    "Muted decoration and reading contrast": "Décor atténué et contraste de lecture renforcé",
    "Student": "Élève",
    "Teacher": "Enseignant",
    "Organization": "Organisation",
    "Controls": "Contrôles",
    "Mastered": "Maîtrisé",
    "In progress": "En apprentissage",
    "Review": "À revoir",
    "Acces et correction": "Accès et correction",
    "Aucune penalite de delai": "Aucune pénalité de délai",
    "A revoir": "À revoir",
    "Maitrisee": "Maîtrisée",
    "Preuves d'apprentissage": "Preuves d’apprentissage",
    "Verifier puis revoir au besoin": "Vérifier, puis revoir au besoin",
    "Publish work": "Publier un travail",
    "Sauvegardes": "Sauvegardés",
    "Sourd / langue signée": "Sourd / langue signée",
    "Communication non verbale": "Communication non verbale",
    "Lecture adaptée à la dyslexie": "Lecture adaptée à la dyslexie",
    "Motricité adaptée à la dyspraxie": "Motricité adaptée à la dyspraxie",
    "Contraste élevé": "Contraste élevé",
    "Saturation réduite": "Saturation réduite",
    "Densité calme": "Densité calme",
    "Mouvement réduit": "Mouvement réduit",
    "Données réduites": "Données réduites",
    "Ligne de lecture étroite": "Ligne de lecture étroite",
    "Phonétique": "Phonétique",
    "Vérifier": "Vérifier",
    "Profils d’accès": "Profils d’accès",
    "Prochain geste": "Prochain geste",
    "Prochain geste :": "Prochain geste :",
    "Répondre à la question active": "Répondre à la question active",
    "répondre à la question active.": "répondre à la question active.",
    "Ta réponse": "Ta réponse",
    "Prêt pour une première tentative.": "Prêt pour une première tentative.",
    "wait": "attendre",
    "hint": "indice",
    "first segment": "premier segment",
    "segmented": "segmenté",
    "full model": "modèle complet",
}

ES_OVERRIDES = {
    "Language": "Idioma",
    "Theme": "Tema",
    "Access": "Acceso",
    "Dark": "Oscuro",
    "Light": "Claro",
    "Base": "Base",
    "Choose your reading profile": "Elige tu perfil de lectura",
    "Stored only in this browser.": "Guardado solo en este navegador.",
    "Standard Scholarium presentation": "Presentación estándar de Scholarium",
    "Softer effects, calmer spacing": "Efectos suaves y espaciado más tranquilo",
    "Strong focus and action priority": "Enfoque reforzado y prioridad de acción",
    "Muted decoration and reading contrast": "Decoración atenuada y mayor contraste de lectura",
    "Student": "Estudiante",
    "Teacher": "Docente",
    "Organization": "Organización",
    "Controls": "Controles",
    "Mastered": "Dominado",
    "In progress": "En aprendizaje",
    "Review": "Para repasar",
    "Publish work": "Publicar trabajo",
    "Sauvegardes": "Guardados",
    "Sourd / langue signée": "Persona sorda / lengua de señas",
    "Communication non verbale": "Comunicación no verbal",
    "Lecture adaptée à la dyslexie": "Lectura adaptada para dislexia",
    "Motricité adaptée à la dyspraxie": "Motricidad adaptada para dispraxia",
    "Contraste élevé": "Contraste alto",
    "Saturation réduite": "Saturación reducida",
    "Densité calme": "Densidad tranquila",
    "Mouvement réduit": "Movimiento reducido",
    "Son actif": "Sonido activado",
    "Données réduites": "Ahorro de datos",
    "Ligne de lecture étroite": "Línea de lectura estrecha",
    "Espacement de lecture": "Espaciado de lectura",
    "Vitesse audio": "Velocidad del audio",
    "Durée du sprint": "Duración del sprint",
    "Voix facultative": "Voz opcional",
    "Texte et choix disponibles": "Texto y opciones disponibles",
    "Aucune pénalité de délai": "Sin penalización por demora",
    "Phonétique": "Fonética",
    "Vérifier": "Verificar",
    "Profils d’accès": "Perfiles de acceso",
    "Prochain geste": "Siguiente acción",
    "Prochain geste :": "Siguiente acción:",
    "Répondre à la question active": "Responder a la pregunta activa",
    "répondre à la question active.": "responder a la pregunta activa.",
    "Ta réponse": "Tu respuesta",
    "Prêt pour une première tentative.": "Listo para un primer intento.",
    "Nouvelle": "Nueva",
    "Guidée": "Guiada",
    "Rappelée": "Recordada",
    "Contextualisée": "Contextualizada",
    "Maîtrisée": "Dominada",
    "À revoir": "Para repasar",
    "wait": "esperar",
    "hint": "pista",
    "first segment": "primer segmento",
    "segmented": "segmentado",
    "full model": "modelo completo",
}


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def likely_visible(value: str) -> bool:
    value = clean(value)
    if not value or len(value) > 500 or SPANISH_LESSON_MARKERS.search(value):
        return False
    if value.startswith(("/", "./", "../", "#", "http://", "https://", "mailto:", "data:", "var(--")):
        return False
    if any(marker in value for marker in ("${", "=>", "className", "useState", " const ", "&&", "===", "</", ");", " as ")):
        return False
    if re.fullmatch(r"[a-z0-9_-]+", value) and ("-" in value or "_" in value):
        return False
    if re.fullmatch(r"[.#]?[a-z][a-z0-9-]*(\s+[.#]?[a-z][a-z0-9-]*)*", value) and len(value.split()) <= 3:
        return value.capitalize() in FR_SINGLE_WORDS
    if not re.search(r"[A-Za-zÀ-ÿ]", value):
        return False
    return " " in value or len(value) >= 3


def extract_strings() -> list[str]:
    values: set[str] = set(REQUIRED_UI_STRINGS)
    jsx_text = re.compile(r">([^<>{}]+)<", re.DOTALL)
    quoted_patterns = [
        re.compile(r'"((?:\\.|[^"\\])*)"', re.DOTALL),
        re.compile(r"'((?:\\.|[^'\\])*)'", re.DOTALL),
        re.compile(r"`((?:\\.|[^`\\])*)`", re.DOTALL),
    ]
    for path in sorted(APP_ROOT.rglob("*.tsx")):
        source = path.read_text(encoding="utf-8")
        for match in jsx_text.finditer(source):
            value = clean(match.group(1))
            if likely_visible(value):
                values.add(value)
        for pattern in quoted_patterns:
            for match in pattern.finditer(source):
                value = clean(match.group(1).replace("\\'", "'").replace('\\"', '"'))
                if likely_visible(value):
                    values.add(value)
    return sorted(values, key=lambda item: (item.casefold(), item))


def source_language(value: str) -> str:
    if re.search(r"[àâçéèêëîïôùûüÿœæ]", value, re.IGNORECASE):
        return "fr"
    words = {word.casefold().strip(".,:;!?()[]{}’'") for word in value.split()}
    if value in FR_SINGLE_WORDS or len(words & FRENCH_MARKERS) >= (1 if len(words) <= 3 else 2):
        return "fr"
    return "en"


def protect(value: str) -> tuple[str, dict[str, str]]:
    protected = value
    placeholders: dict[str, str] = {}
    for index, term in enumerate(sorted(PROTECTED_TERMS, key=len, reverse=True)):
        if term not in protected:
            continue
        token = f"ZXQ{index}QXZ"
        protected = protected.replace(term, token)
        placeholders[token] = term
    return protected, placeholders


def restore(value: str, placeholders: dict[str, str]) -> str:
    restored = value
    for token, term in placeholders.items():
        restored = re.sub(re.escape(token), term, restored, flags=re.IGNORECASE)
    return restored.strip()


def translated(value: str, translator: object) -> str:
    protected, placeholders = protect(value)
    return restore(translator.translate(protected), placeholders)


FRENCH_ACCENTS = {
    "apres": "après", "capacite": "capacité", "communautes": "communautés",
    "conformite": "conformité", "controle": "contrôle", "controles": "contrôles",
    "cree": "créé", "creee": "créée", "creer": "créer", "demarrer": "démarrer",
    "delai": "délai", "delais": "délais", "donnees": "données", "ecole": "école",
    "ecoles": "écoles", "ecouter": "écouter", "ecrire": "écrire", "education": "éducation",
    "eleve": "élève", "eleves": "élèves", "evaluation": "évaluation", "evaluations": "évaluations",
    "etre": "être", "experience": "expérience", "experiences": "expériences",
    "fonctionnalite": "fonctionnalité", "fonctionnalites": "fonctionnalités",
    "maitrise": "maîtrise", "maitrisee": "maîtrisée", "maitrisees": "maîtrisées",
    "meme": "même", "necessaire": "nécessaire", "penalite": "pénalité", "penalites": "pénalités",
    "prepare": "prépare", "preparation": "préparation", "presente": "présente",
    "prive": "privé", "privee": "privée", "proprietaire": "propriétaire",
    "qualite": "qualité", "reinitialiser": "réinitialiser", "reponse": "réponse",
    "reponses": "réponses", "reduit": "réduit", "reduite": "réduite", "reduites": "réduites",
    "regle": "règle", "regles": "règles", "securite": "sécurité", "sequence": "séquence",
    "sequences": "séquences", "verifier": "vérifier",
}


def normalize_french_accents(value: str) -> str:
    def replace(match: re.Match[str]) -> str:
        original = match.group(0)
        corrected = FRENCH_ACCENTS[original.casefold()]
        return corrected.capitalize() if original[:1].isupper() else corrected

    pattern = r"\b(" + "|".join(sorted(map(re.escape, FRENCH_ACCENTS), key=len, reverse=True)) + r")\b"
    return re.sub(pattern, replace, value, flags=re.IGNORECASE)


def translated_batch(values: list[str], translator: object, batch_size: int = 24) -> list[str]:
    results: list[str] = []
    delimiter = "ZXDELIMZX"
    for start in range(0, len(values), batch_size):
        chunk = values[start:start + batch_size]
        prepared: list[str] = []
        placeholder_sets: list[dict[str, str]] = []
        for value in chunk:
            protected, placeholders = protect(value)
            prepared.append(protected)
            placeholder_sets.append(placeholders)
        rendered = translator.translate(f"\n{delimiter}\n".join(prepared))
        parts = re.split(rf"\s*{delimiter}\s*", rendered, flags=re.IGNORECASE)
        if len(parts) != len(chunk):
            parts = [translator.translate(value) for value in prepared]
        results.extend(restore(part, placeholders) for part, placeholders in zip(parts, placeholder_sets, strict=True))
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate deterministic Scholarium UI catalogs.")
    parser.add_argument("--report", default=str(ROOT / "output" / "localization" / "scholarium-ui-registry.json"))
    args = parser.parse_args()
    strings = extract_strings()
    fr_en = argostranslate.translate.get_translation_from_codes("fr", "en")
    en_fr = argostranslate.translate.get_translation_from_codes("en", "fr")
    en_es = argostranslate.translate.get_translation_from_codes("en", "es")
    if not fr_en or not en_fr or not en_es:
        raise SystemExit("Required Argos models fr->en, en->fr, and en->es are not installed.")

    previous: dict[str, dict[str, str]] = {}
    for locale in ("en-CA", "fr-CA", "es"):
        path = OUTPUT_ROOT / f"{locale}.json"
        if path.exists():
            previous[locale] = json.loads(path.read_text(encoding="utf-8")).get("strings", {})

    source_languages = {source: source_language(source) for source in strings}
    english_by_source: dict[str, str] = {}
    missing_french_to_english: list[str] = []
    for source in strings:
        if source in EN_OVERRIDES:
            english_by_source[source] = EN_OVERRIDES[source]
        elif source in previous.get("en-CA", {}):
            english_by_source[source] = previous["en-CA"][source]
        elif source_languages[source] == "en":
            english_by_source[source] = source
        else:
            missing_french_to_english.append(source)
    translated_english = translated_batch(missing_french_to_english, fr_en) if missing_french_to_english else []
    english_by_source.update(dict(zip(missing_french_to_english, translated_english, strict=True)))

    missing_french = [
        source for source in strings
        if source not in FR_OVERRIDES and english_by_source[source] not in FR_OVERRIDES
        and source not in previous.get("fr-CA", {})
    ]
    missing_spanish = [
        source for source in strings
        if source not in ES_OVERRIDES and english_by_source[source] not in ES_OVERRIDES
        and source not in previous.get("es", {})
    ]
    french_by_source = dict(zip(
        missing_french,
        translated_batch([english_by_source[source] for source in missing_french], en_fr) if missing_french else [],
        strict=True,
    ))
    spanish_by_source = dict(zip(
        missing_spanish,
        translated_batch([english_by_source[source] for source in missing_spanish], en_es) if missing_spanish else [],
        strict=True,
    ))

    catalogs: dict[str, dict[str, str]] = {"en-CA": {}, "fr-CA": {}, "es": {}}
    registry: list[dict[str, str]] = []
    for source in strings:
        language = source_languages[source]
        english = english_by_source[source]
        french = FR_OVERRIDES.get(source) or FR_OVERRIDES.get(english) or previous.get("fr-CA", {}).get(source)
        spanish = ES_OVERRIDES.get(source) or ES_OVERRIDES.get(english) or previous.get("es", {}).get(source)
        if not french:
            french = french_by_source[source]
        if not spanish:
            spanish = spanish_by_source[source]
        catalogs["en-CA"][source] = previous.get("en-CA", {}).get(source, english)
        catalogs["fr-CA"][source] = normalize_french_accents(french)
        catalogs["es"][source] = spanish
        registry.append({"canonical": source, "sourceLanguage": language, "english": english})

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for locale, mapping in catalogs.items():
        payload = {
            "$locale": locale,
            "$sourceRevision": SOURCE_REVISION,
            "$translationStatus": "canonical" if locale == "en-CA" else "machine-draft-with-reviewed-core-glossary",
            "strings": mapping,
        }
        (OUTPUT_ROOT / f"{locale}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = Path(args.report)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps({"schema": "scholarium.ui-i18n.v1", "sourceRevision": SOURCE_REVISION, "count": len(registry), "entries": registry}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(strings)} Scholarium UI strings for FR/EN/ES.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
