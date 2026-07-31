"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type SafetyContext = {
  organizationId: string;
  role: string;
};

type SafetyCase = {
  id: string;
  organizationId: string;
  subjectType: string;
  subjectId: string | null;
  category: string;
  proposedSeverity: string;
  status: string;
  policyVersion: string;
  telemetryStatus: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  resolutionCode: string | null;
  hasOwner: boolean;
  assignedToCurrentUser: boolean;
};

type SafetyCaseDetail = {
  case: SafetyCase;
  events: Array<{
    actorRole: string;
    createdAt: string;
    fromState: string | null;
    rationaleCode: string;
    sequence: number;
    toState: string;
  }>;
  appeals: Array<{
    createdAt: string;
    outcomeCode: string | null;
    reviewedAt: string | null;
    status: string;
  }>;
  allowedTransitions: string[];
};

const categoryLabels: Record<string, string> = {
  harassment: "Harcèlement",
  personal_data: "Données personnelles",
  unsafe: "Situation non sécuritaire",
  spam: "Contenu indésirable",
  copyright: "Droit d’auteur",
  other: "Autre",
};

const stateLabels: Record<string, string> = {
  received: "Reçu",
  triaged: "Trié",
  assigned: "Attribué",
  under_review: "En revue",
  action_pending: "Action humaine en attente",
  resolved: "Résolu",
  appealed: "En recours",
  closed: "Fermé",
  urgent_escalation: "Escalade urgente",
  insufficient_information: "Information requise",
  duplicate: "Doublon",
  withdrawn: "Retiré",
  telemetry_degraded: "Télémétrie dégradée",
};

async function responsePayload(response: Response) {
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "SCHOOL_SAFETY_REQUEST_FAILED");
  return payload;
}

function friendlyStatus(code: string) {
  if (code === "SCHOOL_SAFETY_CASES_DISABLED") return "Le dossier jeunesse est prêt, mais reste fermé pendant la validation pré-alpha.";
  if (code === "SYNTHETIC_SCHOOL_POLICY_REQUIRED") return "Cette organisation n’a pas encore de politique synthétique active.";
  if (code === "ACTIVE_SCHOOL_REPORTER_ROLE_REQUIRED") return "Un rôle scolaire actif dans cette organisation est requis.";
  if (code === "SCHOOL_SAFETY_VERSION_CONFLICT") return "Le dossier a changé. Il vient d’être rechargé; vérifiez avant de réessayer.";
  if (code === "SECOND_ADMINISTRATOR_REQUIRED") return "Ce recours exige un second administrateur indépendant.";
  if (code === "CASE_ASSIGNED_TO_ANOTHER_ADMINISTRATOR") return "Ce dossier est déjà pris en charge par un autre administrateur.";
  return "La demande n’a pas été enregistrée. Aucun contenu n’a été envoyé ailleurs.";
}

export function TeachSafetyPanel({ authenticated }: { authenticated: boolean }) {
  const [contexts, setContexts] = useState<SafetyContext[]>([]);
  const [cases, setCases] = useState<SafetyCase[]>([]);
  const [detail, setDetail] = useState<SafetyCaseDetail | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [status, setStatus] = useState("Chargement du canal privé.");
  const [busy, setBusy] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [category, setCategory] = useState("unsafe");
  const [severity, setSeverity] = useState("standard");
  const [subjectType, setSubjectType] = useState("general");
  const [subjectId, setSubjectId] = useState("");
  const [summary, setSummary] = useState("");
  const [toState, setToState] = useState("");
  const [rationaleCode, setRationaleCode] = useState("");
  const [rationale, setRationale] = useState("");
  const [appealRationale, setAppealRationale] = useState("");

  const reporterContexts = useMemo(
    () => contexts.filter((context) => context.role === "student" || context.role === "teacher"),
    [contexts],
  );
  const administrativeContexts = useMemo(
    () => contexts.filter((context) => ["administrator", "school_admin", "commission_admin"].includes(context.role)),
    [contexts],
  );

  async function loadCases(preferredCaseId?: string) {
    if (!authenticated) {
      setStatus("Connectez-vous pour utiliser le canal privé.");
      return;
    }
    try {
      const payload = await responsePayload(await fetch("/api/v1/teach/safety-cases", {
        headers: { Accept: "application/json" },
      }));
      const nextContexts = Array.isArray(payload.contexts) ? payload.contexts as SafetyContext[] : [];
      const nextCases = Array.isArray(payload.cases) ? payload.cases as SafetyCase[] : [];
      setContexts(nextContexts);
      setCases(nextCases);
      setOrganizationId((current) => current || nextContexts.find((context) => context.role === "student" || context.role === "teacher")?.organizationId || "");
      setStatus(nextCases.length ? "Dossiers privés chargés." : "Aucun dossier privé dans vos organisations autorisées.");
      const caseId = preferredCaseId || selectedCaseId;
      if (caseId && nextCases.some((item) => item.id === caseId)) await loadDetail(caseId);
    } catch (error) {
      setContexts([]);
      setCases([]);
      setDetail(null);
      setStatus(friendlyStatus(error instanceof Error ? error.message : ""));
    }
  }

  async function loadDetail(caseId: string) {
    setSelectedCaseId(caseId);
    try {
      const payload = await responsePayload(await fetch("/api/v1/teach/safety-cases/" + encodeURIComponent(caseId), {
        headers: { Accept: "application/json" },
      })) as unknown as SafetyCaseDetail;
      setDetail(payload);
      setToState(payload.allowedTransitions[0] ?? "");
      setStatus("Dossier chargé sans preuve brute.");
    } catch (error) {
      setDetail(null);
      setStatus(friendlyStatus(error instanceof Error ? error.message : ""));
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCases(), 0);
    return () => window.clearTimeout(timer);
    // The authenticated boundary is the only automatic reload trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = await responsePayload(await fetch("/api/v1/teach/safety-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          subjectType,
          subjectId: subjectType === "general" ? null : subjectId,
          category,
          proposedSeverity: severity,
          summary,
          idempotencyKey: crypto.randomUUID(),
        }),
      })) as { case?: SafetyCase };
      setSummary("");
      setSubjectId("");
      setStatus("Signalement reçu. Une personne autorisée devra l’examiner.");
      await loadCases(payload.case?.id);
    } catch (error) {
      setStatus(friendlyStatus(error instanceof Error ? error.message : ""));
    } finally {
      setBusy(false);
    }
  }

  async function transitionCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !toState) return;
    setBusy(true);
    try {
      await responsePayload(await fetch("/api/v1/teach/safety-cases/" + encodeURIComponent(detail.case.id) + "/transitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toState,
          rationaleCode,
          rationale,
          expectedVersion: detail.case.version,
          idempotencyKey: crypto.randomUUID(),
        }),
      }));
      setRationale("");
      setRationaleCode("");
      setStatus("Transition humaine enregistrée et auditée.");
      await loadCases(detail.case.id);
    } catch (error) {
      setStatus(friendlyStatus(error instanceof Error ? error.message : ""));
      await loadCases(detail.case.id);
    } finally {
      setBusy(false);
    }
  }

  async function appealCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setBusy(true);
    try {
      await responsePayload(await fetch("/api/v1/teach/safety-cases/" + encodeURIComponent(detail.case.id) + "/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rationale: appealRationale,
          expectedVersion: detail.case.version,
          idempotencyKey: crypto.randomUUID(),
        }),
      }));
      setAppealRationale("");
      setStatus("Recours reçu. Un second administrateur devra le revoir.");
      await loadCases(detail.case.id);
    } catch (error) {
      setStatus(friendlyStatus(error instanceof Error ? error.message : ""));
      await loadCases(detail.case.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="teach-safety-panel" role="tabpanel" className="teach-dashboard-band teach-safety-panel" aria-labelledby="teach-safety-title">
      <header>
        <p className="teach-eyebrow">CANAL PRIVÉ · REVUE HUMAINE</p>
        <h1 id="teach-safety-title">Aide et sécurité scolaire</h1>
        <p>Une priorité proposée n’est jamais un verdict. Le contenu sensible reste privé dans Scholarium et aucune sanction n’est automatique.</p>
      </header>

      <p className="teach-safety-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>

      {!authenticated && <div className="teach-auth-required">
        <p>Une session Scholarium est requise. Aucun signalement anonyme contenant des données de mineur n’est accepté ici.</p>
        <a href="/app">Se connecter</a>
      </div>}

      {authenticated && <div className="teach-safety-grid">
        <section className="teach-safety-card" aria-labelledby="teach-safety-report-title">
          <h2 id="teach-safety-report-title">Faire un signalement privé</h2>
          {reporterContexts.length === 0 ? <p>Votre compte ne possède pas de rôle élève ou enseignant dans une organisation synthétique autorisée.</p> : <form onSubmit={createCase}>
            <label>Organisation synthétique
              <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
                {reporterContexts.map((context) => <option key={context.organizationId + context.role} value={context.organizationId}>{context.organizationId} · {context.role}</option>)}
              </select>
            </label>
            <label>Type de situation
              <select value={subjectType} onChange={(event) => setSubjectType(event.target.value)}>
                <option value="general">Situation générale</option>
                <option value="publication">Publication</option>
                <option value="comment">Commentaire</option>
                <option value="teach_session">Session Teach</option>
              </select>
            </label>
            {subjectType !== "general" && <label>Référence opaque
              <input value={subjectId} onChange={(event) => setSubjectId(event.target.value)} minLength={8} maxLength={200} required />
            </label>}
            <label>Catégorie
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Priorité proposée
              <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
                <option value="standard">Standard</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <label>Ce qui s’est passé
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={20} maxLength={1200} rows={6} required aria-describedby="teach-safety-evidence-note" />
            </label>
            <small id="teach-safety-evidence-note">N’inscrivez aucune clé, mot de passe ou donnée réelle de mineur pendant la pré-alpha.</small>
            <button type="submit" disabled={busy}>Envoyer au canal privé</button>
          </form>}
        </section>

        <section className="teach-safety-card" aria-labelledby="teach-safety-list-title">
          <h2 id="teach-safety-list-title">Suivi et file autorisée</h2>
          {administrativeContexts.length > 0 && <p className="teach-authority-note">Mode administrateur : seuls les dossiers de vos organisations sont visibles, sans preuve brute.</p>}
          {cases.length === 0 ? <p>Aucun dossier accessible.</p> : <ul className="teach-safety-case-list">
            {cases.map((item) => <li key={item.id}>
              <button type="button" className={selectedCaseId === item.id ? "active" : ""} onClick={() => void loadDetail(item.id)}>
                <span>{stateLabels[item.status] ?? item.status}</span>
                <strong>{categoryLabels[item.category] ?? item.category}</strong>
                <small>{item.proposedSeverity} · v{item.version} · {item.hasOwner ? item.assignedToCurrentUser ? "attribué à vous" : "attribué" : "non attribué"}</small>
              </button>
            </li>)}
          </ul>}
        </section>
      </div>}

      {authenticated && detail && <section className="teach-safety-card teach-safety-detail" aria-labelledby="teach-safety-detail-title">
        <h2 id="teach-safety-detail-title">Dossier {detail.case.id.slice(0, 12)}</h2>
        <dl>
          <div><dt>État</dt><dd>{stateLabels[detail.case.status] ?? detail.case.status}</dd></div>
          <div><dt>Priorité proposée</dt><dd>{detail.case.proposedSeverity}</dd></div>
          <div><dt>Politique</dt><dd>{detail.case.policyVersion}</dd></div>
          <div><dt>Télémétrie</dt><dd>{detail.case.telemetryStatus}</dd></div>
        </dl>
        <ol className="teach-safety-timeline" aria-label="Historique append-only">
          {detail.events.map((event) => <li key={event.sequence}>
            <strong>{event.sequence}. {stateLabels[event.toState] ?? event.toState}</strong>
            <span>{event.rationaleCode} · {event.actorRole}</span>
            <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("fr-CA")}</time>
          </li>)}
        </ol>

        {administrativeContexts.some((context) => context.organizationId === detail.case.organizationId) && detail.allowedTransitions.filter((state) => state !== "appealed").length > 0 && <form onSubmit={transitionCase} className="teach-safety-action">
          <h3>Action administrative humaine</h3>
          <label>Transition
            <select value={toState} onChange={(event) => setToState(event.target.value)} required>
              {detail.allowedTransitions.filter((state) => state !== "appealed").map((state) => <option key={state} value={state}>{stateLabels[state] ?? state}</option>)}
            </select>
          </label>
          <label>Code de motif
            <input value={rationaleCode} onChange={(event) => setRationaleCode(event.target.value)} minLength={3} maxLength={80} required />
          </label>
          <label>Motif humain
            <textarea value={rationale} onChange={(event) => setRationale(event.target.value)} minLength={20} maxLength={800} rows={4} required />
          </label>
          <button type="submit" disabled={busy || !toState}>Enregistrer la transition</button>
        </form>}

        {detail.allowedTransitions.includes("appealed") && <form onSubmit={appealCase} className="teach-safety-action">
          <h3>Demander un recours</h3>
          <p>Le recours ne sera pas revu par l’administrateur ayant rendu la résolution.</p>
          <label>Pourquoi demander une nouvelle revue?
            <textarea value={appealRationale} onChange={(event) => setAppealRationale(event.target.value)} minLength={40} maxLength={1200} rows={5} required />
          </label>
          <button type="submit" disabled={busy}>Déposer le recours</button>
        </form>}
      </section>}
    </section>
  );
}
