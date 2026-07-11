# Scholarium — export et fermeture de compte

## Export disponible

Une personne connectée ayant créé son compte peut télécharger `/api/v1/account/export`. Le fichier JSON est privé (`Cache-Control: private, no-store`) et porte le format versionné `securedme-scholarium-account-export/v1`.

L'export réunit les données de compte, rôles, préférences, sujets suivis, identités externes non secrètes, intégrations non secrètes, publications, versions, empreintes d'artefacts, commentaires, réactions et limites relationnelles. Les exports n'incluent jamais les cookies, secrets OAuth, jetons de fournisseur, références de coffre, références de paiement, références de vérification documentaire, données privées d'autres membres ni les binaires R2.

## Fermeture de compte — garde-fou de conception

La fermeture ne doit pas être une suppression SQL aveugle : les publications, versions, empreintes SHA-256 et reçus de provenance constituent des traces d'attribution qui peuvent être nécessaires à la paternité et aux contestations. Avant d'activer cette action, Scholarium doit fournir une confirmation explicite, l'annulation documentée des abonnements, une période de grâce, une anonymisation de l'identité publique, la conservation minimisée des preuves de provenance et un parcours d'appel.

Cette séparation protège à la fois le droit de contrôle de la personne et l'intégrité des œuvres publiées. Aucune fermeture automatique ou irréversible n'est actuellement exposée par l'application.
