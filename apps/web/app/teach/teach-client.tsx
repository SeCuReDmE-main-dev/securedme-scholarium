"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  assistanceLevels,
  assistancePayload,
  defaultTeachAccessibilitySettings,
  evaluateLearningAttempt,
  soccerMathBridge,
  spanishStarterLesson,
  teachAccessibilitySettingsContract,
  type AssistanceLevel,
  type MasteryState,
  type TeachAccessibilitySettings,
} from "../../lib/teach-contracts";
import { TeachAccessibilityPanel } from "./teach-accessibility-panel";
import { TeachAdministrationPanel, TeachSourcesPanel } from "./teach-governance-panels";
import { TeachPortfolioPanel, TeachStatisticsPanel } from "./teach-social-panels";
import { ScholariumControls } from "../components/scholarium-controls";

type ObjectiveProgress = { attempts: number; state: MasteryState };
type ProgressMap = Record<string, ObjectiveProgress>;
type View = "learn" | "teacher" | "strengths" | "portfolio" | "statistics" | "sources" | "administration";

const viewByHash: Record<string, View> = {
  "#administration": "administration",
  "#circles": "portfolio",
  "#cours": "learn",
  "#forces": "strengths",
  "#portfolio": "portfolio",
  "#projects": "portfolio",
  "#sources": "sources",
  "#statistics": "statistics",
  "#teacher": "teacher",
};
const hashByView: Record<View, string> = {
  administration: "#administration",
  learn: "#cours",
  portfolio: "#portfolio",
  sources: "#sources",
  statistics: "#statistics",
  strengths: "#forces",
  teacher: "#teacher",
};

const checkpointKey = "scholarium.teach.spanish.checkpoint.v1";
const initialProgress = Object.fromEntries(spanishStarterLesson.objectives.map((objective) => [objective.id, { attempts: 0, state: "new" }])) as ProgressMap;
const initialCheckpoint = {
  accessibility: defaultTeachAccessibilitySettings,
  answer: "",
  assistanceLevel: "wait" as AssistanceLevel,
  objectiveIndex: 0,
  progress: initialProgress,
  showPhonetic: true,
  showTranslation: true,
};

function storedCheckpoint() {
  if (typeof window === "undefined") return initialCheckpoint;
  try {
    const stored = window.localStorage.getItem(checkpointKey);
    if (!stored) return initialCheckpoint;
    const checkpoint = JSON.parse(stored) as Partial<typeof initialCheckpoint> & {
      calmMode?: unknown;
      largeTargets?: unknown;
      reducedMotion?: unknown;
    };
    const storedAccessibility = checkpoint.accessibility && typeof checkpoint.accessibility === "object"
      ? checkpoint.accessibility
      : {};
    const legacyProfiles = {
      ...defaultTeachAccessibilitySettings.profiles,
      autismCalm: checkpoint.calmMode === true,
      dyspraxiaMotor: checkpoint.largeTargets === true,
    };
    return {
      ...initialCheckpoint,
      ...checkpoint,
      accessibility: teachAccessibilitySettingsContract({
        ...storedAccessibility,
        motion: checkpoint.reducedMotion === true ? "reduced" : (storedAccessibility as Partial<TeachAccessibilitySettings>).motion,
        profiles: {
          ...legacyProfiles,
          ...((storedAccessibility as Partial<TeachAccessibilitySettings>).profiles ?? {}),
        },
      }),
      assistanceLevel: checkpoint.assistanceLevel && assistanceLevels.includes(checkpoint.assistanceLevel) ? checkpoint.assistanceLevel : initialCheckpoint.assistanceLevel,
      objectiveIndex: Number.isInteger(checkpoint.objectiveIndex) ? Math.min(spanishStarterLesson.objectives.length - 1, Math.max(0, checkpoint.objectiveIndex ?? 0)) : 0,
      progress: checkpoint.progress ? { ...initialProgress, ...checkpoint.progress } : initialProgress,
    };
  } catch {
    return initialCheckpoint;
  }
}

const stateLabels: Record<MasteryState, string> = {
  new: "Nouvelle", guided: "Guidée", recalled: "Rappelée", contextualized: "Contextualisée", mastered: "Maîtrisée", review: "À revoir",
};

export function TeachClient({ authenticated = false }: { authenticated?: boolean }) {
  const [sessionAuthenticated, setSessionAuthenticated] = useState(authenticated);
  const [view, setView] = useState<View>("learn");
  const [accessibility, setAccessibility] = useState<TeachAccessibilitySettings>(initialCheckpoint.accessibility);
  const [objectiveIndex, setObjectiveIndex] = useState(initialCheckpoint.objectiveIndex);
  const [answer, setAnswer] = useState(initialCheckpoint.answer);
  const [assistanceLevel, setAssistanceLevel] = useState<AssistanceLevel>(initialCheckpoint.assistanceLevel);
  const [progress, setProgress] = useState<ProgressMap>(initialCheckpoint.progress);
  const [status, setStatus] = useState("Prêt pour une première tentative.");
  const [showTranslation, setShowTranslation] = useState(initialCheckpoint.showTranslation);
  const [showPhonetic, setShowPhonetic] = useState(initialCheckpoint.showPhonetic);
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => Date.now());
  const [persistenceAvailable, setPersistenceAvailable] = useState(false);
  const [checkpointLoaded, setCheckpointLoaded] = useState(false);
  const [online, setOnline] = useState(true);
  const [sprintRemainingSeconds, setSprintRemainingSeconds] = useState(defaultTeachAccessibilitySettings.sprintMinutes * 60);
  const [sprintRunning, setSprintRunning] = useState(false);
  const objective = spanishStarterLesson.objectives[objectiveIndex];
  const activeHelp = assistancePayload(objective, assistanceLevel);
  const bridge = useMemo(() => soccerMathBridge(), []);

  useEffect(() => {
    const syncViewFromHash = () => setView(viewByHash[window.location.hash] ?? "learn");
    const hashTimer = window.setTimeout(syncViewFromHash, 0);
    window.addEventListener("hashchange", syncViewFromHash);
    return () => {
      window.clearTimeout(hashTimer);
      window.removeEventListener("hashchange", syncViewFromHash);
    };
  }, []);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const checkpoint = storedCheckpoint();
      setAccessibility(checkpoint.accessibility);
      setObjectiveIndex(checkpoint.objectiveIndex);
      setAnswer(checkpoint.answer);
      setAssistanceLevel(checkpoint.assistanceLevel);
      setProgress(checkpoint.progress);
      setShowTranslation(checkpoint.showTranslation);
      setShowPhonetic(checkpoint.showPhonetic);
      setSprintRemainingSeconds(checkpoint.accessibility.sprintMinutes * 60);
      setAttemptStartedAt(() => Date.now());
      setCheckpointLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!checkpointLoaded) return;
    window.localStorage.setItem(checkpointKey, JSON.stringify({ accessibility, answer, assistanceLevel, objectiveIndex, progress, showPhonetic, showTranslation }));
  }, [accessibility, answer, assistanceLevel, checkpointLoaded, objectiveIndex, progress, showPhonetic, showTranslation]);

  useEffect(() => {
    fetch("/api/account")
      .then((response) => setSessionAuthenticated(response.ok))
      .catch(() => setSessionAuthenticated(false));
  }, []);

  useEffect(() => {
    fetch("/api/v1/teach/lesson")
      .then((response) => response.json())
      .then((payload: { persistenceAvailable?: boolean }) => setPersistenceAvailable(payload.persistenceAvailable === true))
      .catch(() => setPersistenceAvailable(false));
  }, []);

  useEffect(() => {
    const syncOnlineState = () => setOnline(window.navigator.onLine);
    const initialTimer = window.setTimeout(syncOnlineState, 0);
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!sprintRunning || !accessibility.profiles.adhdSprint) return;
    const timer = window.setInterval(() => {
      setSprintRemainingSeconds((remaining) => {
        if (remaining <= 1) {
          setSprintRunning(false);
          return 0;
        }
        return remaining - 1;
      });
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [accessibility.profiles.adhdSprint, sprintRunning]);

  function speak(text: string) {
    if (accessibility.sound === "muted" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = accessibility.speechRate;
    window.speechSynthesis.speak(utterance);
  }

  async function submitAttempt() {
    const responseTimeMs = Date.now() - attemptStartedAt;
    const result = evaluateLearningAttempt({ answer, targetAnswer: objective.answer, assistanceLevel, questionId: objective.question.id, expectedQuestionId: objective.question.id, responseTimeMs });
    setProgress((current) => ({ ...current, [objective.id]: { attempts: current[objective.id].attempts + 1, state: result.nextState } }));
    setStatus(result.answerMatches && result.contextMatched
      ? result.nextState === "mastered" ? "Preuve complète. Cette notion est maîtrisée." : "Bonne association. Un rappel sans aide reste nécessaire."
      : result.errorCode === "question_context_mismatch" ? "Cette réponse appartient à une autre question. La question active reste visible." : "Cette expression n’est pas encore reconstruite. On reprend sans se presser.");

    if (!persistenceAvailable) return;
    try {
      await fetch("/api/v1/teach/lesson", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectiveId: objective.id, questionId: objective.question.id, answer, assistanceLevel, responseTimeMs }),
      });
    } catch {
      // The local checkpoint remains functional while signed-out or offline.
    }
  }

  function openObjective(index: number) {
    setObjectiveIndex(Math.min(spanishStarterLesson.objectives.length - 1, Math.max(0, index)));
    setAnswer("");
    setAssistanceLevel("wait");
    setAttemptStartedAt(() => Date.now());
    setStatus("Nouvelle question active.");
  }

  function nextObjective() {
    openObjective(objectiveIndex + 1);
  }

  function updateAccessibility(next: TeachAccessibilitySettings) {
    if (next.sprintMinutes !== accessibility.sprintMinutes) {
      setSprintRemainingSeconds(next.sprintMinutes * 60);
      setSprintRunning(false);
    }
    if (!next.profiles.adhdSprint) setSprintRunning(false);
    setAccessibility(next);
  }

  function resetSprint() {
    setSprintRunning(false);
    setSprintRemainingSeconds(accessibility.sprintMinutes * 60);
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    const orderedViews: View[] = ["learn", "strengths", "portfolio", "statistics", "sources", "teacher", "administration"];
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % orderedViews.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + orderedViews.length) % orderedViews.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = orderedViews.length - 1;
    else return;

    event.preventDefault();
    const nextView = orderedViews[nextIndex];
    openView(nextView);
    window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-teach-tab="${nextView}"]`)?.focus());
  }

  function openView(nextView: View) {
    setView(nextView);
    window.history.replaceState(null, "", hashByView[nextView]);
  }

  const masteredCount = Object.values(progress).filter((item) => item.state === "mastered").length;
  const attemptedCount = Object.values(progress).filter((item) => item.attempts > 0).length;
  const sprintClock = `${String(Math.floor(sprintRemainingSeconds / 60)).padStart(2, "0")}:${String(sprintRemainingSeconds % 60).padStart(2, "0")}`;
  const accessibilityClasses = [
    accessibility.motion === "reduced" ? "teach-reduced-motion" : "",
    accessibility.profiles.autismCalm ? "teach-calm" : "",
    accessibility.profiles.dyspraxiaMotor ? "teach-large-targets" : "",
    accessibility.profiles.dyslexiaReading ? "teach-dyslexia-reading" : "",
    accessibility.readingMeasure === "narrow" ? "teach-narrow-measure" : "",
    accessibility.readingSpacing === "relaxed" ? "teach-relaxed-reading" : "",
    accessibility.contrast === "high" ? "teach-high-contrast" : "",
    accessibility.saturation === "reduced" ? "teach-reduced-saturation" : "",
    accessibility.density === "reduced" ? "teach-low-density" : "",
  ].filter(Boolean).join(" ");
  const communicationChoices = [objective.answer, "Necesito una pista.", "Puedes repetir, por favor?"];
  const roleSurface = view === "teacher" ? "teacher" : view === "administration" ? "organization" : "student";

  return (
    <main className={`teach-shell teach-role-${roleSurface} ${accessibilityClasses}`.trim()} data-teach-role={roleSurface}>
      <a className="teach-skip-link" href="#active-question" onClick={() => window.setTimeout(() => document.getElementById("active-question")?.focus(), 0)}>Aller a la question</a>
      <header className="teach-topbar">
        {/* Vinext's next/link shim currently duplicates React during hydration on this route. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="teach-brand" href="/"><img src="/brand/education/education-icon.webp" alt="" width="36" height="36" /><span>scholarium <b>teach</b></span></a>
        <nav aria-label="Teach views" role="tablist">
          <button type="button" role="tab" data-teach-tab="learn" tabIndex={view === "learn" ? 0 : -1} aria-selected={view === "learn"} aria-controls="teach-learn-panel" className={view === "learn" ? "active" : ""} onKeyDown={(event) => moveTab(event, 0)} onClick={() => openView("learn")}>Cours</button>
          <button type="button" role="tab" data-teach-tab="strengths" tabIndex={view === "strengths" ? 0 : -1} aria-selected={view === "strengths"} aria-controls="teach-strengths-panel" className={view === "strengths" ? "active" : ""} onKeyDown={(event) => moveTab(event, 1)} onClick={() => openView("strengths")}>Forces</button>
          <button type="button" role="tab" data-teach-tab="portfolio" tabIndex={view === "portfolio" ? 0 : -1} aria-selected={view === "portfolio"} aria-controls="teach-portfolio-panel" className={view === "portfolio" ? "active" : ""} onKeyDown={(event) => moveTab(event, 2)} onClick={() => openView("portfolio")}>Portfolio</button>
          <button type="button" role="tab" data-teach-tab="statistics" tabIndex={view === "statistics" ? 0 : -1} aria-selected={view === "statistics"} aria-controls="teach-statistics-panel" className={view === "statistics" ? "active" : ""} onKeyDown={(event) => moveTab(event, 3)} onClick={() => openView("statistics")}>Statistiques</button>
          <button type="button" role="tab" data-teach-tab="sources" tabIndex={view === "sources" ? 0 : -1} aria-selected={view === "sources"} aria-controls="teach-sources-panel" className={view === "sources" ? "active" : ""} onKeyDown={(event) => moveTab(event, 4)} onClick={() => openView("sources")}>Sources</button>
          <button type="button" role="tab" data-teach-tab="teacher" tabIndex={view === "teacher" ? 0 : -1} aria-selected={view === "teacher"} aria-controls="teach-teacher-panel" className={view === "teacher" ? "active" : ""} onKeyDown={(event) => moveTab(event, 5)} onClick={() => openView("teacher")}>Enseignant</button>
          <button type="button" role="tab" data-teach-tab="administration" tabIndex={view === "administration" ? 0 : -1} aria-selected={view === "administration"} aria-controls="teach-administration-panel" className={view === "administration" ? "active" : ""} onKeyDown={(event) => moveTab(event, 6)} onClick={() => openView("administration")}>Controles</button>
        </nav>
        <div className="teach-header-tools"><ScholariumControls compact /><div className="teach-session-state"><span>{masteredCount}/{spanishStarterLesson.objectives.length}</span><small>maitrisees</small></div></div>
      </header>

      {view === "learn" && <div id="teach-learn-panel" role="tabpanel">
        <section className="teach-context-band">
          <div><p className="teach-eyebrow">ESPAGNOL · CONVERSATION 01</p><h1>{spanishStarterLesson.title}</h1></div>
          <div className="teach-progress-block">
            <span>{objectiveIndex + 1} / {spanishStarterLesson.objectives.length}</span>
            <ol aria-label="Lesson progress">{spanishStarterLesson.objectives.map((item, index) => <li key={item.id} className={`${index === objectiveIndex ? "active" : ""} state-${progress[item.id].state}`}><button type="button" onClick={() => openObjective(index)} aria-label={`Ouvrir la notion ${item.notion}`} aria-current={index === objectiveIndex ? "step" : undefined}>{index + 1}</button></li>)}</ol>
          </div>
        </section>

        <div className="teach-workspace">
          <section className="teach-lesson" aria-labelledby="active-question">
            <div className="teach-question-header">
              <span>{stateLabels[progress[objective.id].state]}</span>
              <button type="button" className="teach-icon-button" onClick={() => speak(objective.prompt)} title="Écouter la question" aria-label="Écouter la question" disabled={accessibility.sound === "muted"}>▶</button>
            </div>
            <h2 id="active-question" tabIndex={-1}>{objective.prompt}</h2>
            {showTranslation && <p className="teach-translation">{objective.translation}</p>}
            {showPhonetic && <p className="teach-phonetic">{objective.phonetic}</p>}

            {accessibility.showTranscript && <section className="teach-transcript" aria-labelledby="teach-transcript-title">
              <h3 id="teach-transcript-title">Transcription et séquence visuelle</h3>
              <p><strong>Question:</strong> {objective.prompt}</p>
              <ol>
                <li>Lire ou écouter la question</li>
                <li>Écrire ou choisir une réponse</li>
                <li>Vérifier, puis revoir au besoin</li>
              </ol>
              {accessibility.profiles.deafSigned && <p className="teach-signed-status">{"Langue signée : contenu humain vérifié non disponible pour cette leçon. Aucun avatar automatique n’est substitué."}</p>}
            </section>}

            {accessibility.profiles.adhdSprint && <section className="teach-sprint" aria-label="ADHD Sprint timer">
              <div><strong>Prochain geste</strong><span>Répondre à la question active</span></div>
              <output aria-label="Temps restant du sprint">{sprintClock}</output>
              <div>
                <button type="button" onClick={() => setSprintRunning((running) => !running)} disabled={sprintRemainingSeconds === 0}>{sprintRunning ? "Pause" : "Démarrer"}</button>
                <button type="button" onClick={resetSprint}>Réinitialiser</button>
              </div>
            </section>}

            {accessibility.profiles.nonVerbal && <section className="teach-choice-board" aria-labelledby="teach-choice-board-title">
              <h3 id="teach-choice-board-title">Tableau de communication</h3>
              <div role="group" aria-label="Choix de réponse">
                {communicationChoices.map((choice) => <button type="button" key={choice} aria-pressed={answer === choice} onClick={() => setAnswer(choice)}>{choice}</button>)}
              </div>
            </section>}

            {accessibility.profiles.touretteSafe && <p className="teach-access-note" role="note">{"Délai, mouvement et vocalisation ne modifient pas l’évaluation."}</p>}
            {accessibility.dataSaver && <p className="teach-access-note" role="status">Mode données réduites actif.</p>}

            <p id="teach-answer-help" className="teach-next-action"><strong>Prochain geste :</strong> répondre à la question active.</p>
            <label className="teach-answer">Ta réponse<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={3} autoComplete="off" aria-describedby="teach-answer-help" /></label>
            <div className="teach-assistance" role="group" aria-label="Assistance used">
              {assistanceLevels.map((level) => <button type="button" key={level} className={assistanceLevel === level ? "active" : ""} aria-pressed={assistanceLevel === level} onClick={() => setAssistanceLevel(level)}>{level.replaceAll("_", " ")}</button>)}
            </div>
            {activeHelp.content.length > 0 && <div className="teach-help" role="note"><strong>Aide active</strong>{activeHelp.content.map((item) => <span key={item}>{item}</span>)}</div>}
            <div className="teach-actions"><button type="button" className="secondary" onClick={() => { setAssistanceLevel("full_model"); speak(objective.answer); }} disabled={accessibility.sound === "muted"}>Écouter le modèle</button><button type="button" className="primary" onClick={() => void submitAttempt()} disabled={!answer.trim()}>Vérifier</button></div>
            <p className="teach-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
            {attemptedCount === spanishStarterLesson.objectives.length && <div className="teach-final-conversation"><strong>Conversation finale</strong><p>{spanishStarterLesson.finalConversation.prompt}</p></div>}
            <button type="button" className="teach-next" onClick={nextObjective} disabled={objectiveIndex === spanishStarterLesson.objectives.length - 1}>Question suivante →</button>
          </section>

          <TeachAccessibilityPanel
            online={online}
            onSettingsChange={updateAccessibility}
            onShowPhoneticChange={setShowPhonetic}
            onShowTranslationChange={setShowTranslation}
            settings={accessibility}
            showPhonetic={showPhonetic}
            showTranslation={showTranslation}
          />
        </div>
      </div>}

      {view === "strengths" && <section id="teach-strengths-panel" role="tabpanel" className="teach-dashboard-band">
        <header><p className="teach-eyebrow">MIROIR DES FORCES</p><h1>{"Une difficulte n'efface pas le reste."}</h1></header>
        <div className="strength-bridge">
          <article><span>Signal scolaire</span><h2>Difficulte actuelle en mathematiques</h2><p>Une note decrit un resultat situe dans le temps.</p></article>
          <div aria-hidden="true">→</div>
          <article><span>Preuve parallele</span><h2>But marque au soccer</h2><p>Lecture du jeu, espace, trajectoire, timing et decision.</p></article>
          <div aria-hidden="true">→</div>
          <article><span>Pont a essayer</span><h2>Angles et strategie spatiale</h2><p>{bridge.statement}</p></article>
        </div>
        <p className="teach-authority-note">{bridge.authorityBoundary}</p>
      </section>}

      {view === "portfolio" && <TeachPortfolioPanel authenticated={sessionAuthenticated} />}
      {view === "statistics" && <TeachStatisticsPanel authenticated={sessionAuthenticated} />}
      {view === "sources" && <TeachSourcesPanel />}
      {view === "administration" && <TeachAdministrationPanel authenticated={sessionAuthenticated} />}

      {view === "teacher" && <section id="teach-teacher-panel" role="tabpanel" className="teach-dashboard-band">
        <header><p className="teach-eyebrow">VUE ENSEIGNANT · DONNEES LOCALES</p><h1>{"Preuves d'apprentissage"}</h1></header>
        <div className="teacher-metrics"><article><strong>{attemptedCount}</strong><span>notions tentees</span></article><article><strong>{masteredCount}</strong><span>notions maitrisees</span></article><article><strong>{Object.values(progress).reduce((sum, item) => sum + item.attempts, 0)}</strong><span>tentatives</span></article><article><strong>{spanishStarterLesson.durationMinutes}</strong><span>minutes planifiees</span></article></div>
        <div className="teacher-objectives">{spanishStarterLesson.objectives.map((item) => <article key={item.id}><div><span>{item.prompt}</span><strong>{stateLabels[progress[item.id].state]}</strong></div><progress max={5} value={Math.min(5, progress[item.id].attempts)} /><small>{progress[item.id].attempts} tentative{progress[item.id].attempts === 1 ? "" : "s"}</small></article>)}</div>
        <p className="teach-authority-note">{"La vue enseignant utilise des preuves structurees. Elle n'expose pas une transcription privee brute et ne remplace pas le jugement pedagogique."}</p>
      </section>}
    </main>
  );
}
