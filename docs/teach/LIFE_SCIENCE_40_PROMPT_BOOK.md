# Scholarium Teach - 40 prompts de collaboration

## Recherche en sciences de la vie, sourcée, rejouable et révisable

**Édition:** 1.0
**Public:** élèves avancés, enseignants et accompagnateurs de recherche
**Cadre:** apprentissage et recherche documentaire seulement; aucune décision clinique autonome

## Mode d'emploi

Chaque atelier est maintenant un contrat de collaboration compact: la personne fixe l'intention et les limites; l'agent propose, exécute dans ce périmètre, expose ses preuves et s'arrête aux portes HITL. Chaque prompt peut être copié tel quel après avoir remplacé les champs `[A COMPLETER]`. Chaque atelier commence par une question bornée et un objectif pédagogique. L'agent doit utiliser uniquement les skills nommés, conserver les paramètres de requête, identifiants primaires, URL, horodatage et limites, puis remettre le résultat à une personne. Le routeur choisit le plus petit ensemble spécialisé. Synthia peut classifier les traces; le gateway central gère le graphe, MemoryLake et HippoRAG; aucun plugin ne crée de mémoire locale.

Le statut final est `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`. `COMPLETED` exige des preuves lisibles et une revue humaine indiquée. Les données d'élèves demeurent synthétiques avant la porte EFVP.

# Partie I - Lire la littérature

## LS-01 - Router une question

**Objectif.** Transformer une question générale en une recherche primaire minimale.

**Prompt de collaboration.**

```text
TACHE: LS-01 - Router une question

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:research-router-skill`. Reformule ma question en une intention bornée, sélectionne au plus trois sources spécialisées installées, puis retourne outils, paramètres, preuves attendues et limites. N'exécute rien avant mon accord.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Intention, outils exacts, motif de routage, champs attendus.

ARRET HITL
L'enseignant confirme que le périmètre répond à la question sans l'élargir.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-02 - Retrouver un article PMC

**Objectif.** Apprendre la différence entre recherche bibliographique et lecture de texte intégral.

**Prompt de collaboration.**

```text
TACHE: LS-02 - Retrouver un article PMC

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:ncbi-pmc-skill` pour trouver jusqu'à cinq articles en texte intégral sur [SUJET]. Retourne PMCID, titre, année, URL primaire, type d'étude et une limite par article. Ne résume pas au-delà du texte retrouvé.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
PMCID, requête, URL, date d'accès.

ARRET HITL
Vérifier qu'un article cité existe et correspond au sujet.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-03 - Examiner un préprint

**Objectif.** Distinguer résultat préliminaire et connaissance révisée.

**Prompt de collaboration.**

```text
TACHE: LS-03 - Examiner un préprint

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:biorxiv-skill` pour retrouver un préprint sur [SUJET]. Donne DOI, version, date, auteurs, statut de préprint et trois affirmations explicitement attribuées. Cherche un article publié lié seulement si la source l'indique.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
DOI, version, statut, liens.

ARRET HITL
Le mot préprint doit rester visible dans toute réutilisation.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-04 - Construire une requête Entrez

**Objectif.** Comprendre opérateurs, champs et identifiants NCBI.

**Prompt de collaboration.**

```text
TACHE: LS-04 - Construire une requête Entrez

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:ncbi-entrez-skill`. Construis deux requêtes Entrez pour [QUESTION], explique les champs et opérateurs, exécute la plus précise et retourne les identifiants sans inventer de résultat.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Requêtes exactes, base ciblée, identifiants, compteur.

ARRET HITL
Comparer précision et rappel des deux formulations.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-05 - Trouver un jeu NCBI

**Objectif.** Relier une publication à un jeu de données récupérable.

**Prompt de collaboration.**

```text
TACHE: LS-05 - Trouver un jeu NCBI

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:ncbi-datasets-skill` pour trouver un jeu lié à [ORGANISME/GÈNE]. Retourne accession, espèce, assemblage ou produit, taille, licence ou conditions visibles et commande de récupération proposée, sans télécharger.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Accession, taxon, métadonnées, URL.

ARRET HITL
Confirmer espèce et version avant toute analyse.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie II - Gènes, protéines et fonctions

## LS-06 - Situer un gène avec Ensembl

**Objectif.** Lire un identifiant stable, une région et des transcrits.

**Prompt de collaboration.**

```text
TACHE: LS-06 - Situer un gène avec Ensembl

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:ensembl-skill` pour [GÈNE, ESPÈCE]. Retourne identifiant Ensembl, assemblage, coordonnées, brin, transcrits principaux et liens primaires. Sépare faits de base et interprétations.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Identifiants, version d'assemblage, coordonnées, requête.

ARRET HITL
Refuser toute comparaison entre assemblages non alignés.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-07 - Lire une fiche UniProt

**Objectif.** Distinguer annotation révisée et annotation automatique.

**Prompt de collaboration.**

```text
TACHE: LS-07 - Lire une fiche UniProt

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:uniprot-skill` pour [PROTÉINE/ACCESSION]. Donne accession, organisme, statut reviewed/unreviewed, fonction annotée, domaines et références, avec provenance de chaque champ.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Accession, statut, références croisées, URL.

ARRET HITL
Toute fonction proposée doit porter son niveau de preuve.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-08 - Interroger Gene Ontology

**Objectif.** Lire une annotation GO avec son code de preuve.

**Prompt de collaboration.**

```text
TACHE: LS-08 - Interroger Gene Ontology

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:quickgo-skill` pour [GÈNE/PROTÉINE]. Retourne au plus dix termes GO, aspect, code de preuve, référence et taxon. N'assimile pas une annotation prédite à une validation expérimentale.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
GO IDs, evidence codes, références, taxon.

ARRET HITL
Classer les codes de preuve avant la synthèse.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-09 - Explorer une voie Reactome

**Objectif.** Relier entités et réactions dans une voie versionnée.

**Prompt de collaboration.**

```text
TACHE: LS-09 - Explorer une voie Reactome

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:reactome-skill` pour [GÈNE/VOIE]. Retourne l'identifiant Reactome, espèce, événements parents/enfants, entités participantes et version. Distingue présence dans la voie et causalité.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Stable IDs, hiérarchie, version, URL.

ARRET HITL
Vérifier l'espèce et l'événement exact.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-10 - Construire un réseau STRING

**Objectif.** Comprendre scores, canaux de preuve et seuils.

**Prompt de collaboration.**

```text
TACHE: LS-10 - Construire un réseau STRING

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:string-skill` pour [LISTE DE PROTÉINES, ESPÈCE]. Produis un réseau borné, retourne score combiné et canaux de preuve par arête, plus les paramètres de seuil. N'appelle pas une association une interaction physique sans preuve.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs STRING, taxon, scores, paramètres.

ARRET HITL
Inspecter au moins une arête de chaque type de preuve.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie III - Variants et génétique

## LS-11 - Lire ClinVar

**Objectif.** Examiner une classification de variant et ses conflits.

**Prompt de collaboration.**

```text
TACHE: LS-11 - Lire ClinVar

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:clinvar-variation-skill` pour [VARIANT]. Retourne Variation ID, HGVS, assembly, significations cliniques soumises, statut de revue, dates et conflits. Ne donne aucun conseil médical.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs, soumissions, étoiles/revue, URL.

ARRET HITL
Une personne qualifiée interprète toute portée clinique.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-12 - Vérifier une fréquence gnomAD

**Objectif.** Relier fréquence allélique, population et couverture.

**Prompt de collaboration.**

```text
TACHE: LS-12 - Vérifier une fréquence gnomAD

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:gnomad-graphql-skill` pour [VARIANT, BUILD]. Retourne fréquences globales et par population disponibles, comptes alléliques, homozygotes et avertissements de qualité.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Requête GraphQL, build, identifiant, champs retournés.

ARRET HITL
Ne pas interpréter absence ou rareté comme diagnostic.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-13 - Étudier une association GWAS

**Objectif.** Lire trait, locus, effet et population.

**Prompt de collaboration.**

```text
TACHE: LS-13 - Étudier une association GWAS

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:gwas-catalog-skill` pour [TRAIT]. Retourne études, PMID, variant, p-value, taille d'effet si disponible, ascendance et taille d'échantillon. Sépare association et causalité.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Study/association IDs, PMID, paramètres.

ARRET HITL
Signaler les populations sous-représentées.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-14 - Relier cible et maladie

**Objectif.** Comprendre l'agrégation de preuves d'Open Targets.

**Prompt de collaboration.**

```text
TACHE: LS-14 - Relier cible et maladie

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:opentargets-skill` pour [CIBLE, MALADIE]. Retourne identifiants EFO/Ensembl, types et scores de preuves, sources contributrices et limites. Ne transforme pas un score en recommandation thérapeutique.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs, evidence types, scores, URL.

ARRET HITL
Ouvrir au moins une preuve primaire sous-jacente.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-15 - Cartographier un trait EFO

**Objectif.** Apprendre synonymes, parents et identifiants d'ontologie.

**Prompt de collaboration.**

```text
TACHE: LS-15 - Cartographier un trait EFO

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:efo-ontology-skill` pour [TERME]. Retourne EFO ID, libellé, définition, synonymes, parents et correspondances. Garde les ambiguïtés lexicales visibles.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
ID, version, relations, URL.

ARRET HITL
L'enseignant valide le concept choisi avant jointure de données.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie IV - Expression et cellules

## LS-16 - Comparer l'expression GTEx

**Objectif.** Comparer des tissus sans confondre expression et effet causal.

**Prompt de collaboration.**

```text
TACHE: LS-16 - Comparer l'expression GTEx

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:gtex-eqtl-skill` pour [GÈNE]. Retourne tissus, mesure d'expression ou eQTL demandé, version du dataset, taille d'échantillon visible et limites.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Gene ID, tissu, version, valeurs et paramètres.

ARRET HITL
Vérifier que les unités sont comparables.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-17 - Examiner Bgee

**Objectif.** Lire présence/absence d'expression entre espèces et stades.

**Prompt de collaboration.**

```text
TACHE: LS-17 - Examiner Bgee

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:bgee-skill` pour [GÈNE, ESPÈCE]. Retourne anatomie, stade, type de donnée, appel d'expression et qualité. N'extrapole pas entre espèces.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs Bgee, taxon, stades, sources.

ARRET HITL
Relever explicitement toute comparaison inter-espèces.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-18 - Consulter Human Protein Atlas

**Objectif.** Comparer ARN, protéine et localisation.

**Prompt de collaboration.**

```text
TACHE: LS-18 - Consulter Human Protein Atlas

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:human-protein-atlas-skill` pour [GÈNE]. Retourne catégories de tissu, cellule et localisation subcellulaire avec méthodes et niveaux de preuve visibles.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Gene page, catégories, méthodes, URL.

ARRET HITL
Ne pas fusionner ARN et protéine en une seule mesure.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-19 - Explorer une collection cellxgene

**Objectif.** Formuler une requête unicellulaire reproductible.

**Prompt de collaboration.**

```text
TACHE: LS-19 - Explorer une collection cellxgene

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:cellxgene-skill` pour [TISSU/CELLULE/GÈNE]. Retourne collection, dataset, organisme, ontologies, effectifs et filtres proposés. Ne télécharge pas les matrices avant validation.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Collection/dataset IDs, filtres, effectifs, URL.

ARRET HITL
Valider annotations cellulaires et critères d'inclusion.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-20 - Examiner une expérience ENCODE

**Objectif.** Lire assay, biosample, fichiers et audits.

**Prompt de collaboration.**

```text
TACHE: LS-20 - Examiner une expérience ENCODE

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:encode-skill` pour [ASSAY, BIOSAMPLE]. Retourne accession d'expérience, biosample, fichiers recommandés, assembly, audits et contrôles.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Accessions, formats, assembly, audit flags.

ARRET HITL
Aucun fichier audité en erreur n'entre silencieusement dans l'analyse.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie V - Structures et molécules

## LS-21 - Inspecter AlphaFold

**Objectif.** Interpréter confiance locale et erreur d'alignement prédite.

**Prompt de collaboration.**

```text
TACHE: LS-21 - Inspecter AlphaFold

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:alphafold-skill` pour [UNIPROT ID]. Retourne modèle, version, pLDDT par région, PAE disponible et limites. N'appelle jamais la prédiction une structure expérimentale.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Model ID, version, scores, URL.

ARRET HITL
Identifier les régions de faible confiance.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-22 - Trouver une structure PDB

**Objectif.** Lire méthode expérimentale, résolution et ligands.

**Prompt de collaboration.**

```text
TACHE: LS-22 - Trouver une structure PDB

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:rcsb-pdb-skill` pour [PROTÉINE/LIGAND]. Retourne PDB ID, méthode, résolution si applicable, organismes, chaînes, ligands et date.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
PDB ID, méthode, métriques, références.

ARRET HITL
Comparer construction expérimentale et protéine canonique.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-23 - Rechercher BindingDB

**Objectif.** Examiner une mesure d'affinité avec unités et protocole.

**Prompt de collaboration.**

```text
TACHE: LS-23 - Rechercher BindingDB

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:bindingdb-skill` pour [CIBLE/LIGAND]. Retourne paires, Ki/Kd/IC50 avec unités, DOI/PMID et conditions disponibles. Ne compare pas des mesures incompatibles.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs, valeurs, unités, référence primaire.

ARRET HITL
Grouper uniquement les mêmes types de mesure.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-24 - Interroger ChEMBL

**Objectif.** Relier composé, cible, assay et activité.

**Prompt de collaboration.**

```text
TACHE: LS-24 - Interroger ChEMBL

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:chembl-skill` pour [CIBLE/COMPOSÉ]. Retourne ChEMBL IDs, assay type, standard value/unit, relation et document source; limite à vingt activités pertinentes.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs, assay, activité standardisée, document.

ARRET HITL
Inspecter les relations `=`, `<`, `>` avant agrégation.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-25 - Vérifier PubChem

**Objectif.** Distinguer substance, composé et bioassay.

**Prompt de collaboration.**

```text
TACHE: LS-25 - Vérifier PubChem

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:pubchem-pug-skill` pour [NOM/CID]. Retourne CID, synonymes bornés, formule, propriétés demandées et liens vers bioassays pertinents.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
CID/SID/AID, requête PUG, URL.

ARRET HITL
Confirmer structure et stéréochimie avant comparaison.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-26 - Normaliser avec ChEBI

**Objectif.** Utiliser une ontologie chimique pour éviter les noms ambigus.

**Prompt de collaboration.**

```text
TACHE: LS-26 - Normaliser avec ChEBI

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:chebi-skill` pour [TERME]. Retourne ChEBI ID, nom, définition, formule, parents/enfants et synonymes; marque les candidats ambigus.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
ChEBI ID, relations, version, URL.

ARRET HITL
Choisir explicitement un identifiant avant le graphe.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-27 - Lire une réaction Rhea

**Objectif.** Relier réaction équilibrée, participants et enzymes.

**Prompt de collaboration.**

```text
TACHE: LS-27 - Lire une réaction Rhea

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:rhea-skill` pour [RÉACTION/EC]. Retourne Rhea ID, équation, direction, ChEBI IDs et liens UniProt.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Rhea/ChEBI IDs, équation, direction, URL.

ARRET HITL
Vérifier équilibre et compartiment avant interprétation.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-28 - Explorer HMDB

**Objectif.** Lire une fiche métabolite sans transformer une association en diagnostic.

**Prompt de collaboration.**

```text
TACHE: LS-28 - Explorer HMDB

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:hmdb-skill` pour [MÉTABOLITE]. Retourne HMDB ID, synonymes, formule, biospecimens, voies et références. N'émets aucune conclusion clinique individuelle.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
HMDB ID, champs, références, URL.

ARRET HITL
Distinguer présence documentée et valeur diagnostique.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie VI - Études et interprétation

## LS-29 - Lire ClinicalTrials.gov

**Objectif.** Comprendre statut, critères et résultats déclarés.

**Prompt de collaboration.**

```text
TACHE: LS-29 - Lire ClinicalTrials.gov

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:clinicaltrials-skill` pour [CONDITION/INTERVENTION]. Retourne NCT ID, statut, phases, critères, promoteur, dates, résultats disponibles et URL.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
NCT IDs, requête, statut daté, champs sources.

ARRET HITL
Ne jamais présenter inscription ou résultat comme conseil de soin.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-30 - Explorer cBioPortal

**Objectif.** Lire une cohorte cancéreuse et ses altérations.

**Prompt de collaboration.**

```text
TACHE: LS-30 - Explorer cBioPortal

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:cbioportal-skill` pour [GÈNE/ÉTUDE]. Retourne study/case set IDs, profil moléculaire, effectifs et fréquences avec dénominateurs.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs d'étude, paramètres, effectifs, URL.

ARRET HITL
Toute fréquence doit conserver son dénominateur.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-31 - Examiner CIViC

**Objectif.** Comprendre assertions, evidence items et niveaux.

**Prompt de collaboration.**

```text
TACHE: LS-31 - Examiner CIViC

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:civic-skill` pour [VARIANT/CANCER]. Retourne IDs CIViC, type et niveau de preuve, statut, citations et conflits.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
CIViC IDs, niveaux, PMID, dates.

ARRET HITL
Une personne qualifiée interprète la signification clinique.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-32 - Lire PharmGKB

**Objectif.** Distinguer annotation, guideline et étiquette.

**Prompt de collaboration.**

```text
TACHE: LS-32 - Lire PharmGKB

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:pharmgkb-skill` pour [GÈNE/MÉDICAMENT]. Retourne PharmGKB IDs, type d'annotation, niveau, sources et population. Aucun conseil de prescription.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
IDs, niveau, guideline/source, URL.

ARRET HITL
Vérifier juridiction et version de la guideline.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie VII - Dépôts de données

## LS-33 - Retrouver BioStudies/ArrayExpress

**Objectif.** Examiner conception d'étude et fichiers avant téléchargement.

**Prompt de collaboration.**

```text
TACHE: LS-33 - Retrouver BioStudies/ArrayExpress

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:biostudies-arrayexpress-skill` pour [SUJET]. Retourne accession, design, organisme, facteurs, fichiers et licence visible.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Accession, métadonnées, liste de fichiers, URL.

ARRET HITL
Valider design et groupes avant calcul.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-34 - Examiner PRIDE

**Objectif.** Lire une étude protéomique et ses fichiers.

**Prompt de collaboration.**

```text
TACHE: LS-34 - Examiner PRIDE

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:pride-skill` pour [SUJET/ACCESSION]. Retourne PXD, organisme, instruments, modifications, fichiers et publication associée.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
PXD, fichiers, DOI/PMID, URL.

ARRET HITL
Confirmer fichiers bruts et résultats dérivés.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-35 - Naviguer ProteomeXchange

**Objectif.** Relier dépôt membre, statut et identifiant PXD.

**Prompt de collaboration.**

```text
TACHE: LS-35 - Naviguer ProteomeXchange

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:proteomexchange-skill` pour [PXD/SUJET]. Retourne dépôt membre, statut, date, espèce, publication et liens de données.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
PXD, dépôt, statut, URL.

ARRET HITL
Signaler les jeux partiels ou non publics.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-36 - Trouver MetaboLights

**Objectif.** Examiner facteurs, protocoles et métabolites.

**Prompt de collaboration.**

```text
TACHE: LS-36 - Trouver MetaboLights

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:metabolights-skill` pour [SUJET]. Retourne MTBLS ID, organisme, design, technologie, protocoles, fichiers et licence.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
MTBLS ID, métadonnées ISA, URL.

ARRET HITL
Vérifier unités, normalisation et contrôles.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-37 - Explorer MGnify

**Objectif.** Lire une analyse microbiome avec pipeline et biome.

**Prompt de collaboration.**

```text
TACHE: LS-37 - Explorer MGnify

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:mgnify-skill` pour [BIOME/ÉTUDE]. Retourne accessions, biome, pipeline/version, échantillons et produits d'analyse.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Study/analysis IDs, pipeline, URL.

ARRET HITL
Ne pas comparer des pipelines incompatibles sans correction.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-38 - Préparer un BLAST

**Objectif.** Formuler une recherche de similarité reproductible.

**Prompt de collaboration.**

```text
TACHE: LS-38 - Préparer un BLAST

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise `life-science-research:ncbi-blast-skill` avec [SÉQUENCE SYNTHÉTIQUE/PUBLIQUE]. Propose programme, base, taxon et seuils; masque toute donnée sensible et demande confirmation avant exécution.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Digest de séquence, paramètres, RID si exécuté, date.

ARRET HITL
Confirmer provenance et droit d'utiliser la séquence.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Partie VIII - Synthèse contrôlée

## LS-39 - Construire une carte de sources

**Objectif.** Transformer des résultats hétérogènes en traces centrales contestables.

**Prompt de collaboration.**

```text
TACHE: LS-39 - Construire une carte de sources

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
À partir des sorties validées, crée des cartes `synthia.education.source-card.v1`. Sépare observations, inférences et contradictions; soumets uniquement un `graph_delta` au `scholarium.central-knowledge-gateway.v1`. Demande matrices Euler/Hilbert seulement si l'ordre et les sources sont replayables.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Source cards, provenance, partition demandée, reçu gateway.

ARRET HITL
Aucune source rejetée ou sans licence ne passe dans `approved`.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


## LS-40 - Projet intégrateur

**Objectif.** Réaliser une mini-revue multi-source sans surpromesse.

**Prompt de collaboration.**

```text
TACHE: LS-40 - Projet intégrateur

CONTEXTE FOURNI PAR LA PERSONNE
- Question ou objet: [A COMPLETER]
- Public et niveau: [A COMPLETER]
- Limite de temps ou de volume: [A COMPLETER]

MISSION BORNEE
Utilise d'abord `life-science-research:research-router-skill` sur [QUESTION]. Après accord, exécute au plus quatre skills primaires complémentaires. Produis une table affirmation-preuve-contradiction-limite, les requêtes replayables et un reçu du gateway central. Termine par ce qu'on ne sait pas.

CONTRAT DE COLLABORATION
1. Signale `NEEDS_INPUT` si un champ requis reste ambigu; ne le devine pas.
2. N'utilise que l'outil ou la source nommee dans la mission. Toute substitution doit etre proposee avant execution.
3. Conserve la requete exacte, les identifiants primaires, l'URL, la date d'acces et les parametres utiles au replay.
4. Separe clairement `OBSERVATION`, `INFERENCE`, `CONTRADICTION` et `LIMITE`.
5. Retourne un statut final parmi `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`, avec sa justification.

PREUVES OBLIGATOIRES
Plan approuvé, identifiants primaires, matrice de provenance, reçu, limites.

ARRET HITL
L'élève explique oralement ou par modalité accessible une preuve, une contradiction et une incertitude.
Arrete-toi avant tout telechargement important, ecriture externe, interpretation clinique, ou elargissement du perimetre non approuve.
```

**Critere d'acceptation.** La sortie est courte, rejouable, corrigeable par une personne et ne transforme ni score, ni association, ni prediction en autorite.


# Grille de validation

Un atelier est réussi quand la question reste bornée, les outils utilisés sont ceux annoncés, les identifiants et URL sont primaires, la date de récupération est visible, les limites ne sont pas masquées, et la personne peut corriger ou rejeter la synthèse. Le score ne mesure jamais la valeur ou l'intelligence d'un élève.
