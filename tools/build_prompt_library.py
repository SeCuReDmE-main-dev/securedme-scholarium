from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "prompts"
DATA = ROOT / "docs" / "data" / "collaboration-prompts.json"


PROMPTS = [
    ("scholarium", "Choose the right entry route", "Choisir la bonne porte d'entree", "Elegir la ruta de entrada correcta", "Map one user goal to the smallest suitable suite tool.", "Relier un objectif au plus petit outil approprie de la suite.", "Relacionar un objetivo con la herramienta mas pequena adecuada.", "A tool choice, rejected alternatives, and the next verifiable action.", "Un choix d'outil, les options rejetees et la prochaine action verifiable.", "Una herramienta elegida, alternativas rechazadas y la proxima accion verificable."),
    ("scholarium", "Inspect a tool contract", "Inspecter le contrat d'un outil", "Inspeccionar el contrato de una herramienta", "Read tool-doc.v2 and identify runtime, limits, commands, and human gates.", "Lire tool-doc.v2 et identifier runtime, limites, commandes et controles humains.", "Leer tool-doc.v2 e identificar runtime, limites, comandos y controles humanos.", "A contract summary linked to exact repository fields.", "Un resume relie aux champs exacts du depot.", "Un resumen vinculado a los campos exactos del repositorio."),
    ("scholarium", "Reproduce repository state", "Reproduire l'etat du depot", "Reproducir el estado del repositorio", "Capture branch, commit, changes, runtime, and the smallest supported check.", "Capturer branche, commit, changements, runtime et verification minimale.", "Capturar rama, commit, cambios, runtime y verificacion minima.", "A replayable state receipt with no secret values.", "Un recu d'etat rejouable sans valeur secrete.", "Un recibo de estado reproducible sin valores secretos."),
    ("scholarium", "Plan one bounded change", "Planifier un changement borne", "Planificar un cambio acotado", "Turn a requested outcome into scope, files, risks, checks, and stop points.", "Transformer le resultat demande en perimetre, fichiers, risques, tests et arrets.", "Convertir el resultado pedido en alcance, archivos, riesgos, pruebas y paradas.", "A decision-complete plan that does not execute the change.", "Un plan complet qui n'execute pas le changement.", "Un plan completo que no ejecuta el cambio."),
    ("scholarium", "Audit a public route", "Auditer une route publique", "Auditar una ruta publica", "Check availability, title, primary action, documentation link, and mobile behavior.", "Verifier disponibilite, titre, action principale, documentation et mobile.", "Verificar disponibilidad, titulo, accion principal, documentacion y movil.", "A pass/fail route report with screenshots or response evidence.", "Un rapport route reussie/echouee avec preuves.", "Un informe de ruta aprobada/fallida con evidencias."),
    ("algoquest-qbit", "Design a bounded learner challenge", "Concevoir un defi eleve borne", "Disenar un desafio estudiantil acotado", "Create one challenge with objective, hints, observable success, and teacher review.", "Creer un defi avec objectif, indices, succes observable et revue enseignante.", "Crear un desafio con objetivo, pistas, exito observable y revision docente.", "A challenge specification and acceptance rubric.", "Une specification de defi et une grille d'acceptation.", "Una especificacion de desafio y rubrica de aceptacion."),
    ("algoquest-qbit", "Review a teacher pathway", "Reviser un parcours enseignant", "Revisar una ruta docente", "Inspect pacing, prerequisites, learner choices, and feedback without grading automatically.", "Inspecter rythme, prerequis, choix eleves et retour sans notation automatique.", "Inspeccionar ritmo, requisitos, decisiones y retroalimentacion sin calificar automaticamente.", "A revised pathway with explicit teacher decisions.", "Un parcours revise avec decisions enseignantes explicites.", "Una ruta revisada con decisiones docentes explicitas."),
    ("algorithm-builder", "Model an algorithm visually", "Modeliser un algorithme visuellement", "Modelar un algoritmo visualmente", "Convert a plain-language process into nodes, edges, inputs, outputs, and invariants.", "Convertir un processus en noeuds, liens, entrees, sorties et invariants.", "Convertir un proceso en nodos, enlaces, entradas, salidas e invariantes.", "A graph specification and unresolved assumptions.", "Une specification de graphe et hypotheses non resolues.", "Una especificacion de grafo y supuestos no resueltos."),
    ("algorithm-builder", "Test a visual algorithm", "Tester un algorithme visuel", "Probar un algoritmo visual", "Derive normal, edge, invalid, and recovery cases from a visual graph.", "Deriver les cas normaux, limites, invalides et de reprise d'un graphe.", "Derivar casos normales, limite, invalidos y de recuperacion de un grafo.", "A test matrix tied to graph nodes and transitions.", "Une matrice de tests reliee aux noeuds et transitions.", "Una matriz de pruebas vinculada a nodos y transiciones."),
    ("ffed-qlc", "Evaluate candidate admissibility", "Evaluer l'admissibilite d'un candidat", "Evaluar la admisibilidad de un candidato", "Run one candidate through declared FfeD-QLC criteria without promoting it to proof.", "Passer un candidat dans les criteres declares sans le transformer en preuve.", "Pasar un candidato por los criterios declarados sin convertirlo en prueba.", "An admitted, suspended, or rejected trace with reasons.", "Une trace admise, suspendue ou rejetee avec raisons.", "Una traza admitida, suspendida o rechazada con razones."),
    ("ffed-qlc", "Preserve a contradiction", "Preserver une contradiction", "Preservar una contradiccion", "Represent conflicting attributes and identify what evidence could resolve them.", "Representer des attributs contradictoires et les preuves qui pourraient les resoudre.", "Representar atributos contradictorios y la evidencia que podria resolverlos.", "A contradiction record that avoids forced consensus.", "Un registre de contradiction sans consensus force.", "Un registro de contradiccion sin consenso forzado."),
    ("fnp-qnn", "Define a simulator run", "Definir une execution du simulateur", "Definir una ejecucion del simulador", "Specify inputs, seed, configuration, expected artifacts, and non-claims before execution.", "Specifier entrees, seed, configuration, artefacts et non-affirmations avant execution.", "Especificar entradas, semilla, configuracion, artefactos y no-afirmaciones antes de ejecutar.", "A frozen run manifest ready for human approval.", "Un manifeste gele pret pour approbation humaine.", "Un manifiesto congelado listo para aprobacion humana."),
    ("fnp-qnn", "Compare two simulator runs", "Comparer deux executions", "Comparar dos ejecuciones", "Compare configurations using identical inputs and separate observation from interpretation.", "Comparer les configurations avec entrees identiques et separer observation et interpretation.", "Comparar configuraciones con entradas identicas y separar observacion e interpretacion.", "A difference table with reproducibility metadata.", "Un tableau de differences avec metadonnees de reproduction.", "Una tabla de diferencias con metadatos de reproduccion."),
    ("fnp-qnn", "Inspect the TUI workflow", "Inspecter le flux TUI", "Inspeccionar el flujo TUI", "Verify that the terminal interface exposes state, errors, provenance, and safe exits.", "Verifier que le terminal expose etat, erreurs, provenance et sortie sure.", "Verificar que la terminal muestre estado, errores, procedencia y salida segura.", "A keyboard and state-transition QA report.", "Un rapport QA clavier et transitions d'etat.", "Un informe QA de teclado y transiciones de estado."),
    ("fnpqnn-gateway", "Validate a gateway command", "Valider une commande gateway", "Validar un comando gateway", "Check command inputs, schema, error behavior, output, and replay path.", "Verifier entrees, schema, erreurs, sortie et chemin de replay.", "Verificar entradas, esquema, errores, salida y ruta de repeticion.", "A command contract with one positive and one negative case.", "Un contrat de commande avec un cas positif et negatif.", "Un contrato de comando con un caso positivo y uno negativo."),
    ("fnpqnn-gateway", "Review an MCP boundary", "Reviser une frontiere MCP", "Revisar una frontera MCP", "Confirm that tools expose real capabilities, scoped inputs, errors, and no embedded secrets.", "Confirmer outils reels, entrees bornees, erreurs et absence de secrets.", "Confirmar capacidades reales, entradas acotadas, errores y ausencia de secretos.", "An MCP capability and risk register.", "Un registre de capacites et risques MCP.", "Un registro de capacidades y riesgos MCP."),
    ("retailguard", "Build a defensive retail scenario", "Construire un scenario defensif", "Construir un escenario defensivo", "Create a synthetic prevention scenario with no operational attack instructions.", "Creer un scenario synthetique de prevention sans instructions d'attaque.", "Crear un escenario sintetico de prevencion sin instrucciones de ataque.", "A supervised scenario, safeguards, and debrief questions.", "Un scenario supervise, protections et questions de retour.", "Un escenario supervisado, protecciones y preguntas de revision."),
    ("retailguard", "Audit defensive evidence", "Auditer une preuve defensive", "Auditar evidencia defensiva", "Check provenance, alternative explanations, uncertainty, and escalation criteria.", "Verifier provenance, explications alternatives, incertitude et escalade.", "Verificar procedencia, explicaciones alternativas, incertidumbre y escalamiento.", "An evidence table that does not accuse a person.", "Un tableau de preuve sans accusation de personne.", "Una tabla de evidencia sin acusar a una persona."),
    ("quanthor", "Formalize an informal claim", "Formaliser une affirmation", "Formalizar una afirmacion", "Extract definitions, variables, quantifiers, assumptions, and the target statement.", "Extraire definitions, variables, quantificateurs, hypotheses et cible.", "Extraer definiciones, variables, cuantificadores, supuestos y objetivo.", "A draft formal statement with unresolved terms.", "Un enonce formel provisoire avec termes non resolus.", "Un enunciado formal provisional con terminos no resueltos."),
    ("quanthor", "Review a proof route", "Reviser une route de preuve", "Revisar una ruta de prueba", "Check each inference, dependency, counterexample risk, and missing justification.", "Verifier inference, dependance, contre-exemple et justification manquante.", "Verificar inferencia, dependencia, contraejemplo y justificacion faltante.", "A proof-obligation ledger, not a theorem claim.", "Un registre d'obligations, pas une affirmation de theoreme.", "Un registro de obligaciones, no una afirmacion de teorema."),
    ("quanthor", "Use HippoRAG as evidence support", "Utiliser HippoRAG comme support", "Usar HippoRAG como apoyo", "Retrieve relevant source paths and keep retrieval separate from formal validity.", "Recuperer les sources et separer retrieval de validite formelle.", "Recuperar fuentes y separar recuperacion de validez formal.", "A cited retrieval trace and independent proof obligations.", "Une trace citee et des obligations de preuve independantes.", "Una traza citada y obligaciones de prueba independientes."),
    ("scholarium", "Create a source record", "Creer une fiche source", "Crear un registro de fuente", "Capture author, date, identifier, URL, scope, claims, and access conditions.", "Capturer auteur, date, identifiant, URL, portee, affirmations et acces.", "Capturar autor, fecha, identificador, URL, alcance, afirmaciones y acceso.", "A reusable source record with provenance.", "Une fiche source reutilisable avec provenance.", "Un registro reutilizable con procedencia."),
    ("scholarium", "Prepare a publication route", "Preparer une route de publication", "Preparar una ruta de publicacion", "Map one approved artifact to language, platform, canonical URL, and review state.", "Relier un artefact approuve a langue, plateforme, URL canonique et revue.", "Relacionar un artefacto aprobado con idioma, plataforma, URL y revision.", "A route that remains blocked until human approval.", "Une route bloquee jusqu'a approbation humaine.", "Una ruta bloqueada hasta aprobacion humana."),
    ("synthia", "Create a candidate memory", "Creer une memoire candidate", "Crear una memoria candidata", "Transform evidence into a candidate record with source, uncertainty, and authority boundary.", "Transformer une preuve en candidat avec source, incertitude et limite d'autorite.", "Transformar evidencia en candidato con fuente, incertidumbre y limite de autoridad.", "A traceable candidate, not an accepted fact.", "Un candidat tracable, pas un fait accepte.", "Un candidato trazable, no un hecho aceptado."),
    ("synthia", "Audit lexical provenance", "Auditer la provenance lexicale", "Auditar la procedencia lexica", "Preserve I -> I_system^S -> H_lex -> G_lex -> I_lexicon and identify every transformation.", "Preserver I -> I_system^S -> H_lex -> G_lex -> I_lexicon et chaque transformation.", "Preservar I -> I_system^S -> H_lex -> G_lex -> I_lexicon y cada transformacion.", "A complete lexical trace with no collapsed layer.", "Une trace lexicale complete sans couche ecrasee.", "Una traza lexica completa sin capas colapsadas."),
    ("synthia", "Quarantine conflicting taxonomy", "Mettre une taxonomie en quarantaine", "Poner una taxonomia en cuarentena", "Record conflicting labels, authorities, dates, and evidence without selecting a winner.", "Consigner labels, autorites, dates et preuves sans choisir un gagnant.", "Registrar etiquetas, autoridades, fechas y evidencia sin elegir ganador.", "A quarantined contradiction and resolution requirements.", "Une contradiction en quarantaine et conditions de resolution.", "Una contradiccion en cuarentena y requisitos de resolucion."),
    ("tesla-workbench", "Recover a structured record", "Recuperer un dossier structure", "Recuperar un registro estructurado", "Extract a historical or computational record with source boundaries and missing fields.", "Extraire un dossier historique ou computationnel avec sources et champs manquants.", "Extraer un registro historico o computacional con fuentes y campos faltantes.", "A recovery manifest that marks every unknown.", "Un manifeste de recuperation qui marque chaque inconnu.", "Un manifiesto de recuperacion que marca cada dato desconocido."),
    ("tesla-workbench", "Compare resonance records", "Comparer des dossiers de resonance", "Comparar registros de resonancia", "Compare normalized parameters while preserving incompatible units and contexts.", "Comparer les parametres normalises en conservant unites et contextes incompatibles.", "Comparar parametros normalizados preservando unidades y contextos incompatibles.", "A comparison table with explicit incompatibilities.", "Un tableau comparatif avec incompatibilites explicites.", "Una tabla comparativa con incompatibilidades explicitas."),
    ("vot-guardian", "Review a defensive threat signal", "Reviser un signal defensif", "Revisar una senal defensiva", "Assess a synthetic signal using provenance, alternatives, confidence, and human escalation.", "Evaluer un signal synthetique avec provenance, alternatives, confiance et escalade.", "Evaluar una senal sintetica con procedencia, alternativas, confianza y escalamiento.", "A defensive review that makes no autonomous accusation.", "Une revue defensive sans accusation autonome.", "Una revision defensiva sin acusacion autonoma."),
    ("vot-guardian", "Explain a security decision", "Expliquer une decision securite", "Explicar una decision de seguridad", "Translate a decision trace into evidence, uncertainty, rejected alternatives, and operator action.", "Traduire une trace en preuves, incertitude, alternatives et action operateur.", "Traducir una traza en evidencia, incertidumbre, alternativas y accion del operador.", "A concise explanation suitable for supervised training.", "Une explication concise pour formation supervisee.", "Una explicacion concisa para formacion supervisada."),
    ("visual-algorithm-designer", "Draft an algorithm canvas", "Ebaucher un canevas algorithmique", "Bosquejar un lienzo algoritmico", "Turn a workflow into typed nodes, ports, edges, constraints, and observable outputs.", "Transformer un flux en noeuds types, ports, liens, contraintes et sorties.", "Convertir un flujo en nodos tipados, puertos, enlaces, restricciones y salidas.", "A canvas specification ready for implementation.", "Une specification de canevas prete a implementer.", "Una especificacion de lienzo lista para implementar."),
    ("visual-algorithm-designer", "Design a reusable subpipeline", "Concevoir un sous-pipeline", "Disenar un subpipeline reutilizable", "Define inputs, outputs, invariants, failure behavior, and reuse boundaries.", "Definir entrees, sorties, invariants, erreurs et frontieres de reutilisation.", "Definir entradas, salidas, invariantes, errores y limites de reutilizacion.", "A versioned subpipeline contract and tests.", "Un contrat de sous-pipeline versionne et ses tests.", "Un contrato de subpipeline versionado y sus pruebas."),
    ("visual-algorithm-designer", "Validate a visual workflow", "Valider un flux visuel", "Validar un flujo visual", "Check graph integrity, unreachable nodes, cycles, invalid ports, and test coverage.", "Verifier integrite, noeuds inaccessibles, cycles, ports invalides et tests.", "Verificar integridad, nodos inaccesibles, ciclos, puertos invalidos y pruebas.", "A defect list ranked by operational impact.", "Une liste de defauts classee par impact.", "Una lista de defectos ordenada por impacto."),
    ("scholarium", "Design a cross-tool workflow", "Concevoir un flux multi-outils", "Disenar un flujo entre herramientas", "Connect tools only through declared inputs, outputs, provenance, and human gates.", "Relier les outils seulement par entrees, sorties, provenance et controles declares.", "Conectar herramientas solo mediante entradas, salidas, procedencia y controles declarados.", "A sequence diagram with no imaginary connector.", "Un diagramme de sequence sans connecteur imaginaire.", "Un diagrama de secuencia sin conectores imaginarios."),
    ("scholarium", "Place a human approval gate", "Placer un controle humain", "Colocar un control humano", "Identify the consequential action, required evidence, authorized reviewer, and refusal path.", "Identifier action consequente, preuves, reviseur autorise et refus.", "Identificar accion consecuente, evidencia, revisor autorizado y rechazo.", "An approval contract that defaults to no action.", "Un contrat d'approbation qui bloque par defaut.", "Un contrato de aprobacion que bloquea por defecto."),
    ("scholarium", "Test degraded behavior", "Tester le mode degrade", "Probar el modo degradado", "Remove one dependency and observe errors, fallback, data integrity, and recovery.", "Retirer une dependance et observer erreurs, fallback, integrite et reprise.", "Quitar una dependencia y observar errores, fallback, integridad y recuperacion.", "A failure-injection report with no hidden retry.", "Un rapport de panne sans retry cache.", "Un informe de fallo sin reintento oculto."),
    ("scholarium", "Audit secret boundaries", "Auditer les frontieres de secrets", "Auditar limites de secretos", "Scan prompts, docs, logs, examples, and output for credentials or private paths.", "Scanner prompts, docs, logs, exemples et sorties pour secrets et chemins prives.", "Escanear prompts, docs, logs, ejemplos y salidas por secretos y rutas privadas.", "A redacted finding list and remediation evidence.", "Une liste expurgee et les preuves de correction.", "Una lista redactada y evidencia de correccion."),
    ("scholarium", "Review accessibility", "Reviser l'accessibilite", "Revisar la accesibilidad", "Test keyboard, focus, names, contrast, motion, zoom, and mobile text fit.", "Tester clavier, focus, noms, contraste, mouvement, zoom et texte mobile.", "Probar teclado, foco, nombres, contraste, movimiento, zoom y texto movil.", "An accessibility report with viewport evidence.", "Un rapport accessibilite avec preuves par viewport.", "Un informe de accesibilidad con evidencia por viewport."),
    ("scholarium", "Prepare release evidence", "Preparer les preuves de release", "Preparar evidencia de lanzamiento", "Collect commit, build, tests, security scan, screenshots, limits, and rollback.", "Rassembler commit, build, tests, scan, captures, limites et rollback.", "Reunir commit, build, pruebas, escaneo, capturas, limites y rollback.", "A release dossier that supports an approval decision.", "Un dossier de release pour decision d'approbation.", "Un dossier de lanzamiento para decidir aprobacion."),
    ("scholarium", "Publish portfolio evidence", "Publier une preuve portfolio", "Publicar evidencia de portafolio", "Convert validated work into a concise public claim linked to the artifact and its limits.", "Transformer un travail valide en affirmation publique liee a l'artefact et ses limites.", "Convertir trabajo validado en afirmacion publica vinculada al artefacto y sus limites.", "A declarative portfolio entry with direct proof links.", "Une entree portfolio declarative avec liens de preuve.", "Una entrada de portafolio declarativa con enlaces de evidencia."),
]


LANGUAGES = {
    "English": {
        "objective": "Objective", "inputs": "Required inputs", "work": "Bounded work", "output": "Required output", "validate": "Validation", "stop": "HUMAN STOP",
        "input_text": "Provide the repository or artifact, exact goal, constraints, and evidence already available.",
        "validate_text": "Return COMPLETED, NEEDS_INPUT, QUARANTINED, or BLOCKED. Cite files, commands, URLs, and observed results.",
        "stop_text": "Stop before publishing, spending, deleting, changing remote state, exposing a secret, or promoting an unverified claim.",
    },
    "Francais": {
        "objective": "Objectif", "inputs": "Entrees requises", "work": "Travail borne", "output": "Sortie obligatoire", "validate": "Validation", "stop": "HUMAN STOP",
        "input_text": "Fournir le depot ou l'artefact, l'objectif exact, les contraintes et les preuves deja disponibles.",
        "validate_text": "Retourner COMPLETED, NEEDS_INPUT, QUARANTINED ou BLOCKED. Citer fichiers, commandes, URL et resultats observes.",
        "stop_text": "Arreter avant publication, depense, suppression, changement distant, exposition de secret ou promotion d'une affirmation non verifiee.",
    },
    "Espanol": {
        "objective": "Objetivo", "inputs": "Entradas requeridas", "work": "Trabajo acotado", "output": "Salida obligatoria", "validate": "Validacion", "stop": "HUMAN STOP",
        "input_text": "Proporcionar el repositorio o artefacto, objetivo exacto, restricciones y evidencia disponible.",
        "validate_text": "Devolver COMPLETED, NEEDS_INPUT, QUARANTINED o BLOCKED. Citar archivos, comandos, URL y resultados observados.",
        "stop_text": "Detenerse antes de publicar, gastar, borrar, cambiar estado remoto, exponer secretos o promover afirmaciones no verificadas.",
    },
}


def render_language(label: str, objective: str, mission: str, evidence: str) -> str:
    text = LANGUAGES[label]
    return f"""## {label}

**{text['objective']}.** {objective}

```text
TOOL: {{tool}}

{text['inputs'].upper()}
{text['input_text']}

{text['work'].upper()}
{mission}

{text['output'].upper()}
{evidence}

{text['validate'].upper()}
{text['validate_text']}

{text['stop']}
{text['stop_text']}
```
"""


def classify_prompt(title: str, evidence: str) -> dict[str, str]:
    text = f"{title} {evidence}".lower()

    if any(word in text for word in ("teacher", "learner", "training", "accessibility")):
        role = "educator"
    elif any(word in text for word in ("defensive", "security", "secret", "threat")):
        role = "security-operator"
    elif any(word in text for word in ("proof", "claim", "source", "taxonomy", "resonance")):
        role = "researcher"
    elif any(word in text for word in ("publication", "portfolio", "release")):
        role = "publisher"
    elif any(word in text for word in ("audit", "review", "test", "compare", "inspect")):
        role = "reviewer"
    elif any(word in text for word in ("algorithm", "command", "mcp", "workflow", "subpipeline")):
        role = "developer"
    else:
        role = "operator"

    if any(word in text for word in ("cross-tool", "mcp", "proof", "degraded", "secret", "taxonomy")):
        difficulty = "advanced"
    elif any(word in text for word in ("choose", "create a source", "define a simulator", "draft an algorithm")):
        difficulty = "foundation"
    else:
        difficulty = "intermediate"

    task_rules = (
        ("audit", ("audit", "review", "inspect")),
        ("validation", ("validate", "test", "compare", "evaluate")),
        ("planning", ("plan", "choose", "prepare")),
        ("design", ("design", "draft", "model", "formalize")),
        ("documentation", ("explain", "record", "publish")),
    )
    task_type = next((name for name, words in task_rules if any(word in text for word in words)), "operation")

    result_rules = (
        ("report", ("report", "finding", "defect", "review")),
        ("contract", ("contract", "specification", "rubric")),
        ("manifest", ("manifest", "receipt")),
        ("trace", ("trace", "ledger")),
        ("plan", ("plan", "route")),
        ("decision", ("choice", "decision")),
        ("record", ("record", "table")),
        ("diagram", ("diagram", "canvas", "graph")),
    )
    result_type = next((name for name, words in result_rules if any(word in text for word in words)), "artifact")
    return {"role": role, "difficulty": difficulty, "task_type": task_type, "result_type": result_type}


def render_index(records: list[dict[str, object]]) -> str:
    lines = [
        "# Collaboration prompt library",
        "",
        "Forty trilingual collaboration contracts tied to real suite tools and explicit human stop points.",
        "",
        '<div class="se-filter-panel" data-se-filter-panel="prompts"></div>',
        '<p class="se-filter-count" data-se-filter-count="prompts" aria-live="polite"></p>',
        '<div class="se-prompt-grid" data-se-filter-grid="prompts">',
    ]
    for record in records:
        title = record["title"]
        lines.extend(
            [
                (
                    f'<a class="se-prompt-card" href="{record["id"]}.html" '
                    f'data-tool="{record["tool"]}" data-role="{record["role"]}" '
                    f'data-difficulty="{record["difficulty"]}" data-task-type="{record["task_type"]}" '
                    f'data-result-type="{record["result_type"]}" '
                    f'data-title-en="{title["en"]}" data-title-fr="{title["fr"]}" data-title-es="{title["es"]}">'
                ),
                f'  <span class="se-prompt-id">{record["id"]}</span>',
                f'  <strong>{title["en"]}</strong>',
                f'  <small>{record["tool"]} · {record["role"]} · {record["difficulty"]}</small>',
                "</a>",
            ]
        )
    lines.extend(["</div>", "", "```{toctree}", ":maxdepth: 1", ":hidden:", ""])
    lines.extend(str(record["id"]) for record in records)
    lines.extend(["```", ""])
    return "\n".join(lines)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []
    for number, item in enumerate(PROMPTS, 1):
        tool, title_en, title_fr, title_es, mission_en, mission_fr, mission_es, evidence_en, evidence_fr, evidence_es = item
        prompt_id = f"CP-{number:02d}"
        page = f"# {prompt_id} - {title_en}\n\n**Tool:** `{tool}`\n\n"
        page += render_language("English", title_en, mission_en, evidence_en)
        page += "\n" + render_language("Francais", title_fr, mission_fr, evidence_fr)
        page += "\n" + render_language("Espanol", title_es, mission_es, evidence_es)
        page = page.replace("{tool}", tool)
        (OUTPUT / f"{prompt_id}.md").write_text(page, encoding="utf-8", newline="\n")
        metadata = classify_prompt(title_en, evidence_en)
        records.append(
            {
                "id": prompt_id,
                "tool": tool,
                "title": {"en": title_en, "fr": title_fr, "es": title_es},
                "expected_result": {"en": evidence_en, "fr": evidence_fr, "es": evidence_es},
                **metadata,
            }
        )
    (OUTPUT / "index.md").write_text(render_index(records), encoding="utf-8", newline="\n")
    DATA.write_text(json.dumps({"schema": "securedme.collaboration-prompts.v2", "prompts": records}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Generated {len(records)} trilingual collaboration contracts")


if __name__ == "__main__":
    main()
