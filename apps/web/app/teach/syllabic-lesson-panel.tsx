"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CheckpointProjection, DecisionReceipt } from "../../lib/teach-engine-contracts";

type Card = { nodeId: string; kind: string; prompt: string; target: string; syllables: readonly string[]; audioRef: string | null; pictureAsAnswer: false };
type CardPayload = { cards: Card[]; checkpoint: CheckpointProjection; offlinePolicy: "consultation_only" };
const stageLabels: Record<string, string> = { syllable: "Syllabe", sound: "Son", composition: "Composition", reading: "Lecture", writing: "Écriture" };

export function SyllabicLessonPanel({ authenticated }: { authenticated: boolean }) {
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [answer, setAnswer] = useState("");
  const [pieces, setPieces] = useState<string[]>([]);
  const [status, setStatus] = useState("Chargement du checkpoint canonique…");
  const [busy, setBusy] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const card = payload?.cards[0];
  const stages = useMemo(() => Object.entries(payload?.checkpoint.progress ?? {}), [payload]);

  const load = useCallback(async () => {
    if (!authenticated) { setStatus("Connexion requise pour ouvrir une progression canonique."); return; }
    const response = await fetch("/api/v1/teach/engine/card", { cache: "no-store" });
    if (!response.ok) throw new Error("Le parcours syllabique est temporairement indisponible.");
    setPayload(await response.json() as CardPayload);
    setStartedAt(Date.now()); setAnswer(""); setPieces([]);
    setStatus("Lis, écoute ou compose sans modèle imposé.");
  }, [authenticated]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load().catch((error: Error) => setStatus(error.message)), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-419"; utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }

  function addPiece(piece: string) {
    const next = [...pieces, piece]; setPieces(next); setAnswer(next.join(""));
  }

  async function submit() {
    if (!card || !answer.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/v1/teach/engine/attempt", {
        method: "POST", headers: { "content-type": "application/json", "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ answer, assistance: "none", recallDelaySeconds: 600, recompositionDemonstrated: card.kind === "composition" && pieces.length > 1, transferDemonstrated: card.kind === "reading", readingMasteryDemonstrated: card.kind === "writing", responseTimeMs: Date.now() - startedAt }),
      });
      const result = await response.json() as { receipt?: DecisionReceipt; error?: string };
      if (!response.ok || !result.receipt) throw new Error(result.error ?? "La tentative n’a pas été persistée.");
      setStatus(result.receipt.decision === "advance" ? "Preuve acceptée. Le prochain bloc est ouvert." : result.receipt.decision === "review" ? "Cette preuve demande une révision." : "La progression reste verrouillée jusqu’à une preuve suffisante.");
      await load();
    } catch (error) {
      setStatus(`${error instanceof Error ? error.message : "Moteur indisponible"} Aucune progression n’a changé.`);
    } finally { setBusy(false); }
  }

  return <section id="teach-learn-panel" role="tabpanel" className="syllabic-surface">
    <header className="syllabic-header"><div><p className="teach-eyebrow">CASTELLANO · ES-419</p><h1>La syllabe avant la lettre</h1></div><ol aria-label="Progression syllabique">{stages.map(([nodeId, item]) => <li key={nodeId} className={nodeId === payload?.checkpoint.current_node_id ? "active" : ""}><span>{stageLabels[nodeId.split("-")[0]] ?? nodeId}</span><strong>{item.state}</strong></li>)}</ol></header>
    {!card ? <p className="syllabic-status" role="status">{status}</p> : <div className="syllabic-workspace">
      <article className="syllable-card" aria-labelledby="syllable-prompt"><div className="syllable-corners" aria-hidden="true">{card.syllables.slice(0, 4).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div><p>{stageLabels[card.kind]}</p><h2 id="syllable-prompt">{card.prompt}</h2><strong className="syllable-focus">{card.kind === "writing" ? "?" : card.target}</strong>{card.audioRef && <button type="button" className="syllable-listen" onClick={() => speak(card.target)} aria-label="Écouter la syllabe">▶</button>}</article>
      <section className="syllable-controls" aria-label="Réponse">{card.kind === "composition" && <div className="syllable-builder" role="group" aria-label="Compositeur de syllabes">{card.syllables.map((piece, index) => <button type="button" key={`${piece}-${index}`} onClick={() => addPiece(piece)}>{piece}</button>)}<button type="button" aria-label="Effacer la composition" onClick={() => { setPieces([]); setAnswer(""); }}>↺</button></div>}<label>Ta réponse<input value={answer} onChange={(event) => setAnswer(event.target.value)} autoComplete="off" spellCheck={false} /></label><button type="button" className="primary" onClick={() => void submit()} disabled={busy || !answer.trim()}>{busy ? "Vérification…" : "Vérifier"}</button><p className="syllabic-status" role="status" aria-live="polite">{status}</p><small>D1 conserve le checkpoint. L’écriture reste verrouillée jusqu’à une preuve de lecture.</small></section>
      <aside className="syllable-next" aria-label="Cartes préchargées"><span>Ensuite</span>{payload.cards.slice(1).map((next) => <div key={next.nodeId}><strong>{stageLabels[next.kind]}</strong><small>{next.prompt}</small></div>)}</aside>
    </div>}
  </section>;
}
