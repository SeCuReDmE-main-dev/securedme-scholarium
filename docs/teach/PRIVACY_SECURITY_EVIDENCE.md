# Scholarium Teach: dossier de sécurité et vie privée

**Statut:** pré-alpha fermée. Ce document est un registre d’ingénierie; il ne remplace pas une évaluation juridique ou une EFVP qualifiée.

## Frontière de traitement

| Surface | Donnée autorisée | Donnée interdite | Contrôle |
| --- | --- | --- | --- |
| Navigateur | carte préchargée, tentative en transit, consentement courant | journal durable d’audio, secret moteur | `cache-control: private, no-store` |
| D1 canonique | checkpoint, reçu, digest, réponse minimisée, consentement | audio, transcription, V.O.T., jitter, MFCC | migration `0037`, export/suppression Teach |
| Python | entrée de décision, buffer audio éphémère, résultat agrégé | état élève durable, extraction vocale durable | `ephemeral_observation`, purge applicative |
| PostgreSQL | pack et provenance éditoriale | progression élève, audio, réponse brute | rôle moteur lecture seule |
| TimescaleDB | événement technique sans identité | identité, réponse brute, audio | contraintes SQL explicites |
| CodeProject.AI | observation optionnelle, synthétique/adulte consentant | autorité de progression, profil mineur | manifest désactivé par défaut |
| Sauvegarde | configuration chiffrée, catalogues, packs | contenu audio et télémétrie identifiante | exercice restauration requis |
| VM Multipass | conteneurs privés sans ports publiés | ingress public, volume audio hôte | réseau interne et runbook de suppression |

## Décisions techniques prises

1. La voix est traitée comme donnée personnelle potentielle, y compris lorsqu’aucune reconnaissance vocale n’est recherchée. Elle n’est pas conservée.
2. Tenebris ne renvoie que des catégories de qualité et une preuve de nettoyage applicatif. Il ne revendique pas l’effacement physique de toutes copies mémoire Python.
3. D1 est le seul registre de progression. Toute écriture de tentative exige le digest du checkpoint lu; le trigger D1 annule le batch complet en cas de concurrence.
4. L’outbox est dérivée et non autoritaire. Elle ne reçoit que des événements dont les champs `contains_identity`, `contains_raw_answer` et `contains_audio` sont faux.
5. Les enseignants accèdent uniquement aux projections d’élèves qui leur sont explicitement attribués. Les lignes d’organisation exigent un groupe d’au moins dix personnes et ne portent aucune donnée individuelle.

## Obligations de preuve avant élèves réels

- Exécuter une EFVP proportionnée avec une personne qualifiée lorsque le contexte de déploiement l’exige.
- Vérifier la politique de consentement, l’expiration, la révocation, l’export et la suppression avec un compte de test.
- Inspecter les logs, D1, PostgreSQL, Timescale et sauvegardes après un essai audio synthétique; aucune signature vocale ou réponse brute ne doit apparaître.
- Effectuer le test de restauration de la VM et confirmer que les garde-fous restent actifs.
- Avant un déploiement France/UE, conduire une analyse spécifique RGPD, y compris la base juridique, les mineurs et les transferts.

## Décision de fermeture du 2026-08-02

Scholarium Teach reste en pré-alpha fermée. Le moteur syllabique possède des
preuves noyau et une preuve D1 synthétique dans Multipass, mais cela ne suffit
pas pour ouvrir un accès alpha. Aucun élève mineur, aucune école, aucun accès
externe, aucun CodeProject.AI live et aucun runtime TimescaleDB/PostgreSQL
accepté comme preuve alpha ne sont autorisés dans cet état.

Le passage alpha exige encore une EFVP ou une revue qualifiée selon le contexte,
les secrets alpha via Settings Operator, une preuve route-level, un exercice de
restauration, les gates Playwright/accessibilité/appareil et la vérification du
contrat live CodeProject.AI avant toute activation d’observation.

## Sources de conception

- [Gouvernement du Québec - EFVP](https://www.quebec.ca/gouvernement/travailler-gouvernement/normes-gouvernance-pratiques-internes/protection-des-renseignements-personnels/evaluation-facteurs-relatifs-vie-privee): l’EFVP est une démarche préventive, à commencer tôt et à mettre à jour pendant l’évolution du projet.
- [CNIL - Donnée personnelle](https://www.cnil.fr/fr/definition/donnee-personnelle): la voix peut permettre une identification indirecte; son traitement doit rester sous maîtrise de la personne.
- [RGPD - Règlement (UE) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng): frontière inactive pour cette pré-alpha, obligatoire avant un traitement relevant de l’UE.
- [OWASP - Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html): les événements sensibles ne doivent pas être envoyés tels quels aux journaux; le masquage et la minimisation sont requis.
- [Python documentation - Glossary](https://docs.python.org/3/glossary.html): la libération d’objets ne constitue pas une preuve d’effacement physique de copies immuables.

## Risques ouverts

- Aucune EFVP ni avis juridique qualifié n’est encore enregistré.
- Le contrat réel de CodeProject.AI Server doit être vérifié avant activation.
- La preuve D1 route-level reste ouverte; la preuve acceptée aujourd’hui est le harness Linux Multipass avec identité synthétique.
- La VM Multipass existe et le runtime Docker a été observé, mais le compose alpha reste volontairement arrêté tant que les secrets et la preuve de restauration ne sont pas complétés.
