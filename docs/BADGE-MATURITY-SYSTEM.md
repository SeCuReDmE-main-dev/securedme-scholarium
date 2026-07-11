# Scholarium — badge de maturité de l'écosystème

**Statut :** contrat de conception et de gouvernance. Ce document décrit les règles à implémenter; aucun badge ne doit être affiché comme obtenu avant que les preuves correspondantes existent.

## Finalité

Un badge Scholarium indique la maturité d'une personne dans l'écosystème SecuredMe Education. Il ne mesure ni argent, ni popularité, ni qualité intrinsèque d'une recherche. Il répond uniquement à : **dans quelle mesure cette personne utilise-t-elle réellement et durablement les outils qu'elle a choisi d'activer ?**

Le badge est une reconnaissance visuelle discrète. Il ne modifie jamais le classement, la portée, les droits de publication, les limites de stockage ou la priorité de support.

## Échelle centrale

L'échelle suit les étapes Fibonacci `1, 2, 3, 5, 8`, puis se poursuit par enrichissement visuel jusqu'au niveau 10. Le calcul est fondé sur le nombre d'outils de la suite activés avec consentement et usage attesté; un outil non utile à la personne ne doit jamais être imposé.

| Niveau visuel | État | Signal graphique | Règle de présentation |
| --- | --- | --- | --- |
| 1–3 | Éducation | lignes ouvertes, peu de nœuds, bleu/violet | découverte et premières connexions |
| 4–7 | Transition | réseau et anneaux progressivement enrichis; accents or limités | construction d'un écosystème choisi |
| 8 | Maturité de l'écosystème | cœur or, contours bleus et violets conservés | 8 outils actifs attestés; aucun paiement |
| 9 | Maturité approfondie | texture et anneaux plus riches | continuité attestée après le seuil 8 |
| 10 | Maîtrise | géométrie complète | parcours soutenu et vérifiable; sans classement |

Le terme de communication externe est **maturité de l'écosystème**. Les maquettes peuvent employer « Premium » ou « Gold Mode » comme direction graphique, mais l'interface ne doit jamais suggérer une offre payante ou une classe sociale.

## Éligibilité et données minimales

Une future implémentation doit calculer le statut côté serveur à partir de preuves minimales par outil : identifiant pseudonymisé de la personne, identifiant de l'outil, date d'activation, date de dernière attestation et version de la règle. Les données de contenu, de navigation détaillée, de revenus, de likes, de classement global et de biométrie sont hors périmètre.

Une preuve d'usage doit venir d'une intégration explicitement consentie ou d'une attestation locale vérifiable. Une simple visite, une installation forcée ou une connexion sans action ne comptent pas. Les outils sont dédupliqués et la personne peut retirer son consentement; le badge est alors recalculé sans historique caché.

## Transparence et recours

La carte de badge doit afficher, sur demande : le niveau, le nombre d'outils actifs, l'étape Fibonacci applicable, la date d'obtention et la version de la règle. Elle ne doit pas exposer la liste des outils sans consentement de la personne.

La personne peut choisir de masquer le badge. Le masquage concerne l'affichage public uniquement et ne modifie pas ses données. Toute décision est explicable, réévaluable et accompagnée d'un moyen de signaler une erreur.

## Emplacements d'interface

Le badge peut apparaître près du nom, dans les commentaires, publications, cartes de personne, recherche et espaces collaboratifs. Il demeure secondaire au titre, au contenu, à la provenance et aux contrôles de sécurité. Un texte alternatif décrit le niveau sans tonalité compétitive, par exemple : « Maturité de l'écosystème — niveau 5, badge visible à la demande de la personne ».

## Invariants non négociables

- jamais achetable, transférable, négociable ou échangeable;
- jamais utilisé dans une recommandation, un classement ou une publicité;
- jamais lié à un abonnement à 0,99 $ ou à une vérification d'identité;
- jamais basé sur les likes, abonnés, revenus, statut social ou volume de publication;
- jamais une condition d'accès à l'éducation, à la publication ou à la collaboration.

Les badges thématiques, de contribution, de continuité ou de certification peuvent s'ajouter ultérieurement. Ils complètent, sans remplacer, cette échelle centrale et doivent respecter exactement ces invariants.

## Plan d'implémentation contrôlé

1. Valider les masters clair/sombre et créer un catalogue sémantique pour les dix variantes.
2. Définir la liste versionnée des outils admissibles et le contrat d'attestation consentie.
3. Créer une table d'événements minimisée, une fonction de calcul déterministe et une migration réversible.
4. Exposer une API privée d'explication et une préférence publique de visibilité, sans exposer les outils d'une personne.
5. Ajouter les composants `MaturityBadge` et `BadgeExplanation`, avec textes alternatifs et contrastes AA.
6. Tester les seuils, retrait de consentement, déduplication, absence d'effet sur le feed et contrôle d'accès.
7. Ne publier qu'après revue confidentialité, accessibilité, sécurité et gouvernance du catalogue.
