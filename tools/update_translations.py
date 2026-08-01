from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

import polib


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
GETTEXT = ROOT / "build" / "gettext"
LANGUAGES = ("fr", "es")


COMMON = {
    "fr": {
        "Start": "Demarrer",
        "Public status": "Statut public",
        "Interfaces": "Interfaces",
        "Architecture": "Architecture",
        "Data flow": "Flux de donnees",
        "Provenance": "Provenance",
        "Failure behavior": "Comportement en cas d'echec",
        "Interface contract": "Contrat d'interface",
        "Compatibility": "Compatibilite",
        "Operations and contribution": "Exploitation et contribution",
        "Configuration": "Configuration",
        "Testing": "Tests",
        "Troubleshooting": "Depannage",
        "Security and privacy": "Securite et vie privee",
        "Contributing": "Contribuer",
        "Releases": "Versions publiees",
        "Requirements": "Prerequis",
        "Install": "Installer",
        "Verify": "Verifier",
        "Human acceptance": "Acceptation humaine",
        "Tool library": "Bibliotheque des outils",
        "Tool": "Outil",
        "Runtime": "Execution",
        "Status": "Statut",
        "Documentation": "Documentation",
        "Source": "Source",
        "Video library": "Videotheque",
        "Collaboration prompt library": "Bibliotheque des prompts de collaboration",
        "Forty trilingual collaboration contracts tied to real suite tools and explicit human stop points.": "Quarante contrats de collaboration trilingues relies aux outils reels de la suite et a des points d'arret humain explicites.",
        "Start with SeCuReDmE Education in 15 minutes": "Demarrer avec SeCuReDmE Education en 15 minutes",
        "This route teaches the shared operating method. It does not pretend that all twelve tools have the same runtime.": "Ce parcours enseigne la methode d'exploitation commune. Il ne pretend pas que les douze outils utilisent le meme environnement d'execution.",
        "Minutes 0-3: choose a real surface": "Minutes 0-3 : choisir une surface reelle",
        "Open the [tool library](../tools/index.md). Select a browser application for an interactive lesson, or a local, CLI, API, or research surface for inspectable execution. Read the status and boundary before starting.": "Ouvrez la [bibliotheque des outils](../tools/index.md). Choisissez une application web pour une activite interactive, ou une surface locale, CLI, API ou de recherche pour une execution inspectable. Lisez le statut et la limite avant de commencer.",
        "Minutes 3-7: inspect before installing": "Minutes 3-7 : inspecter avant d'installer",
        "Open the selected tool's quickstart and source repository. In a clean checkout, record the active branch and changes:": "Ouvrez le demarrage rapide et le depot source de l'outil choisi. Dans un clone propre, notez la branche active et les modifications :",
        "Use only the installation command committed by that tool. Never paste a password, cookie, private token, or `.env` value into a prompt or tutorial.": "Utilisez seulement la commande d'installation inscrite dans le depot. Ne placez jamais un mot de passe, un cookie, un jeton prive ou une valeur `.env` dans une invite ou un tutoriel.",
        "Minutes 7-12: run one bounded action": "Minutes 7-12 : executer une action bornee",
        "Execute the smallest documented example. Keep the input, command, output path, and test result together. A generated file, screenshot, or model answer is a candidate artifact until the documented validation succeeds.": "Executez le plus petit exemple documente. Conservez ensemble l'entree, la commande, le chemin de sortie et le resultat du test. Un fichier genere, une capture ou une reponse de modele reste un artefact candidat tant que la validation documentee n'a pas reussi.",
        "Minutes 12-15: review and decide": "Minutes 12-15 : reviser et decider",
        "Inspect the result and choose `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED`, or `BLOCKED`. Stop before publishing, spending, deleting, changing remote state, or promoting an unverified scientific or educational claim.": "Inspectez le resultat et choisissez `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` ou `BLOCKED`. Arretez avant de publier, depenser, supprimer, modifier un etat distant ou promouvoir une affirmation scientifique ou pedagogique non verifiee.",
        "Short and long-form videos are indexed together. Historical entries are preserved even when they leave the YouTube feed window; a missing pair or transcript remains visible instead of being invented.": "Les videos courtes et longues sont indexees ensemble. Les entrees historiques sont conservees lorsqu'elles quittent la fenetre du flux YouTube; une paire ou une transcription absente reste visible plutot que d'etre inventee.",
        "Maintenance": "Maintenance",
        "SeCuReDmE Developer Library": "Bibliotheque developpeur SeCuReDmE",
        "Documentation contract": "Contrat documentaire",
        "Public entry point": "Porte d'entree publique",
        "Start with the route that matches your work": "Commencez par la route qui correspond a votre travail",
        "Public technical documentation for the twelve tools in the SeCuReDmE Education suite. The catalogue tells you where to enter; this library explains how each system runs, what it validates, and where human review remains mandatory.": "Documentation technique publique des douze outils de la suite SeCuReDmE Education. Le catalogue indique ou entrer; cette bibliotheque explique comment chaque systeme fonctionne, ce qu'il valide et ou la revision humaine demeure obligatoire.",
        "Generated output, simulations, classifications, and agent suggestions remain reviewable artifacts. They do not become scientific, legal, security, clinical, or editorial authority by themselves.": "Les sorties generees, simulations, classifications et suggestions d'agents restent des artefacts a reviser. Elles ne deviennent pas, a elles seules, une autorite scientifique, juridique, securitaire, clinique ou editoriale.",
        "Every tool documents the same technical surface: status, prerequisites, installation, quickstart, architecture, interfaces, configuration, examples, tests, security, troubleshooting, contribution, releases, and source links. The repository that implements the tool remains authoritative; Scholarium aggregates and validates its public documentation.": "Chaque outil documente la meme surface technique : statut, prerequis, installation, demarrage rapide, architecture, interfaces, configuration, exemples, tests, securite, depannage, contribution, versions et liens source. Le depot qui implemente l'outil demeure la reference; Scholarium agrege et valide sa documentation publique.",
        "The human-facing catalogue remains [SeCuReDmE Education](https://securedme.ca/product/education/). Browser-ready tools open their real application. Local, CLI, API, and research tools open a full technical route instead of a simulated dashboard.": "Le catalogue destine aux personnes demeure [SeCuReDmE Education](https://securedme.ca/product/education/). Les outils web ouvrent leur application reelle. Les outils locaux, CLI, API et de recherche ouvrent une route technique complete plutot qu'un tableau de bord simule.",
        "The Education catalogue is the public entry point. This library exposes the technical contract behind every destination.": "Le catalogue Education est la porte d'entree publique. Cette bibliotheque expose le contrat technique de chaque destination.",
        "Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.": "Consignez le commit du depot, la configuration, les identifiants d'entree, la commande d'execution, l'emplacement de sortie et le resultat de validation. Une capture seule n'est pas un artefact reproductible.",
        "Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.": "Une configuration absente, des dependances indisponibles, une entree invalide et des tests echoues doivent rester visibles. L'outil ne doit pas remplacer un echec par un succes invente.",
        "Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.": "Les entrees doivent etre explicites, les sorties inspectables, les erreurs retournees comme erreurs et les actions externes consequentes approuvees par une personne.",
        "Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.": "Considerez les endpoints, commandes et controles navigateur non documentes comme non pris en charge. Confirmez la version courante du depot avant d'integrer un autre systeme.",
        "Keep secrets outside documentation and source control. Use `.env.example` as the public contract and store real values only in the designated local settings surface.": "Gardez les secrets hors de la documentation et du controle de source. Utilisez `.env.example` comme contrat public et stockez les valeurs reelles uniquement dans la surface locale designee.",
        "Run the repository checks listed in the quickstart. A passing narrow test does not prove unrelated interfaces or scientific claims.": "Executez les controles du depot listes dans le demarrage rapide. La reussite d'un test borne ne prouve ni les interfaces non liees ni des affirmations scientifiques.",
        "Confirm the repository and branch.": "Confirmez le depot et la branche.",
        "Reproduce with the smallest supported input.": "Reproduisez avec la plus petite entree prise en charge.",
        "Capture the exact command and error.": "Consignez la commande et l'erreur exactes.",
        "Check the documented runtime and lockfile.": "Verifiez le runtime documente et le fichier de verrouillage.",
        "Open an issue with secret-free evidence.": "Ouvrez une issue avec des preuves sans secret.",
        "Read `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md`, and the repository license when present. Keep changes bounded and include the checks that justify acceptance.": "Lisez `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md` et la licence du depot lorsqu'ils existent. Gardez les changements bornes et incluez les controles qui justifient leur acceptation.",
        "Use a clean checkout, the runtime declared by the repository, and its committed lockfiles. Confirm the active branch before installing anything.": "Utilisez un clone propre, le runtime declare par le depot et ses fichiers de verrouillage valides. Confirmez la branche active avant toute installation.",
        "Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.": "Inspectez la sortie, les journaux, les resultats de tests et le diff. Acceptez, demandez une correction, placez en quarantaine ou arretez; ne promouvez jamais silencieusement un resultat genere.",
    },
    "es": {
        "Start": "Comenzar",
        "Public status": "Estado publico",
        "Interfaces": "Interfaces",
        "Architecture": "Arquitectura",
        "Data flow": "Flujo de datos",
        "Provenance": "Procedencia",
        "Failure behavior": "Comportamiento ante fallos",
        "Interface contract": "Contrato de interfaz",
        "Compatibility": "Compatibilidad",
        "Operations and contribution": "Operacion y contribucion",
        "Configuration": "Configuracion",
        "Testing": "Pruebas",
        "Troubleshooting": "Solucion de problemas",
        "Security and privacy": "Seguridad y privacidad",
        "Contributing": "Contribuir",
        "Releases": "Versiones publicadas",
        "Requirements": "Requisitos",
        "Install": "Instalar",
        "Verify": "Verificar",
        "Human acceptance": "Aceptacion humana",
        "Tool library": "Biblioteca de herramientas",
        "Tool": "Herramienta",
        "Runtime": "Ejecucion",
        "Status": "Estado",
        "Documentation": "Documentacion",
        "Source": "Fuente",
        "Video library": "Videoteca",
        "Collaboration prompt library": "Biblioteca de prompts de colaboracion",
        "Forty trilingual collaboration contracts tied to real suite tools and explicit human stop points.": "Cuarenta contratos de colaboracion trilingues vinculados a herramientas reales de la suite y a puntos explicitos de control humano.",
        "Start with SeCuReDmE Education in 15 minutes": "Comenzar con SeCuReDmE Education en 15 minutos",
        "This route teaches the shared operating method. It does not pretend that all twelve tools have the same runtime.": "Este recorrido ensena el metodo operativo comun. No pretende que las doce herramientas utilicen el mismo entorno de ejecucion.",
        "Minutes 0-3: choose a real surface": "Minutos 0-3: elegir una superficie real",
        "Open the [tool library](../tools/index.md). Select a browser application for an interactive lesson, or a local, CLI, API, or research surface for inspectable execution. Read the status and boundary before starting.": "Abra la [biblioteca de herramientas](../tools/index.md). Elija una aplicacion web para una actividad interactiva, o una superficie local, CLI, API o de investigacion para una ejecucion inspeccionable. Lea el estado y el limite antes de comenzar.",
        "Minutes 3-7: inspect before installing": "Minutos 3-7: inspeccionar antes de instalar",
        "Open the selected tool's quickstart and source repository. In a clean checkout, record the active branch and changes:": "Abra el inicio rapido y el repositorio fuente de la herramienta elegida. En una copia limpia, registre la rama activa y los cambios:",
        "Use only the installation command committed by that tool. Never paste a password, cookie, private token, or `.env` value into a prompt or tutorial.": "Use solamente el comando de instalacion registrado por la herramienta. Nunca coloque una contrasena, cookie, token privado o valor `.env` en un prompt o tutorial.",
        "Minutes 7-12: run one bounded action": "Minutos 7-12: ejecutar una accion acotada",
        "Execute the smallest documented example. Keep the input, command, output path, and test result together. A generated file, screenshot, or model answer is a candidate artifact until the documented validation succeeds.": "Ejecute el ejemplo documentado mas pequeno. Conserve juntos la entrada, el comando, la ruta de salida y el resultado de prueba. Un archivo generado, una captura o una respuesta del modelo sigue siendo un artefacto candidato hasta que la validacion documentada tenga exito.",
        "Minutes 12-15: review and decide": "Minutos 12-15: revisar y decidir",
        "Inspect the result and choose `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED`, or `BLOCKED`. Stop before publishing, spending, deleting, changing remote state, or promoting an unverified scientific or educational claim.": "Inspeccione el resultado y elija `COMPLETED`, `NEEDS_INPUT`, `QUARANTINED` o `BLOCKED`. Detengase antes de publicar, gastar, borrar, cambiar estado remoto o promover una afirmacion cientifica o educativa no verificada.",
        "Short and long-form videos are indexed together. Historical entries are preserved even when they leave the YouTube feed window; a missing pair or transcript remains visible instead of being invented.": "Los videos cortos y largos se indexan juntos. Las entradas historicas se conservan aunque salgan de la ventana del feed de YouTube; una pareja o transcripcion ausente permanece visible en lugar de inventarse.",
        "Maintenance": "Mantenimiento",
        "SeCuReDmE Developer Library": "Biblioteca para desarrolladores SeCuReDmE",
        "Documentation contract": "Contrato documental",
        "Public entry point": "Punto de entrada publico",
        "Start with the route that matches your work": "Comience por la ruta que corresponde a su trabajo",
        "Public technical documentation for the twelve tools in the SeCuReDmE Education suite. The catalogue tells you where to enter; this library explains how each system runs, what it validates, and where human review remains mandatory.": "Documentacion tecnica publica de las doce herramientas de SeCuReDmE Education. El catalogo indica por donde entrar; esta biblioteca explica como funciona cada sistema, que valida y donde la revision humana sigue siendo obligatoria.",
        "Generated output, simulations, classifications, and agent suggestions remain reviewable artifacts. They do not become scientific, legal, security, clinical, or editorial authority by themselves.": "Las salidas generadas, simulaciones, clasificaciones y sugerencias de agentes siguen siendo artefactos revisables. Por si solas no se convierten en autoridad cientifica, juridica, de seguridad, clinica o editorial.",
        "Every tool documents the same technical surface: status, prerequisites, installation, quickstart, architecture, interfaces, configuration, examples, tests, security, troubleshooting, contribution, releases, and source links. The repository that implements the tool remains authoritative; Scholarium aggregates and validates its public documentation.": "Cada herramienta documenta la misma superficie tecnica: estado, requisitos, instalacion, inicio rapido, arquitectura, interfaces, configuracion, ejemplos, pruebas, seguridad, solucion de problemas, contribucion, versiones y enlaces fuente. El repositorio que implementa la herramienta sigue siendo la referencia; Scholarium agrega y valida su documentacion publica.",
        "The human-facing catalogue remains [SeCuReDmE Education](https://securedme.ca/product/education/). Browser-ready tools open their real application. Local, CLI, API, and research tools open a full technical route instead of a simulated dashboard.": "El catalogo para las personas sigue siendo [SeCuReDmE Education](https://securedme.ca/product/education/). Las herramientas web abren su aplicacion real. Las herramientas locales, CLI, API y de investigacion abren una ruta tecnica completa en vez de un panel simulado.",
        "The Education catalogue is the public entry point. This library exposes the technical contract behind every destination.": "El catalogo Education es el punto de entrada publico. Esta biblioteca expone el contrato tecnico de cada destino.",
        "Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.": "Registre el commit del repositorio, la configuracion, los identificadores de entrada, el comando de ejecucion, la ubicacion de salida y el resultado de validacion. Una captura por si sola no es un artefacto reproducible.",
        "Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.": "La configuracion ausente, las dependencias no disponibles, una entrada invalida y las pruebas fallidas deben seguir visibles. La herramienta no debe reemplazar un fallo por un exito inventado.",
        "Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.": "Las entradas deben ser explicitas, las salidas inspeccionables, los errores devueltos como errores y las acciones externas importantes requieren aprobacion humana.",
        "Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.": "Considere no compatibles los endpoints, comandos y controles del navegador no documentados. Confirme la version actual del repositorio antes de integrar otro sistema.",
        "Keep secrets outside documentation and source control. Use `.env.example` as the public contract and store real values only in the designated local settings surface.": "Mantenga los secretos fuera de la documentacion y del control de codigo. Use `.env.example` como contrato publico y guarde los valores reales solo en la superficie local designada.",
        "Run the repository checks listed in the quickstart. A passing narrow test does not prove unrelated interfaces or scientific claims.": "Ejecute las comprobaciones del repositorio indicadas en el inicio rapido. Una prueba acotada superada no demuestra interfaces no relacionadas ni afirmaciones cientificas.",
        "Confirm the repository and branch.": "Confirme el repositorio y la rama.",
        "Reproduce with the smallest supported input.": "Reproduzca con la entrada compatible mas pequena.",
        "Capture the exact command and error.": "Registre el comando y el error exactos.",
        "Check the documented runtime and lockfile.": "Compruebe el runtime documentado y el archivo de bloqueo.",
        "Open an issue with secret-free evidence.": "Abra una incidencia con evidencia sin secretos.",
        "Read `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md`, and the repository license when present. Keep changes bounded and include the checks that justify acceptance.": "Lea `CONTRIBUTING.md`, `SECURITY.md`, `SAFETY.md` y la licencia del repositorio cuando existan. Mantenga los cambios acotados e incluya las comprobaciones que justifican su aceptacion.",
        "Use a clean checkout, the runtime declared by the repository, and its committed lockfiles. Confirm the active branch before installing anything.": "Use una copia limpia, el runtime declarado por el repositorio y sus archivos de bloqueo confirmados. Confirme la rama activa antes de instalar nada.",
        "Inspect the output, logs, test results, and diff. Accept, request a correction, quarantine, or stop; do not silently promote a generated result.": "Inspeccione la salida, los registros, los resultados de pruebas y el diff. Acepte, solicite una correccion, ponga en cuarentena o detengase; no promueva silenciosamente un resultado generado.",
    },
}


TOOL_TEXT = {
    "Interactive algorithm learning through bounded, inspectable challenges for students and teachers.": ("Apprentissage interactif des algorithmes par des defis bornes et inspectables pour les eleves et les enseignants.", "Aprendizaje interactivo de algoritmos mediante desafios acotados e inspeccionables para estudiantes y docentes."),
    "A React and TypeScript learning client organized around challenges, guided planning, and reviewable learner actions.": ("Un client d'apprentissage React et TypeScript organise autour de defis, d'une planification guidee et d'actions apprenantes revisables.", "Un cliente educativo React y TypeScript organizado en torno a desafios, planificacion guiada y acciones del estudiante revisables."),
    "Learning output is formative evidence. It is not a credential, assessment authority, or autonomous teaching decision.": ("La production d'apprentissage est une preuve formative. Ce n'est ni un titre, ni une autorite d'evaluation, ni une decision pedagogique autonome.", "El resultado de aprendizaje es evidencia formativa. No es una credencial, una autoridad evaluadora ni una decision docente autonoma."),
    "A visual workspace for composing, inspecting, and explaining algorithm structures.": ("Un espace visuel pour composer, inspecter et expliquer des structures algorithmiques.", "Un espacio visual para componer, inspeccionar y explicar estructuras algoritmicas."),
    "A React client and Express service coordinate visual graph editing, persistence, and inspectable algorithm structure.": ("Un client React et un service Express coordonnent l'edition visuelle des graphes, la persistance et une structure algorithmique inspectable.", "Un cliente React y un servicio Express coordinan la edicion visual de grafos, la persistencia y una estructura algoritmica inspeccionable."),
    "The builder supports explanation and experimentation; generated structures remain subject to code review and tests.": ("Le constructeur soutient l'explication et l'experimentation; les structures generees restent soumises a la revue de code et aux tests.", "El constructor facilita la explicacion y la experimentacion; las estructuras generadas siguen sujetas a revision de codigo y pruebas."),
    "A bounded admissibility workbench for structured quantum and logical-computation experiments.": ("Un atelier d'admissibilite borne pour des experiences structurees de calcul quantique et logique.", "Un entorno de admisibilidad acotado para experimentos estructurados de computacion cuantica y logica."),
    "A Python admissibility core is exposed through bounded CLI, API, and browser-facing study surfaces.": ("Un noyau Python d'admissibilite est expose par des surfaces d'etude CLI, API et navigateur bornees.", "Un nucleo Python de admisibilidad se expone mediante superficies de estudio CLI, API y navegador acotadas."),
    "Candidate admission is a software decision trace, not proof of a physical or quantum claim.": ("L'admission d'un candidat est une trace de decision logicielle, pas la preuve d'une affirmation physique ou quantique.", "La admision de un candidato es una traza de decision de software, no una prueba de una afirmacion fisica o cuantica."),
    "A governed local simulator for repeatable mathematical and neural-network experiments.": ("Un simulateur local gouverne pour des experiences mathematiques et neuronales reproductibles.", "Un simulador local gobernado para experimentos matematicos y de redes neuronales repetibles."),
    "A Python simulator core feeds CLI, TUI, API, and optional containerized services while retaining an inspectable event trail.": ("Un noyau de simulation Python alimente CLI, TUI, API et services conteneurises optionnels tout en conservant une piste d'evenements inspectable.", "Un nucleo de simulacion Python alimenta CLI, TUI, API y servicios contenerizados opcionales, conservando una traza de eventos inspeccionable."),
    "Simulation, surrogate output, and numerical agreement do not constitute physical detection or experimental validation.": ("La simulation, une sortie de substitution et un accord numerique ne constituent ni une detection physique ni une validation experimentale.", "La simulacion, una salida sustituta y la concordancia numerica no constituyen deteccion fisica ni validacion experimental."),
    "The shared CLI, MCP, and service boundary for controlled FNP-QNN access.": ("La frontiere partagee CLI, MCP et service pour un acces controle a FNP-QNN.", "La frontera compartida de CLI, MCP y servicio para un acceso controlado a FNP-QNN."),
    "A narrow Python gateway converts reviewed client requests into typed simulator and audit operations.": ("Une passerelle Python etroite convertit les requetes client revisees en operations typees de simulation et d'audit.", "Una pasarela Python limitada convierte solicitudes de cliente revisadas en operaciones tipadas de simulacion y auditoria."),
    "The gateway transports and validates requests; it does not convert model output into scientific authority.": ("La passerelle transporte et valide les requetes; elle ne transforme pas une sortie de modele en autorite scientifique.", "La pasarela transporta y valida solicitudes; no convierte la salida de un modelo en autoridad cientifica."),
    "A defensive retail-security learning environment focused on explainable safeguards and review.": ("Un environnement defensif d'apprentissage de la securite du commerce axe sur des protections explicables et la revision.", "Un entorno defensivo de aprendizaje sobre seguridad minorista centrado en salvaguardas explicables y revision."),
    "Defensive scenarios are converted into reviewable risk signals without exposing offensive automation as a product surface.": ("Les scenarios defensifs sont convertis en signaux de risque revisables sans exposer l'automatisation offensive comme surface produit.", "Los escenarios defensivos se convierten en senales de riesgo revisables sin exponer automatizacion ofensiva como superficie de producto."),
    "RetailGuard is for prevention, simulation, and supervised defensive education only.": ("RetailGuard sert uniquement a la prevention, a la simulation et a l'education defensive supervisee.", "RetailGuard sirve exclusivamente para prevencion, simulacion y educacion defensiva supervisada."),
    "A formalization coach that moves informal mathematical claims toward reviewable structure.": ("Un assistant de formalisation qui transforme des affirmations mathematiques informelles en structures revisables.", "Un asistente de formalizacion que lleva afirmaciones matematicas informales hacia estructuras revisables."),
    "A local editor routes claims through bounded drafting, verification, provenance, and optional retrieval services.": ("Un editeur local achemine les affirmations par une redaction bornee, une verification, une provenance et des services de recuperation optionnels.", "Un editor local dirige las afirmaciones mediante redaccion acotada, verificacion, procedencia y servicios opcionales de recuperacion."),
    "Formalization assistance does not establish a theorem until an accepted proof and qualified review exist.": ("L'aide a la formalisation n'etablit pas un theoreme tant qu'une preuve acceptee et une revue qualifiee n'existent pas.", "La ayuda a la formalizacion no establece un teorema hasta que exista una prueba aceptada y una revision cualificada."),
    "The public education and research commons and the suite documentation aggregator.": ("L'espace public d'education et de recherche ainsi que l'agregateur documentaire de la suite.", "El espacio publico de educacion e investigacion y el agregador documental de la suite."),
    "A public web application and a separate static documentation pipeline share reviewed suite metadata without sharing private state.": ("Une application web publique et une chaine documentaire statique separee partagent les metadonnees revisees de la suite sans partager d'etat prive.", "Una aplicacion web publica y una canalizacion documental estatica separada comparten metadatos revisados de la suite sin compartir estado privado."),
    "Scholarium organizes and publishes reviewed material; it is not an academic, legal, or taxonomic authority.": ("Scholarium organise et publie du materiel revise; il n'est pas une autorite academique, juridique ou taxonomique.", "Scholarium organiza y publica material revisado; no es una autoridad academica, juridica ni taxonomica."),
    "A traceability system for scientific candidate memories, lexicons, sources, and uncertainty.": ("Un systeme de tracabilite pour les memoires candidates scientifiques, les lexiques, les sources et l'incertitude.", "Un sistema de trazabilidad para memorias candidatas cientificas, lexicos, fuentes e incertidumbre."),
    "A Python taxonomy-memory core emits traceable candidate records for human review and optional persistence.": ("Un noyau Python de memoire taxonomique emet des dossiers candidats tracables pour revision humaine et persistance optionnelle.", "Un nucleo Python de memoria taxonomica emite registros candidatos trazables para revision humana y persistencia opcional."),
    "Preserve I -> I_system^S -> H_lex -> G_lex -> I_lexicon; Synthia supports traceability and does not certify taxonomy or science.": ("Preserver I -> I_system^S -> H_lex -> G_lex -> I_lexicon; Synthia soutient la tracabilite et ne certifie ni la taxonomie ni la science.", "Preservar I -> I_system^S -> H_lex -> G_lex -> I_lexicon; Synthia facilita la trazabilidad y no certifica taxonomia ni ciencia."),
    "A reproducible local workbench for recovery, comparison, and validation of resonance records.": ("Un atelier local reproductible pour recuperer, comparer et valider des dossiers de resonance.", "Un entorno local reproducible para recuperar, comparar y validar registros de resonancia."),
    "Local Python modules transform explicit source records into reproducible comparison artifacts.": ("Des modules Python locaux transforment des dossiers source explicites en artefacts de comparaison reproductibles.", "Modulos Python locales transforman registros fuente explicitos en artefactos de comparacion reproducibles."),
    "Recovered records and resonance comparisons remain historical or computational evidence, not physical validation.": ("Les dossiers recuperes et les comparaisons de resonance restent des preuves historiques ou computationnelles, pas une validation physique.", "Los registros recuperados y las comparaciones de resonancia siguen siendo evidencia historica o computacional, no validacion fisica."),
    "A visual editor for assembling, inspecting, testing, and communicating algorithms.": ("Un editeur visuel pour assembler, inspecter, tester et communiquer des algorithmes.", "Un editor visual para ensamblar, inspeccionar, probar y comunicar algoritmos."),
    "A React canvas and backend service coordinate graph editing, subpipeline reuse, explanation, and validation.": ("Un canevas React et un service backend coordonnent l'edition de graphes, la reutilisation de sous-pipelines, l'explication et la validation.", "Un lienzo React y un servicio backend coordinan la edicion de grafos, la reutilizacion de subcanalizaciones, la explicacion y la validacion."),
    "Visual composition does not guarantee algorithmic correctness; tests and code review remain required.": ("La composition visuelle ne garantit pas la correction algorithmique; les tests et la revue de code restent obligatoires.", "La composicion visual no garantiza la correccion algoritmica; las pruebas y la revision de codigo siguen siendo obligatorias."),
    "A defensive cybersecurity training surface for transparent, human-reviewed threat reasoning.": ("Une surface defensive de formation en cybersecurite pour un raisonnement transparent sur les menaces, revise par une personne.", "Una superficie defensiva de formacion en ciberseguridad para un razonamiento transparente sobre amenazas revisado por personas."),
    "A defensive interface organizes scenario evidence, explanations, and human acceptance without autonomous enforcement.": ("Une interface defensive organise les preuves de scenario, les explications et l'acceptation humaine sans application autonome.", "Una interfaz defensiva organiza evidencia de escenarios, explicaciones y aceptacion humana sin aplicacion autonoma."),
    "V.O.T. Guardian must not be used for attack, surveillance, autonomous accusation, or unsupervised enforcement.": ("V.O.T. Guardian ne doit pas servir a l'attaque, la surveillance, l'accusation autonome ou l'application non supervisee.", "V.O.T. Guardian no debe usarse para ataques, vigilancia, acusaciones autonomas ni aplicacion no supervisada."),
}

for source, (fr, es) in TOOL_TEXT.items():
    COMMON["fr"][source] = fr
    COMMON["es"][source] = es


def translate(message: str, language: str) -> str:
    mapping = COMMON[language]
    if message in mapping:
        return mapping[message]
    if message.endswith(" quickstart"):
        suffix = " demarrage rapide" if language == "fr" else " inicio rapido"
        return message.removesuffix(" quickstart") + suffix
    match = re.fullmatch(r"\*\*(.+):\*\* use only through the documented repository route\.", message)
    if match:
        tail = "utiliser uniquement par la route documentee du depot." if language == "fr" else "usar solo mediante la ruta documentada del repositorio."
        return f"**{match.group(1)}:** {tail}"
    match = re.fullmatch(r"\*\*(Runtime|Availability|License|Version):\*\* (.+)", message)
    if match:
        labels = {
            "fr": {"Runtime": "Execution", "Availability": "Disponibilite", "License": "Licence", "Version": "Version"},
            "es": {"Runtime": "Ejecucion", "Availability": "Disponibilidad", "License": "Licencia", "Version": "Version"},
        }
        return f"**{labels[language][match.group(1)]}:** {match.group(2)}"
    if message.startswith("The current public documentation describes "):
        if language == "fr":
            return message.replace("The current public documentation describes", "La documentation publique actuelle decrit").replace(" with status ", " avec le statut ").replace(". Consult the repository history and release notes for changes.", ". Consultez l'historique du depot et les notes de version pour les changements.")
        return message.replace("The current public documentation describes", "La documentacion publica actual describe").replace(" with status ", " con el estado ").replace(". Consult the repository history and release notes for changes.", ". Consulte el historial del repositorio y las notas de version para conocer los cambios.")
    if message.startswith("[Open]("):
        return message.replace("[Open]", "[Ouvrir]" if language == "fr" else "[Abrir]")
    return message


def run(*args: str, env: dict[str, str] | None = None) -> None:
    subprocess.run(args, cwd=ROOT, check=True, env=env)


def extract() -> None:
    env = os.environ.copy()
    env["DOCS_LANGUAGE"] = "en"
    run(sys.executable, "-m", "sphinx", "-E", "-q", "-b", "gettext", str(DOCS), str(GETTEXT), env=env)


def update_catalogs() -> None:
    run(
        sys.executable,
        "-m",
        "sphinx_intl",
        "update",
        "-d",
        str(DOCS / "locales"),
        "-p",
        str(GETTEXT),
        "-l",
        "fr",
        "-l",
        "es",
    )
    for language in LANGUAGES:
        for path in sorted((DOCS / "locales" / language / "LC_MESSAGES").rglob("*.po")):
            catalog = polib.pofile(str(path))
            for entry in catalog:
                if entry.obsolete:
                    continue
                entry.msgstr = translate(entry.msgid, language)
            catalog.save()


def main() -> None:
    extract()
    update_catalogs()
    print("Updated complete French and Spanish gettext catalogs")


if __name__ == "__main__":
    main()
