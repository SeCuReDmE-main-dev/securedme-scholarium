"use client";

import { useEffect, useState, type FormEvent } from "react";

type ProjectEntry = { id: string; kind: string; label: string; status: string; reference: string };
type Project = { id: string; title: string; summary: string; status: string; entries: ProjectEntry[] };
type Circle = { id: string; kind: string; title: string; purpose: string };
type GrowthStory = { id: string; title: string; domain: string; evidenceRef: string; evidenceStatus: string; visibility: string };
type Recognition = { id: string; category: string; statement: string; evidenceRef: string; status: string };

async function responsePayload<T>(response: Response) {
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "La requete n'a pas abouti.");
  return payload;
}

export function TeachPortfolioPanel({ authenticated }: { authenticated: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [stories, setStories] = useState<GrowthStory[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(authenticated);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [story, setStory] = useState({ title: "", domain: "", context: "", reflection: "", originalExpression: "", suggestedReframe: "", reframeChoice: "keep_original", evidenceRef: "", evidenceKind: "learning", visibility: "private" });
  const [project, setProject] = useState({ title: "", summary: "" });
  const [entry, setEntry] = useState({ projectId: "", kind: "milestone", label: "", reflection: "", reference: "" });
  const [circle, setCircle] = useState({ kind: "interest", title: "", purpose: "" });

  async function loadPortfolio() {
    setLoading(true);
    try {
      const [projectPayload, circlePayload, storyPayload, recognitionPayload] = await Promise.all([
        fetch("/api/v1/teach/projects").then((response) => responsePayload<{ projects: Project[] }>(response)),
        fetch("/api/v1/teach/circles").then((response) => responsePayload<{ circles: Circle[] }>(response)),
        fetch("/api/v1/growth-stories").then((response) => responsePayload<{ stories: GrowthStory[] }>(response)),
        fetch("/api/v1/teach/recognitions").then((response) => responsePayload<{ recognitions: Recognition[] }>(response)),
      ]);
      setProjects(projectPayload.projects);
      setCircles(circlePayload.circles);
      setStories(storyPayload.stories);
      setRecognitions(recognitionPayload.recognitions);
      setEntry((current) => ({ ...current, projectId: current.projectId || projectPayload.projects[0]?.id || "" }));
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Portfolio indisponible."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadPortfolio(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated]);

  async function createStory(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await fetch("/api/v1/growth-stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(story) }).then((response) => responsePayload<{ story: GrowthStory; visibilityAdjusted: boolean }>(response));
      setStories((current) => [payload.story, ...current]);
      setStory((current) => ({ ...current, title: "", context: "", reflection: "", originalExpression: "", suggestedReframe: "", evidenceRef: "" }));
      setNotice(payload.visibilityAdjusted ? "Capsule enregistree avec une visibilite ajustee." : "Capsule enregistree.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Capsule non enregistree."); }
    finally { setSaving(false); }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await fetch("/api/v1/teach/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...project, visibility: "private" }) }).then((response) => responsePayload<{ project: Project }>(response));
      setProjects((current) => [{ ...payload.project, entries: [] }, ...current]);
      setEntry((current) => ({ ...current, projectId: payload.project.id }));
      setProject({ title: "", summary: "" });
      setNotice("Fil de projet cree.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Projet non enregistre."); }
    finally { setSaving(false); }
  }

  async function createEntry(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await fetch("/api/v1/teach/projects/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) }).then((response) => responsePayload<{ entry: ProjectEntry & { projectId: string } }>(response));
      setProjects((current) => current.map((item) => item.id === payload.entry.projectId ? { ...item, entries: [payload.entry, ...item.entries] } : item));
      setEntry((current) => ({ ...current, label: "", reflection: "", reference: "" }));
      setNotice("Etape de projet ajoutee.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Etape non enregistree."); }
    finally { setSaving(false); }
  }

  async function createCircle(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = await fetch("/api/v1/teach/circles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(circle) }).then((response) => responsePayload<{ circle: Circle }>(response));
      setCircles((current) => [payload.circle, ...current]);
      setCircle((current) => ({ ...current, title: "", purpose: "" }));
      setNotice("Cercle cree.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Cercle non enregistre."); }
    finally { setSaving(false); }
  }

  async function buildRecap(period: "weekly" | "monthly" | "quarterly") {
    const end = new Date();
    const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 90;
    const start = new Date(end.getTime() - days * 86_400_000);
    setSaving(true);
    try {
      await fetch("/api/v1/teach/recaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period, periodStart: start.toISOString(), periodEnd: end.toISOString() }) }).then((response) => responsePayload(response));
      setNotice(`Recapitulatif ${period === "weekly" ? "hebdomadaire" : period === "monthly" ? "mensuel" : "trimestriel"} enregistre.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Recapitulatif non enregistre."); }
    finally { setSaving(false); }
  }

  return <section id="teach-portfolio-panel" role="tabpanel" className="teach-dashboard-band teach-social-band">
    <header><p className="teach-eyebrow">PORTFOLIO ET PROJETS</p><h1>Preuves, reflexions et contributions</h1></header>
    {!authenticated && <div className="teach-auth-required" role="status"><p>Une connexion est requise pour charger et enregistrer ton portfolio prive.</p><a className="primary" href="/app">Se connecter</a></div>}
    {notice && <p className="teach-status" role="status" aria-live="polite">{notice}</p>}
    {authenticated && (loading ? <p className="teach-loading" role="status">Chargement...</p> : <>
      <div className="teach-social-columns">
        <form className="teach-social-form" onSubmit={createStory}>
          <h2>Capsule de progression</h2>
          <label>Titre<input required value={story.title} onChange={(event) => setStory({ ...story, title: event.target.value })} /></label>
          <label>Domaine<input required value={story.domain} onChange={(event) => setStory({ ...story, domain: event.target.value })} /></label>
          <label>Contexte<textarea required rows={2} value={story.context} onChange={(event) => setStory({ ...story, context: event.target.value })} /></label>
          <label>Expression originale<textarea rows={2} value={story.originalExpression} onChange={(event) => setStory({ ...story, originalExpression: event.target.value })} /></label>
          <label>Reformulation proposee<textarea rows={2} value={story.suggestedReframe} onChange={(event) => setStory({ ...story, suggestedReframe: event.target.value })} /></label>
          <label>Texte retenu<select value={story.reframeChoice} onChange={(event) => setStory({ ...story, reframeChoice: event.target.value })}><option value="keep_original">Expression originale</option><option value="use_suggestion">Reformulation</option><option value="combine">Expression originale et reflexion</option></select></label>
          <label>Reflexion<textarea required rows={3} value={story.reflection} onChange={(event) => setStory({ ...story, reflection: event.target.value })} /></label>
          <label>Preuve<input value={story.evidenceRef} onChange={(event) => setStory({ ...story, evidenceRef: event.target.value })} placeholder="lesson:, project:, file: ou URL" /></label>
          <div className="teach-form-row"><label>Type<select value={story.evidenceKind} onChange={(event) => setStory({ ...story, evidenceKind: event.target.value })}><option value="learning">Scolaire</option><option value="project">Projet</option><option value="sport">Sport</option><option value="music">Musique</option><option value="art">Art</option><option value="community">Communaute</option><option value="other">Autre</option></select></label><label>Visibilite<select value={story.visibility} onChange={(event) => setStory({ ...story, visibility: event.target.value })}><option value="private">Privee</option><option value="circle">Cercle</option><option value="public">Publique</option></select></label></div>
          <button className="primary" type="submit" disabled={saving}>Enregistrer</button>
        </form>

        <div className="teach-social-stack">
          <form className="teach-social-form" onSubmit={createProject}>
            <h2>Nouveau projet</h2><label>Titre<input required value={project.title} onChange={(event) => setProject({ ...project, title: event.target.value })} /></label><label>But du projet<textarea required rows={3} value={project.summary} onChange={(event) => setProject({ ...project, summary: event.target.value })} /></label><button className="primary" type="submit" disabled={saving}>Creer</button>
          </form>
          <form className="teach-social-form" onSubmit={createEntry}>
            <h2>Nouvelle etape</h2><label>Projet<select required value={entry.projectId} onChange={(event) => setEntry({ ...entry, projectId: event.target.value })}><option value="">Selectionner</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Type<select value={entry.kind} onChange={(event) => setEntry({ ...entry, kind: event.target.value })}><option value="milestone">Jalon</option><option value="version">Version</option><option value="file">Fichier</option><option value="source">Source</option><option value="contribution">Contribution</option></select></label><label>Libelle<input required value={entry.label} onChange={(event) => setEntry({ ...entry, label: event.target.value })} /></label>{["version", "file", "source"].includes(entry.kind) && <label>Reference<input required value={entry.reference} onChange={(event) => setEntry({ ...entry, reference: event.target.value })} /></label>}<label>Reflexion<textarea rows={2} value={entry.reflection} onChange={(event) => setEntry({ ...entry, reflection: event.target.value })} /></label><button className="primary" type="submit" disabled={saving || !entry.projectId}>Ajouter</button>
          </form>
          <form className="teach-social-form" onSubmit={createCircle}>
            <h2>Nouveau cercle</h2><label>Type<select value={circle.kind} onChange={(event) => setCircle({ ...circle, kind: event.target.value })}><option value="class">Classe</option><option value="team">Equipe</option><option value="music">Musique</option><option value="art">Art</option><option value="interest">Interet</option><option value="peer_support">Entraide</option></select></label><label>Nom<input required value={circle.title} onChange={(event) => setCircle({ ...circle, title: event.target.value })} /></label><label>But<textarea required rows={2} value={circle.purpose} onChange={(event) => setCircle({ ...circle, purpose: event.target.value })} /></label><button className="primary" type="submit" disabled={saving}>Creer</button>
          </form>
        </div>
      </div>

      <section className="teach-data-section"><div className="teach-section-heading"><h2>Recapitulatifs</h2><div><button type="button" disabled={saving} onClick={() => void buildRecap("weekly")}>Semaine</button><button type="button" disabled={saving} onClick={() => void buildRecap("monthly")}>Mois</button><button type="button" disabled={saving} onClick={() => void buildRecap("quarterly")}>Trimestre</button></div></div></section>
      <section className="teach-data-section"><h2>Capsules</h2>{stories.length ? <div className="teach-data-list">{stories.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.domain}</span></div><div><span>{item.visibility}</span><small>{item.evidenceRef ? `${item.evidenceStatus} · ${item.evidenceRef}` : "brouillon sans preuve liee"}</small></div></article>)}</div> : <p>Aucune capsule.</p>}</section>
      <section className="teach-data-section"><h2>Projets</h2>{projects.length ? <div className="teach-data-list">{projects.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.summary}</span></div><div><span>{item.status}</span><small>{item.entries.length} etape{item.entries.length === 1 ? "" : "s"}</small></div></article>)}</div> : <p>Aucun projet.</p>}</section>
      <section className="teach-data-section"><h2>Cercles</h2>{circles.length ? <div className="teach-data-list">{circles.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.purpose}</span></div><span>{item.kind}</span></article>)}</div> : <p>Aucun cercle.</p>}</section>
      <section className="teach-data-section"><h2>Reconnaissances recues</h2>{recognitions.length ? <div className="teach-data-list">{recognitions.map((item) => <article key={item.id}><div><strong>{item.category}</strong><span>{item.statement}</span></div><div><span>{item.status}</span><small>{item.evidenceRef}</small></div></article>)}</div> : <p>Aucune reconnaissance.</p>}</section>
    </>)}
  </section>;
}

type DashboardMode = "student" | "teacher" | "organization";

export function TeachStatisticsPanel({ authenticated }: { authenticated: boolean }) {
  const [mode, setMode] = useState<DashboardMode>("student");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(selected: DashboardMode) {
    setMode(selected); setLoading(true); setError(""); setData(null);
    try { setData(await fetch(`/api/v1/teach/dashboard/${selected}`).then((response) => responsePayload<Record<string, unknown>>(response))); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Tableau indisponible."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadDashboard("student"), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated]);
  const mastery = data?.masteryCounts && typeof data.masteryCounts === "object" ? data.masteryCounts as Record<string, number> : {};
  const learners = Array.isArray(data?.learners) ? data.learners as Array<Record<string, unknown>> : [];
  const metrics = data?.metrics && typeof data.metrics === "object" ? data.metrics as Record<string, unknown> : null;

  return <section id="teach-statistics-panel" role="tabpanel" className="teach-dashboard-band teach-social-band">
    <header><p className="teach-eyebrow">STATISTIQUES</p><h1>{mode === "student" ? "Progression personnelle" : mode === "teacher" ? "Interventions pedagogiques" : "Vue ecole ou commission"}</h1></header>
    {!authenticated && <div className="teach-auth-required" role="status"><p>Une connexion est requise pour afficher les statistiques bornees par ton role et tes consentements.</p><a className="primary" href="/app">Se connecter</a></div>}
    {authenticated && <div className="teach-dashboard-switch" role="group" aria-label="Type de tableau"><button type="button" className={mode === "student" ? "active" : ""} onClick={() => void loadDashboard("student")}>Eleve</button><button type="button" className={mode === "teacher" ? "active" : ""} onClick={() => void loadDashboard("teacher")}>Enseignant</button><button type="button" className={mode === "organization" ? "active" : ""} onClick={() => void loadDashboard("organization")}>Ecole / commission</button></div>}
    {loading && <p className="teach-loading" role="status">Chargement...</p>}
    {error && <p className="teach-status" role="alert">{error}</p>}
    {data && mode === "student" && <>
      <div className="teacher-metrics">{Object.entries(mastery).map(([state, value]) => <article key={state}><strong>{value}</strong><span>{state}</span></article>)}</div>
      <DashboardCount label="Rappels" value={data.reminders} /><DashboardCount label="Forces" value={data.strengths} /><DashboardCount label="Projets" value={data.projects} /><DashboardCount label="Preuves de croissance" value={data.growthStories} /><DashboardCount label="Reconnaissances" value={data.recognitions} />
      <DimensionRows comparison={data.comparison} />
    </>}
    {data && mode === "teacher" && <>
      <div className="teacher-metrics"><article><strong>{String(data.courseCount ?? 0)}</strong><span>cours</span></article><article><strong>{String(data.learnerCount ?? 0)}</strong><span>eleves consentants</span></article></div>
      <div className="teacher-objectives">{learners.map((learner) => <article key={String(learner.learnerPseudonym)}><div><span>{String(learner.learnerPseudonym)}</span><strong>{String(learner.activeObjectiveCount ?? 0)} objectifs</strong></div><span>{Array.isArray(learner.confusionCodes) && learner.confusionCodes.length ? learner.confusionCodes.join(", ") : "aucune confusion structuree"}</span><small>{Array.isArray(learner.acceptedStrengthCategories) ? learner.acceptedStrengthCategories.join(", ") : ""}</small></article>)}</div>
    </>}
    {data && mode === "organization" && <>{data.suppressed === true ? <p className="teach-authority-note">Cohorte inferieure au seuil de 10. Les metriques restent masquees.</p> : <><div className="teacher-metrics"><article><strong>{String(data.cohortSize ?? 0)}</strong><span>eleves consentants</span></article><article><strong>{String(data.includedOrganizationCount ?? 0)}</strong><span>organisations incluses</span></article></div>{metrics && <div className="teach-data-list">{Object.entries(metrics).map(([key, value]) => <article key={key}><strong>{key}</strong><span>{typeof value === "object" ? JSON.stringify(value) : String(value)}</span></article>)}</div>}</>}</>}
    {data && <p className="teach-authority-note">{String(data.authorityBoundary ?? "Les donnees sont bornees par le role, le consentement et la taille de cohorte.")}</p>}
  </section>;
}

function DashboardCount({ label, value }: { label: string; value: unknown }) {
  return <section className="teach-count-row"><strong>{Array.isArray(value) ? value.length : 0}</strong><span>{label}</span></section>;
}

function DimensionRows({ comparison }: { comparison: unknown }) {
  const record = comparison && typeof comparison === "object" ? comparison as { dimensions?: Array<{ key: string; label: string; left: number; right: number; provenance: string }> } : {};
  return <section className="teach-data-section"><h2>Lecture multidimensionnelle</h2><div className="teacher-objectives">{(record.dimensions ?? []).map((dimension) => <article key={dimension.key}><div><span>{dimension.label}</span><strong>{dimension.left} / {dimension.right}</strong></div><progress max={Math.max(1, dimension.right)} value={dimension.left} /><small>{dimension.provenance}</small></article>)}</div></section>;
}
