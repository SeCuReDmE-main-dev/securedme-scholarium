# Scholarium — fil vivant plithogénique et explicable

## Invariants

- Le fil aide à **informer**, il ne détermine pas la vérité scientifique. La vérification, la modération et les reçus de provenance sont des processus distincts.
- Aucune dépense, abonnement, popularité brute, identité protégée ni durée de session ne peut augmenter la portée.
- Les hashtags suivis, favoris, réactions et « moins comme ceci » sont des signaux explicites, privés, réversibles et exportables avec le compte.
- Les contenus publics admissibles restent visibles par recherche et ordre chronologique; le fil de découverte ne les efface pas silencieusement.

## Ce qui est retenu des systèmes étudiés

YouTube distingue personnalisation, performance et satisfaction, et expose des commandes de désintérêt; il ne favorise pas les vidéos simplement parce qu'elles sont monétisées. [YouTube Help](https://support.google.com/youtube/answer/16089387), [YouTube Help](https://support.google.com/youtube/answer/16559651)

Facebook décrit un modèle inventaire → signaux → prédictions → score, plus des surfaces distinctes pour découverte et flux chronologique, ainsi que « Show more / Show less ». [Meta](https://about.fb.com/news/2018/05/inside-feed-news-feed-ranking/), [Meta](https://about.fb.com/news/2022/07/home-and-feeds-on-facebook/), [Meta](https://about.fb.com/news/2022/10/new-ways-to-customize-your-facebook-feed/)

Netflix utilise les interactions, préférences de contenus et métadonnées; les signaux récents comptent davantage et la page peut personnaliser les rangées, leur contenu et leur ordre. [Netflix Help](https://help.netflix.com/en/node/100639)

## Score opérationnel

Chaque publication admissible reçoit un vecteur `T/I/F`, où `T` est la pertinence de signal, `I` l'incertitude de métadonnées/provenance et `F` la résistance issue du seul retour négatif explicite de la personne. Ces valeurs ne sont **pas** une mesure de vérité d'un fait.

```text
score = T × (0.45 + 0.30 × pertinence choisie)
      + fraîcheur × (0.12 + 0.18 × fraîcheur choisie)
      − I × 0.20
      − F × 0.95
```

Après le score, un réordonnancement borné évite qu'un seul format (recherche, éducation, projet ou média) monopolise le fil. Le score est accompagné de raisons lisibles : hashtag suivi, favori, réaction, provenance vérifiée ou publication récente.

## Risques et protections

| Risque | Protection |
| --- | --- |
| boucle d'addiction | aucune métrique de watch time/session dans le score; chronologique toujours disponible |
| désinformation | score non présenté comme vérification; statut de provenance et signalement humain séparés |
| bulle de filtres | poids diversité contrôlable et formats multiples garantis |
| rétroaction cachée | seuls favoris/réactions/retours explicites sont consommés; export de compte les inclut |
| surcharge du fil vivant | rafraîchissement borné, sans polling agressif; futur flux événementiel via queue/webhook |

## Connecteurs vidéo — périmètre autorisé

YouTube peut accepter un upload OAuth via `videos.insert`, mais les projets API non audités restent privés; son API offre aussi les notifications PubSubHubbub par chaîne pour upload ou mise à jour de métadonnées. [YouTube Data API upload](https://developers.google.com/youtube/v3/docs/videos/insert), [YouTube push notifications](https://developers.google.com/youtube/v3/guides/push_notifications)

TikTok Direct Post exige l'autorisation explicite de la personne et un audit pour publier au-delà du privé. [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post?enter_method=left_navigation&from_seo_redirect=1)

Phase suivante : connecter ces flux derrière OAuth, stocker uniquement les références de publication/URL et les traces webhook signées; ne jamais aspirer un compte ni dupliquer les fichiers par défaut.
