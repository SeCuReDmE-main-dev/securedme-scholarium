# Rapport de conception émergente

## Cours d’espagnol et vision de Scholarium Teach

**Date de la réflexion :** 15 juillet 2026
**Statut :** notes conceptuelles issues d’une séance réelle d’apprentissage
**Produit existant concerné :** Scholarium
**Adresse fournie :** [https://www.scholarium.securedme.ca/](https://www.scholarium.securedme.ca/)

---

## 1. Cadre et précautions

Scholarium existe déjà et est actuellement en développement.

Ce rapport ne prétend pas décrire son architecture actuelle, son code, ses fonctionnalités implantées, son infrastructure ou son modèle de données. Il rassemble uniquement les besoins observés pendant le cours d’espagnol et les idées de conception exprimées pendant la discussion.

Les éléments présentés ici sont donc répartis en trois catégories :

1. Les observations provenant directement du cours d’espagnol.
2. Les intentions de conception exprimées pour Scholarium Teach.
3. Les hypothèses techniques, juridiques et algorithmiques qui devront être étudiées avant toute implantation.

---

# Partie I — Origine de l’idée

## 2. Objectif d’apprentissage initial

Jean-Sébastien veut apprendre à parler espagnol dans un délai court, avec l’objectif de pouvoir tenir une conversation quotidienne simple à la fin du mois.

Il ne souhaite pas faire seulement cinq minutes d’exercice à la fois. Il veut pouvoir suivre de véritables séances d’environ une heure.

L’apprentissage doit être :

* pratique;
* oral;
* visuel;
* progressif;
* adapté à son rythme réel;
* fondé sur la maîtrise plutôt que sur la simple exposition à la matière.

---

## 3. Contenu pratiqué pendant la séance

### 3.1 Saluer une personne

Question :

> Hola, ¿cómo estás?

Réponse pratiquée :

> Muy bien, ¿y tú?

Une difficulté est apparue : cette réponse a ensuite été utilisée lorsqu’une question différente était posée.

Cela montre qu’il ne suffit pas de mémoriser une phrase isolée. L’apprenant doit également apprendre à reconnaître le contexte précis dans lequel cette phrase doit être utilisée.

---

### 3.2 Dire son nom

Question :

> ¿Cómo te llamas?

Réponse cible :

> Me llamo Jean-Sébastien.

Difficultés observées :

* hésitation entre « me amo » et « me llamo »;
* difficulté à produire immédiatement la phrase complète;
* besoin de répéter le début de la phrase plusieurs fois;
* besoin d’entendre et de voir les mots simultanément.

La méthode la plus utile a été de découper l’expression, de la répéter lentement, puis de reconstruire la phrase entière.

---

### 3.3 Dire d’où l’on vient

Question :

> ¿De dónde eres?

Traduction :

> D’où viens-tu?

Réponse cible :

> Soy de Montreal.

Difficultés observées :

* réponse initiale limitée à « Montréal »;
* ajout spontané de « et toi » avant que la structure espagnole soit maîtrisée;
* répétition partielle de « Soy de » avant la production de la phrase complète.

---

### 3.4 Dire son âge

Question :

> ¿Cuántos años tienes?

Traduction :

> Quel âge as-tu?

Réponse cible :

> Tengo cuarenta y tres años.

Difficultés observées :

* utilisation initiale de « cuento » plutôt que « tengo »;
* hésitation sur la prononciation de « cuarenta »;
* besoin de découper la phrase en plusieurs segments.

Découpage utilisé :

1. Tengo
2. cuarenta
3. y tres años

La phrase complète a finalement été produite correctement.

---

## 4. Limite du modèle pédagogique initial

Le cours avançait trop rapidement.

De nouvelles questions étaient introduites avant que les précédentes soient réellement maîtrisées. Jean-Sébastien a explicitement demandé que chaque question soit travaillée jusqu’à ce qu’elle soit comprise, mémorisée et utilisable dans une conversation.

Un simple « OK » de l’étudiant ne doit pas être interprété comme une preuve de maîtrise.

La maîtrise doit être vérifiée par :

* une répétition sans aide;
* une réponse appropriée à la bonne question;
* un rappel après un délai;
* une utilisation dans une conversation complète;
* une capacité à reprendre depuis le début sans confusion.

---

# Partie II — Besoins pédagogiques observés

## 5. Apprentissage multimodal

Jean-Sébastien apprend mieux lorsqu’il peut simultanément :

* entendre la phrase;
* voir la phrase écrite;
* parler à l’assistant en direct;
* voir la transcription de ce qu’il vient de dire;
* recevoir une correction immédiate;
* voir une aide phonétique simple.

L’environnement idéal ne serait donc pas seulement un chat textuel ou un appel vocal.

Il réunirait la voix et l’interface visuelle dans un seul espace continu.

---

## 6. Rythme adaptatif

Le système doit pouvoir :

* enseigner une seule expression principale à la fois;
* détecter ou reconnaître un blocage;
* ralentir automatiquement;
* décomposer une phrase;
* donner un indice avant de fournir la réponse complète;
* répéter sans devenir mécanique;
* vérifier la maîtrise avant de progresser;
* reprendre exactement au même endroit après une pause.

Le système ne doit pas imposer son rythme à l’apprenant.

Il doit modifier son rythme en fonction de la réponse réelle de l’apprenant.

---

## 7. Mémoire pédagogique

L’outil devrait conserver au minimum trois états :

* maîtrisé;
* en apprentissage;
* à revoir.

Il pourrait également conserver :

* les erreurs fréquentes;
* les confusions entre questions et réponses;
* les difficultés de prononciation;
* la quantité d’aide nécessaire;
* le temps requis avant une réponse correcte;
* la capacité à réutiliser un concept dans un nouveau contexte.

Cette mémoire pédagogique servirait à préparer les interventions suivantes.

---

# Partie III — Émergence de Scholarium Teach

## 8. Principe général

Pendant le cours d’espagnol, une vision plus large est apparue : **Scholarium Teach**.

Scholarium Teach serait une composante éducative de Scholarium conçue à partir de situations d’apprentissage réelles.

Le développement pourrait se faire parallèlement aux cours :

1. Jean-Sébastien utilise le système comme premier apprenant.
2. Les difficultés et besoins réels sont observés.
3. Des mécanismes sont prototypés.
4. Les mécanismes sont testés pendant les cours.
5. Les éléments réellement utiles sont ensuite structurés pour Scholarium.

Le cours devient ainsi un laboratoire vivant pour la conception du produit.

---

## 9. Domaines d’apprentissage envisagés

Scholarium Teach ne serait pas limité aux cours d’espagnol.

Les domaines évoqués comprennent :

* l’apprentissage des langues;
* l’écriture;
* la communication;
* les langues des signes;
* des outils adaptés aux personnes sourdes ou non verbales;
* des méthodes destinées aux personnes neurodivergentes;
* des méthodes adaptées aux difficultés liées au langage, à la lecture ou au texte.

Ces domaines représentent une direction possible, et non une portée définitivement arrêtée.

---

# Partie IV — Vision de l’interface

## 10. Interface multimodale

L’interface imaginée est perçue comme belle et rappelle une interface précédemment imaginée pour **Synthia**.

Cette référence est visuelle et conceptuelle seulement. Le présent rapport ne suppose aucune fonctionnalité existante de Synthia.

Les éléments d’interface évoqués comprennent :

* une conversation vocale en direct;
* une transcription visible;
* une grande zone affichant la phrase en cours;
* la traduction de la phrase;
* une aide phonétique;
* un historique de conversation;
* une indication de progression;
* les notions maîtrisées;
* les notions en cours d’apprentissage;
* les notions à revoir;
* les erreurs fréquentes;
* la possibilité de faire une pause sans perdre le contexte.

L’interface doit éviter de submerger l’apprenant.

Elle doit afficher l’information utile au bon moment plutôt que de présenter trop de contenu simultanément.

---

# Partie V — Assistant numérique de l’étudiant

## 11. Assistant Scholarium sur téléphone

L’étudiant pourrait avoir son propre assistant numérique Scholarium sur son téléphone.

Cet assistant serait lié à son parcours d’apprentissage et évoluerait avec lui.

Il ne serait pas seulement un chatbot répondant à des questions. Il deviendrait un accompagnateur éducatif personnel qui comprend progressivement :

* les forces de l’étudiant;
* ses difficultés;
* ses talents;
* ses sujets favoris;
* ses habitudes;
* son rythme;
* les matières actuellement étudiées;
* sa progression au cours de l’année scolaire.

L’étudiant pourrait participer à la configuration ou à la création de son assistant afin que celui-ci corresponde à sa réalité.

---

## 12. Adaptation à l’année scolaire

Scholarium Teach s’adapterait à l’année scolaire en cours.

L’assistant devrait comprendre ce que l’étudiant apprend actuellement à l’école, semaine après semaine.

Son enseignement et ses interventions devraient rester cohérents avec :

* les cours suivis;
* les notions présentement enseignées;
* les objectifs de la semaine;
* le niveau scolaire;
* l’évolution de l’étudiant;
* les forces et les difficultés observées.

L’assistant ne devrait pas appliquer un parcours éducatif générique indépendant de la réalité scolaire.

Il devrait adapter son accompagnement au développement réel de l’étudiant pendant l’année.

---

## 13. Apprentissage intégré à la vie quotidienne

Une idée centrale est de transformer l’utilisation quotidienne du téléphone en possibilité d’apprentissage continu.

L’objectif n’est pas de transformer chaque interaction en exercice scolaire explicite.

L’assistant guiderait discrètement l’étudiant vers les apprentissages utiles de sa semaine.

L’étudiant pourrait ainsi apprendre au fil de son utilisation normale du téléphone, sans nécessairement avoir l’impression d’être constamment dans une séance de cours.

Cette expérience doit respecter trois contraintes :

* ne pas devenir fatigante;
* ne pas devenir envahissante;
* ne pas devenir répétitive.

L’assistant doit varier les contextes, les formats et les moments d’intervention.

---

## 14. Guidance pédagogique discrète

L’assistant pourrait relier des situations quotidiennes aux apprentissages en cours.

Par exemple, sans imposer un exercice formel, il pourrait réutiliser une notion scolaire dans :

* une conversation;
* une suggestion;
* une explication;
* une activité;
* une question;
* un exemple associé à un intérêt de l’étudiant.

L’étudiant pourrait ne pas toujours remarquer immédiatement que l’assistant est en train de le guider vers un objectif éducatif.

Cette discrétion ne doit toutefois pas devenir de la manipulation. La transparence, le consentement et le contrôle de l’utilisateur devront faire partie de la conception.

---

# Partie VI — Personnalisation et données

## 15. Données possibles

Une idée a été exprimée concernant l’utilisation de données provenant du téléphone, par exemple :

* comportements d’utilisation;
* applications utilisées;
* recherches effectuées;
* sujets consultés;
* interactions avec l’assistant;
* progression scolaire;
* apprentissages observés pendant la semaine.

Ces sources de données sont actuellement des pistes de conception.

Leur accès réel, leur pertinence, leur légalité, leur niveau de sensibilité et leur acceptabilité doivent être évalués séparément.

Aucune collecte ne devrait être supposée automatique ou autorisée par défaut.

---

## 16. Fonction attendue du moteur d’analyse

Un moteur à concevoir devrait être capable de :

* récupérer les données explicitement autorisées;
* compiler les observations utiles;
* classer les informations par sujet;
* repérer les sujets favoris;
* distinguer un intérêt temporaire d’un intérêt durable;
* identifier progressivement les talents;
* reconnaître les forces;
* observer les difficultés;
* relier les intérêts aux objectifs scolaires;
* produire des métriques éducatives;
* éviter de réduire l’étudiant à une catégorie rigide.

Les résultats devraient servir à adapter l’enseignement, et non à imposer une identité fixe à l’étudiant.

---

## 17. Moteur plithogénique envisagé

Jean-Sébastien souhaite explorer son propre ensemble d’algorithmes plithogéniques pour analyser et organiser ces informations.

L’intention exprimée est de pouvoir gérer simultanément :

* des données compatibles;
* des données contradictoires;
* des intérêts multiples;
* des signaux incertains;
* des évolutions dans le temps;
* des forces qui dépendent du contexte;
* différentes dimensions du développement d’un étudiant.

Ce moteur devrait pouvoir rechercher, compiler et classifier les données tout en conservant leur contexte et leur niveau d’incertitude.

La définition mathématique, le modèle de données, les métriques et les règles de décision restent à concevoir.

---

# Partie VII — Préparation des interventions

## 18. Travail préparatoire de l’assistant

L’assistant de l’étudiant pourrait préparer les prochaines interventions en arrière-plan.

Il pourrait organiser :

* les notions à réviser;
* les occasions naturelles de réutilisation;
* les difficultés à surveiller;
* les sujets pouvant être reliés aux intérêts de l’étudiant;
* les prochains exercices;
* les changements de stratégie pédagogique;
* les moments où il vaut mieux ne pas intervenir.

Chaque intervention devrait avoir pour objectif l’apprentissage et la croissance de l’étudiant, tout en restant adaptée :

* à sa réalité;
* à ses talents;
* à ses préférences;
* à ses sujets favoris;
* à son niveau d’énergie;
* au contenu réellement vu à l’école.

---

# Partie VIII — AlgoQuest comme interface d’échange éducatif

## 19. AlgoQuest comme porte d’entrée

Dans cette vision, **AlgoQuest** est déjà l’application centrale servant de porte d’entrée à la suite éducative.

Elle constitue le point principal d’interaction entre l’étudiant et le professeur.

AlgoQuest n’est pas une application supplémentaire : elle est le canal existant et structurant de communication pédagogique.

Elle regroupe :

* les échanges entre l’étudiant et le professeur;
* les interactions avec les assistants;
* les activités éducatives;
* les suivis de progression;
* les retours pédagogiques.

Elle devient ainsi le noyau opérationnel de la relation éducative dans Scholarium Teach.

---

## 20. Rôle des assistants dans AlgoQuest

Le modèle repose sur trois entités intégrées dans AlgoQuest :

* l’étudiant;
* le professeur;
* leurs assistants respectifs.

Chaque utilisateur interagit principalement avec son propre assistant à l’intérieur d’AlgoQuest.

Les assistants servent d’intermédiaires intelligents pour :

* structurer les échanges;
* filtrer les informations;
* contextualiser les demandes;
* adapter les réponses au niveau pédagogique.

Le professeur ne communique pas directement avec les données internes de l’étudiant.

Il passe par son assistant, qui dialogue avec l’assistant de l’étudiant dans un cadre contrôlé.

---

## 21. Communication structurée via AlgoQuest

AlgoQuest permet une communication indirecte mais structurée entre les deux assistants.

Exemples de requêtes du professeur via AlgoQuest :

* obtenir un résumé des apprentissages récents;
* identifier les notions maîtrisées;
* détecter les difficultés persistantes;
* comprendre les types d’explications efficaces;
* suivre la progression globale;
* signaler un besoin d’intervention humaine.

L’assistant de l’étudiant répond en générant :

* des rapports synthétiques;
* des métriques pédagogiques;
* des tendances d’apprentissage;
* des recommandations ciblées.

Ces échanges sont limités à ce qui est nécessaire et autorisé.

---

## 22. Protection des données dans AlgoQuest

AlgoQuest applique un principe fondamental :

le professeur n’a pas accès aux données brutes de l’étudiant.

Les informations transmises sont :

* agrégées;
* contextualisées;
* limitées à une finalité pédagogique.

Cela inclut :

* des indicateurs de progression;
* des synthèses d’apprentissage;
* des signaux d’alerte;
* des recommandations.

Le système doit empêcher toute reconstruction indirecte des données personnelles à partir des métriques.

---

## 23. Évaluation via AlgoQuest

AlgoQuest permet au professeur de soutenir l’évaluation de l’étudiant à partir d’informations structurées.

Cependant :

* l’intelligence artificielle ne remplace pas le jugement humain;
* les rapports doivent être interprétés;
* les décisions pédagogiques finales restent humaines.

Il faudra définir clairement :

* la différence entre observation et inférence;
* ce qui peut être utilisé pour une évaluation officielle;
* les mécanismes de validation humaine;
* les droits de consultation de l’étudiant;
* les possibilités de contestation ou de correction.

---

# Partie IX — Contraintes éthiques et juridiques

## 23. Protection de la vie privée

La vision implique potentiellement le traitement de données très sensibles concernant des étudiants, possiblement mineurs.

La protection de la vie privée doit donc être une propriété centrale de l’architecture, et non un ajout effectué après le développement.

Principes à étudier :

* consentement explicite;
* consentement adapté à l’âge;
* rôle des parents ou responsables;
* minimisation des données;
* limitation des finalités;
* durée de conservation limitée;
* contrôle de l’étudiant;
* possibilité de retrait;
* suppression des données;
* explicabilité;
* séparation des données brutes et des métriques;
* sécurité des communications entre assistants;
* journalisation des accès;
* prévention de la surveillance excessive.

---

## 24. Cadres juridiques à valider

Jean-Sébastien souhaite que la conception respecte notamment :

* la Loi 25 du Québec;
* les lois applicables en France;
* les autres obligations pertinentes selon le lieu de résidence, l’établissement scolaire et l’âge de l’utilisateur.

Le contenu précis de ces obligations doit être vérifié avec des sources juridiques actuelles et, pour une implantation réelle, avec des spécialistes compétents.

Ce rapport ne constitue pas une analyse juridique.

---

# Partie X — Principes fondamentaux du produit

## 25. Principes exprimés pendant la réflexion

Scholarium Teach devrait :

1. S’adapter à l’étudiant plutôt que forcer l’étudiant à s’adapter au système.
2. Relier l’apprentissage scolaire à la vie quotidienne.
3. Suivre l’année scolaire réelle.
4. Apprendre progressivement les forces, talents et intérêts de l’étudiant.
5. Utiliser uniquement des données autorisées et nécessaires.
6. Protéger les données brutes.
7. Donner au professeur des métriques utiles sans exposer la vie privée.
8. Préparer les interventions futures à partir du développement observé.
9. Éviter les répétitions mécaniques.
10. Éviter la fatigue cognitive.
11. Ne pas devenir intrusif.
12. Rester cohérent avec les apprentissages de la semaine.
13. Distinguer les faits observés des inférences algorithmiques.
14. Permettre une supervision et une correction humaines.
15. Faire de l’ass
