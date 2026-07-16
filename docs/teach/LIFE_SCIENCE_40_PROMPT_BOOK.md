# Scholarium Teach Life Science Research

## Livre de 40 prompts formatifs, sourcés et révisables

**Édition:** 1.0
**Public:** élèves avancés, enseignants et accompagnateurs de recherche
**Cadre:** apprentissage et recherche documentaire seulement; aucune décision clinique autonome

## Mode d'emploi

Chaque atelier commence par une question bornée et un objectif pédagogique. L'agent doit utiliser uniquement les skills nommés, conserver les paramètres de requête, identifiants primaires, URL, horodatage et limites, puis remettre le résultat à une personne. Le routeur choisit le plus petit ensemble spécialisé. Synthia peut classifier les traces; le gateway central gère le graphe, MemoryLake et HippoRAG; aucun plugin ne crée de mémoire locale.

Le statut final est `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`. `COMPLETED` exige des preuves lisibles et une revue humaine indiquée. Les données d'élèves demeurent synthétiques avant la porte EFVP.

# Partie I - Lire la littérature

## LS-01 - Router une question
**Objectif.** Transformer une question générale en une recherche primaire minimale.
**Starter prompt.** « Utilise `life-science-research:research-router-skill`. Reformule ma question en une intention bornée, sélectionne au plus trois sources spécialisées installées, puis retourne outils, paramètres, preuves attendues et limites. N'exécute rien avant mon accord. »
**Preuves.** Intention, outils exacts, motif de routage, champs attendus.
**Revue.** L'enseignant confirme que le périmètre répond à la question sans l'élargir.

## LS-02 - Retrouver un article PMC
**Objectif.** Apprendre la différence entre recherche bibliographique et lecture de texte intégral.
**Starter prompt.** « Utilise `life-science-research:ncbi-pmc-skill` pour trouver jusqu'à cinq articles en texte intégral sur [SUJET]. Retourne PMCID, titre, année, URL primaire, type d'étude et une limite par article. Ne résume pas au-delà du texte retrouvé. »
**Preuves.** PMCID, requête, URL, date d'accès.
**Revue.** Vérifier qu'un article cité existe et correspond au sujet.

## LS-03 - Examiner un préprint
**Objectif.** Distinguer résultat préliminaire et connaissance révisée.
**Starter prompt.** « Utilise `life-science-research:biorxiv-skill` pour retrouver un préprint sur [SUJET]. Donne DOI, version, date, auteurs, statut de préprint et trois affirmations explicitement attribuées. Cherche un article publié lié seulement si la source l'indique. »
**Preuves.** DOI, version, statut, liens.
**Revue.** Le mot préprint doit rester visible dans toute réutilisation.

## LS-04 - Construire une requête Entrez
**Objectif.** Comprendre opérateurs, champs et identifiants NCBI.
**Starter prompt.** « Utilise `life-science-research:ncbi-entrez-skill`. Construis deux requêtes Entrez pour [QUESTION], explique les champs et opérateurs, exécute la plus précise et retourne les identifiants sans inventer de résultat. »
**Preuves.** Requêtes exactes, base ciblée, identifiants, compteur.
**Revue.** Comparer précision et rappel des deux formulations.

## LS-05 - Trouver un jeu NCBI
**Objectif.** Relier une publication à un jeu de données récupérable.
**Starter prompt.** « Utilise `life-science-research:ncbi-datasets-skill` pour trouver un jeu lié à [ORGANISME/GÈNE]. Retourne accession, espèce, assemblage ou produit, taille, licence ou conditions visibles et commande de récupération proposée, sans télécharger. »
**Preuves.** Accession, taxon, métadonnées, URL.
**Revue.** Confirmer espèce et version avant toute analyse.

# Partie II - Gènes, protéines et fonctions

## LS-06 - Situer un gène avec Ensembl
**Objectif.** Lire un identifiant stable, une région et des transcrits.
**Starter prompt.** « Utilise `life-science-research:ensembl-skill` pour [GÈNE, ESPÈCE]. Retourne identifiant Ensembl, assemblage, coordonnées, brin, transcrits principaux et liens primaires. Sépare faits de base et interprétations. »
**Preuves.** Identifiants, version d'assemblage, coordonnées, requête.
**Revue.** Refuser toute comparaison entre assemblages non alignés.

## LS-07 - Lire une fiche UniProt
**Objectif.** Distinguer annotation révisée et annotation automatique.
**Starter prompt.** « Utilise `life-science-research:uniprot-skill` pour [PROTÉINE/ACCESSION]. Donne accession, organisme, statut reviewed/unreviewed, fonction annotée, domaines et références, avec provenance de chaque champ. »
**Preuves.** Accession, statut, références croisées, URL.
**Revue.** Toute fonction proposée doit porter son niveau de preuve.

## LS-08 - Interroger Gene Ontology
**Objectif.** Lire une annotation GO avec son code de preuve.
**Starter prompt.** « Utilise `life-science-research:quickgo-skill` pour [GÈNE/PROTÉINE]. Retourne au plus dix termes GO, aspect, code de preuve, référence et taxon. N'assimile pas une annotation prédite à une validation expérimentale. »
**Preuves.** GO IDs, evidence codes, références, taxon.
**Revue.** Classer les codes de preuve avant la synthèse.

## LS-09 - Explorer une voie Reactome
**Objectif.** Relier entités et réactions dans une voie versionnée.
**Starter prompt.** « Utilise `life-science-research:reactome-skill` pour [GÈNE/VOIE]. Retourne l'identifiant Reactome, espèce, événements parents/enfants, entités participantes et version. Distingue présence dans la voie et causalité. »
**Preuves.** Stable IDs, hiérarchie, version, URL.
**Revue.** Vérifier l'espèce et l'événement exact.

## LS-10 - Construire un réseau STRING
**Objectif.** Comprendre scores, canaux de preuve et seuils.
**Starter prompt.** « Utilise `life-science-research:string-skill` pour [LISTE DE PROTÉINES, ESPÈCE]. Produis un réseau borné, retourne score combiné et canaux de preuve par arête, plus les paramètres de seuil. N'appelle pas une association une interaction physique sans preuve. »
**Preuves.** IDs STRING, taxon, scores, paramètres.
**Revue.** Inspecter au moins une arête de chaque type de preuve.

# Partie III - Variants et génétique

## LS-11 - Lire ClinVar
**Objectif.** Examiner une classification de variant et ses conflits.
**Starter prompt.** « Utilise `life-science-research:clinvar-variation-skill` pour [VARIANT]. Retourne Variation ID, HGVS, assembly, significations cliniques soumises, statut de revue, dates et conflits. Ne donne aucun conseil médical. »
**Preuves.** IDs, soumissions, étoiles/revue, URL.
**Revue.** Une personne qualifiée interprète toute portée clinique.

## LS-12 - Vérifier une fréquence gnomAD
**Objectif.** Relier fréquence allélique, population et couverture.
**Starter prompt.** « Utilise `life-science-research:gnomad-graphql-skill` pour [VARIANT, BUILD]. Retourne fréquences globales et par population disponibles, comptes alléliques, homozygotes et avertissements de qualité. »
**Preuves.** Requête GraphQL, build, identifiant, champs retournés.
**Revue.** Ne pas interpréter absence ou rareté comme diagnostic.

## LS-13 - Étudier une association GWAS
**Objectif.** Lire trait, locus, effet et population.
**Starter prompt.** « Utilise `life-science-research:gwas-catalog-skill` pour [TRAIT]. Retourne études, PMID, variant, p-value, taille d'effet si disponible, ascendance et taille d'échantillon. Sépare association et causalité. »
**Preuves.** Study/association IDs, PMID, paramètres.
**Revue.** Signaler les populations sous-représentées.

## LS-14 - Relier cible et maladie
**Objectif.** Comprendre l'agrégation de preuves d'Open Targets.
**Starter prompt.** « Utilise `life-science-research:opentargets-skill` pour [CIBLE, MALADIE]. Retourne identifiants EFO/Ensembl, types et scores de preuves, sources contributrices et limites. Ne transforme pas un score en recommandation thérapeutique. »
**Preuves.** IDs, evidence types, scores, URL.
**Revue.** Ouvrir au moins une preuve primaire sous-jacente.

## LS-15 - Cartographier un trait EFO
**Objectif.** Apprendre synonymes, parents et identifiants d'ontologie.
**Starter prompt.** « Utilise `life-science-research:efo-ontology-skill` pour [TERME]. Retourne EFO ID, libellé, définition, synonymes, parents et correspondances. Garde les ambiguïtés lexicales visibles. »
**Preuves.** ID, version, relations, URL.
**Revue.** L'enseignant valide le concept choisi avant jointure de données.

# Partie IV - Expression et cellules

## LS-16 - Comparer l'expression GTEx
**Objectif.** Comparer des tissus sans confondre expression et effet causal.
**Starter prompt.** « Utilise `life-science-research:gtex-eqtl-skill` pour [GÈNE]. Retourne tissus, mesure d'expression ou eQTL demandé, version du dataset, taille d'échantillon visible et limites. »
**Preuves.** Gene ID, tissu, version, valeurs et paramètres.
**Revue.** Vérifier que les unités sont comparables.

## LS-17 - Examiner Bgee
**Objectif.** Lire présence/absence d'expression entre espèces et stades.
**Starter prompt.** « Utilise `life-science-research:bgee-skill` pour [GÈNE, ESPÈCE]. Retourne anatomie, stade, type de donnée, appel d'expression et qualité. N'extrapole pas entre espèces. »
**Preuves.** IDs Bgee, taxon, stades, sources.
**Revue.** Relever explicitement toute comparaison inter-espèces.

## LS-18 - Consulter Human Protein Atlas
**Objectif.** Comparer ARN, protéine et localisation.
**Starter prompt.** « Utilise `life-science-research:human-protein-atlas-skill` pour [GÈNE]. Retourne catégories de tissu, cellule et localisation subcellulaire avec méthodes et niveaux de preuve visibles. »
**Preuves.** Gene page, catégories, méthodes, URL.
**Revue.** Ne pas fusionner ARN et protéine en une seule mesure.

## LS-19 - Explorer une collection cellxgene
**Objectif.** Formuler une requête unicellulaire reproductible.
**Starter prompt.** « Utilise `life-science-research:cellxgene-skill` pour [TISSU/CELLULE/GÈNE]. Retourne collection, dataset, organisme, ontologies, effectifs et filtres proposés. Ne télécharge pas les matrices avant validation. »
**Preuves.** Collection/dataset IDs, filtres, effectifs, URL.
**Revue.** Valider annotations cellulaires et critères d'inclusion.

## LS-20 - Examiner une expérience ENCODE
**Objectif.** Lire assay, biosample, fichiers et audits.
**Starter prompt.** « Utilise `life-science-research:encode-skill` pour [ASSAY, BIOSAMPLE]. Retourne accession d'expérience, biosample, fichiers recommandés, assembly, audits et contrôles. »
**Preuves.** Accessions, formats, assembly, audit flags.
**Revue.** Aucun fichier audité en erreur n'entre silencieusement dans l'analyse.

# Partie V - Structures et molécules

## LS-21 - Inspecter AlphaFold
**Objectif.** Interpréter confiance locale et erreur d'alignement prédite.
**Starter prompt.** « Utilise `life-science-research:alphafold-skill` pour [UNIPROT ID]. Retourne modèle, version, pLDDT par région, PAE disponible et limites. N'appelle jamais la prédiction une structure expérimentale. »
**Preuves.** Model ID, version, scores, URL.
**Revue.** Identifier les régions de faible confiance.

## LS-22 - Trouver une structure PDB
**Objectif.** Lire méthode expérimentale, résolution et ligands.
**Starter prompt.** « Utilise `life-science-research:rcsb-pdb-skill` pour [PROTÉINE/LIGAND]. Retourne PDB ID, méthode, résolution si applicable, organismes, chaînes, ligands et date. »
**Preuves.** PDB ID, méthode, métriques, références.
**Revue.** Comparer construction expérimentale et protéine canonique.

## LS-23 - Rechercher BindingDB
**Objectif.** Examiner une mesure d'affinité avec unités et protocole.
**Starter prompt.** « Utilise `life-science-research:bindingdb-skill` pour [CIBLE/LIGAND]. Retourne paires, Ki/Kd/IC50 avec unités, DOI/PMID et conditions disponibles. Ne compare pas des mesures incompatibles. »
**Preuves.** IDs, valeurs, unités, référence primaire.
**Revue.** Grouper uniquement les mêmes types de mesure.

## LS-24 - Interroger ChEMBL
**Objectif.** Relier composé, cible, assay et activité.
**Starter prompt.** « Utilise `life-science-research:chembl-skill` pour [CIBLE/COMPOSÉ]. Retourne ChEMBL IDs, assay type, standard value/unit, relation et document source; limite à vingt activités pertinentes. »
**Preuves.** IDs, assay, activité standardisée, document.
**Revue.** Inspecter les relations `=`, `<`, `>` avant agrégation.

## LS-25 - Vérifier PubChem
**Objectif.** Distinguer substance, composé et bioassay.
**Starter prompt.** « Utilise `life-science-research:pubchem-pug-skill` pour [NOM/CID]. Retourne CID, synonymes bornés, formule, propriétés demandées et liens vers bioassays pertinents. »
**Preuves.** CID/SID/AID, requête PUG, URL.
**Revue.** Confirmer structure et stéréochimie avant comparaison.

## LS-26 - Normaliser avec ChEBI
**Objectif.** Utiliser une ontologie chimique pour éviter les noms ambigus.
**Starter prompt.** « Utilise `life-science-research:chebi-skill` pour [TERME]. Retourne ChEBI ID, nom, définition, formule, parents/enfants et synonymes; marque les candidats ambigus. »
**Preuves.** ChEBI ID, relations, version, URL.
**Revue.** Choisir explicitement un identifiant avant le graphe.

## LS-27 - Lire une réaction Rhea
**Objectif.** Relier réaction équilibrée, participants et enzymes.
**Starter prompt.** « Utilise `life-science-research:rhea-skill` pour [RÉACTION/EC]. Retourne Rhea ID, équation, direction, ChEBI IDs et liens UniProt. »
**Preuves.** Rhea/ChEBI IDs, équation, direction, URL.
**Revue.** Vérifier équilibre et compartiment avant interprétation.

## LS-28 - Explorer HMDB
**Objectif.** Lire une fiche métabolite sans transformer une association en diagnostic.
**Starter prompt.** « Utilise `life-science-research:hmdb-skill` pour [MÉTABOLITE]. Retourne HMDB ID, synonymes, formule, biospecimens, voies et références. N'émets aucune conclusion clinique individuelle. »
**Preuves.** HMDB ID, champs, références, URL.
**Revue.** Distinguer présence documentée et valeur diagnostique.

# Partie VI - Études et interprétation

## LS-29 - Lire ClinicalTrials.gov
**Objectif.** Comprendre statut, critères et résultats déclarés.
**Starter prompt.** « Utilise `life-science-research:clinicaltrials-skill` pour [CONDITION/INTERVENTION]. Retourne NCT ID, statut, phases, critères, promoteur, dates, résultats disponibles et URL. »
**Preuves.** NCT IDs, requête, statut daté, champs sources.
**Revue.** Ne jamais présenter inscription ou résultat comme conseil de soin.

## LS-30 - Explorer cBioPortal
**Objectif.** Lire une cohorte cancéreuse et ses altérations.
**Starter prompt.** « Utilise `life-science-research:cbioportal-skill` pour [GÈNE/ÉTUDE]. Retourne study/case set IDs, profil moléculaire, effectifs et fréquences avec dénominateurs. »
**Preuves.** IDs d'étude, paramètres, effectifs, URL.
**Revue.** Toute fréquence doit conserver son dénominateur.

## LS-31 - Examiner CIViC
**Objectif.** Comprendre assertions, evidence items et niveaux.
**Starter prompt.** « Utilise `life-science-research:civic-skill` pour [VARIANT/CANCER]. Retourne IDs CIViC, type et niveau de preuve, statut, citations et conflits. »
**Preuves.** CIViC IDs, niveaux, PMID, dates.
**Revue.** Une personne qualifiée interprète la signification clinique.

## LS-32 - Lire PharmGKB
**Objectif.** Distinguer annotation, guideline et étiquette.
**Starter prompt.** « Utilise `life-science-research:pharmgkb-skill` pour [GÈNE/MÉDICAMENT]. Retourne PharmGKB IDs, type d'annotation, niveau, sources et population. Aucun conseil de prescription. »
**Preuves.** IDs, niveau, guideline/source, URL.
**Revue.** Vérifier juridiction et version de la guideline.

# Partie VII - Dépôts de données

## LS-33 - Retrouver BioStudies/ArrayExpress
**Objectif.** Examiner conception d'étude et fichiers avant téléchargement.
**Starter prompt.** « Utilise `life-science-research:biostudies-arrayexpress-skill` pour [SUJET]. Retourne accession, design, organisme, facteurs, fichiers et licence visible. »
**Preuves.** Accession, métadonnées, liste de fichiers, URL.
**Revue.** Valider design et groupes avant calcul.

## LS-34 - Examiner PRIDE
**Objectif.** Lire une étude protéomique et ses fichiers.
**Starter prompt.** « Utilise `life-science-research:pride-skill` pour [SUJET/ACCESSION]. Retourne PXD, organisme, instruments, modifications, fichiers et publication associée. »
**Preuves.** PXD, fichiers, DOI/PMID, URL.
**Revue.** Confirmer fichiers bruts et résultats dérivés.

## LS-35 - Naviguer ProteomeXchange
**Objectif.** Relier dépôt membre, statut et identifiant PXD.
**Starter prompt.** « Utilise `life-science-research:proteomexchange-skill` pour [PXD/SUJET]. Retourne dépôt membre, statut, date, espèce, publication et liens de données. »
**Preuves.** PXD, dépôt, statut, URL.
**Revue.** Signaler les jeux partiels ou non publics.

## LS-36 - Trouver MetaboLights
**Objectif.** Examiner facteurs, protocoles et métabolites.
**Starter prompt.** « Utilise `life-science-research:metabolights-skill` pour [SUJET]. Retourne MTBLS ID, organisme, design, technologie, protocoles, fichiers et licence. »
**Preuves.** MTBLS ID, métadonnées ISA, URL.
**Revue.** Vérifier unités, normalisation et contrôles.

## LS-37 - Explorer MGnify
**Objectif.** Lire une analyse microbiome avec pipeline et biome.
**Starter prompt.** « Utilise `life-science-research:mgnify-skill` pour [BIOME/ÉTUDE]. Retourne accessions, biome, pipeline/version, échantillons et produits d'analyse. »
**Preuves.** Study/analysis IDs, pipeline, URL.
**Revue.** Ne pas comparer des pipelines incompatibles sans correction.

## LS-38 - Préparer un BLAST
**Objectif.** Formuler une recherche de similarité reproductible.
**Starter prompt.** « Utilise `life-science-research:ncbi-blast-skill` avec [SÉQUENCE SYNTHÉTIQUE/PUBLIQUE]. Propose programme, base, taxon et seuils; masque toute donnée sensible et demande confirmation avant exécution. »
**Preuves.** Digest de séquence, paramètres, RID si exécuté, date.
**Revue.** Confirmer provenance et droit d'utiliser la séquence.

# Partie VIII - Synthèse contrôlée

## LS-39 - Construire une carte de sources
**Objectif.** Transformer des résultats hétérogènes en traces centrales contestables.
**Starter prompt.** « À partir des sorties validées, crée des cartes `synthia.education.source-card.v1`. Sépare observations, inférences et contradictions; soumets uniquement un `graph_delta` au `scholarium.central-knowledge-gateway.v1`. Demande matrices Euler/Hilbert seulement si l'ordre et les sources sont replayables. »
**Preuves.** Source cards, provenance, partition demandée, reçu gateway.
**Revue.** Aucune source rejetée ou sans licence ne passe dans `approved`.

## LS-40 - Projet intégrateur
**Objectif.** Réaliser une mini-revue multi-source sans surpromesse.
**Starter prompt.** « Utilise d'abord `life-science-research:research-router-skill` sur [QUESTION]. Après accord, exécute au plus quatre skills primaires complémentaires. Produis une table affirmation-preuve-contradiction-limite, les requêtes replayables et un reçu du gateway central. Termine par ce qu'on ne sait pas. »
**Preuves.** Plan approuvé, identifiants primaires, matrice de provenance, reçu, limites.
**Revue.** L'élève explique oralement ou par modalité accessible une preuve, une contradiction et une incertitude.

# Grille de validation

Un atelier est réussi quand la question reste bornée, les outils utilisés sont ceux annoncés, les identifiants et URL sont primaires, la date de récupération est visible, les limites ne sont pas masquées, et la personne peut corriger ou rejeter la synthèse. Le score ne mesure jamais la valeur ou l'intelligence d'un élève.
