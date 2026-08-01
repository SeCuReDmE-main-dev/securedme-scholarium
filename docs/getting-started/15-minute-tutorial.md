# Your first 15 minutes

This route teaches the operating method before any tool-specific complexity. You will locate a tool, read its contract, make one bounded request, and review the result without exposing a secret or changing a remote system.

=== "English"

    ## Minute 0-2: choose the smallest useful tool

    Open the [developer tool library](../tools/index.md) and select the tool whose stated purpose matches your task. Do not choose a tool because its name sounds powerful.

    ## Minute 2-5: read the boundary

    On the tool page, open its README and contribution guide. Identify:

    - what the tool does;
    - what it explicitly does not prove;
    - the expected runtime;
    - the checks required before accepting a change.

    ## Minute 5-8: inspect before acting

    ```powershell
    git status --short --branch
    git remote -v
    ```

    Confirm the repository and branch. Never paste `.env`, passwords, cookies, API keys, or tokens into a prompt.

    ## Minute 8-11: start one collaboration contract

    Open the [40 collaboration prompts](../teach/LIFE_SCIENCE_40_PROMPT_BOOK.md). Pick one prompt and replace every `[A COMPLETER]` field. Keep the requested scope small enough to verify in one review.

    ## Minute 11-14: review the evidence

    Check that the response separates observations, inferences, contradictions, and limits. A result without identifiers, source URLs, parameters, or a replay path is not complete.

    ## Minute 14-15: decide as the human operator

    Choose one outcome: accept, request a correction, quarantine, or stop. The agent can prepare and execute bounded work; you remain responsible for the objective and acceptance decision.

=== "Français"

    ## Minute 0-2: choisir le plus petit outil utile

    Ouvrez la [bibliothèque des outils](../tools/index.md) et choisissez celui dont la fonction déclarée correspond à votre tâche. Ne choisissez pas un outil simplement parce que son nom semble puissant.

    ## Minute 2-5: lire la frontière

    Dans sa fiche, ouvrez le README et le guide de contribution. Identifiez:

    - ce que l’outil accomplit;
    - ce qu’il ne permet pas de prouver;
    - son environnement d’exécution;
    - les vérifications requises avant d’accepter un changement.

    ## Minute 5-8: inspecter avant d’agir

    ```powershell
    git status --short --branch
    git remote -v
    ```

    Confirmez le dépôt et la branche. Ne placez jamais `.env`, mot de passe, cookie, clé API ou jeton dans une prompt.

    ## Minute 8-11: lancer un contrat de collaboration

    Ouvrez les [40 prompts de collaboration](../teach/LIFE_SCIENCE_40_PROMPT_BOOK.md). Choisissez une tâche et remplacez tous les champs `[A COMPLETER]`. Le périmètre doit rester assez petit pour être vérifié en une seule revue.

    ## Minute 11-14: examiner les preuves

    Vérifiez que la réponse sépare observation, inférence, contradiction et limite. Sans identifiants, URL de source, paramètres ou chemin de replay, le résultat n’est pas terminé.

    ## Minute 14-15: décider comme opérateur humain

    Choisissez: accepter, demander une correction, mettre en quarantaine ou arrêter. L’agent prépare et exécute un travail borné; la personne demeure responsable de l’objectif et de l’acceptation.

## Continue

After this tutorial, use a tool’s developer page as the front door. Move to the repository only when you are ready to read its exact installation and validation instructions.

<div class="se-next-actions">
  <a href="../tools/">Explore the 12 tools</a>
  <a href="../teach/LIFE_SCIENCE_40_PROMPT_BOOK/">Use the 40 prompts</a>
  <a href="../media/video-library/">Watch the video library</a>
</div>
