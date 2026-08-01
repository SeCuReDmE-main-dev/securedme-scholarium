from __future__ import annotations

import re
from pathlib import Path


BOOK = Path(__file__).resolve().parents[1] / "docs" / "teach" / "LIFE_SCIENCE_40_PROMPT_BOOK.md"
SECTION = re.compile(
    r"(?ms)^## (LS-\d{2}) - (.+?)\n"
    r"\*\*Objectif\.\*\* (.+?)\n"
    r"\*\*Starter prompt\.\*\* «(.+?)»\n"
    r"\*\*Preuves\.\*\* (.+?)\n"
    r"\*\*Revue\.\*\* (.+?)(?=\n\n(?:## LS-|# Partie|# Grille))"
)


def clean(value: str) -> str:
    return " ".join(value.split())


def replace(match: re.Match[str]) -> str:
    prompt_id, title, objective, mission, evidence, review = map(clean, match.groups())
    return f"""## {prompt_id} - {title}

**Objectif.** {objective}

**Prompt de collaboration.**

```text
TACHE: {prompt_id} - {title}

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
{mission}

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
{evidence}

ARRET HITL
{review}
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.
"""


def main() -> None:
    source = BOOK.read_text(encoding="utf-8")
    if "**Prompt de collaboration.**" in source:
        print("Prompt book is already upgraded")
        return
    updated, count = SECTION.subn(replace, source)
    if count != 40:
        raise SystemExit(f"Expected 40 prompts, upgraded {count}")
    updated = updated.replace(
        "# Scholarium Teach Life Science Research\n\n## Livre de 40 prompts formatifs, sourcés et révisables",
        "# Scholarium Teach - 40 prompts de collaboration\n\n## Recherche en sciences de la vie, sourcée, rejouable et révisable",
    )
    updated = updated.replace(
        "Chaque atelier commence par une question bornée et un objectif pédagogique.",
        "Chaque atelier est maintenant un contrat de collaboration compact: la personne fixe l'intention et les limites; l'agent propose, exécute dans ce périmètre, expose ses preuves et s'arrête aux portes HITL. Chaque prompt peut être copié tel quel après avoir remplacé les champs `[A COMPLETER]`. Chaque atelier commence par une question bornée et un objectif pédagogique.",
    )
    BOOK.write_text(updated, encoding="utf-8", newline="\n")
    print("Upgraded 40 collaboration prompts")


if __name__ == "__main__":
    main()
