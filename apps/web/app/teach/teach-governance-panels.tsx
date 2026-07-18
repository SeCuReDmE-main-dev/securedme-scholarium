"use client";

import { useEffect, useState } from "react";

type ConsentPurpose = "learning" | "personalization" | "profiling" | "sharing" | "media";
type Consent = { id: string; purpose: ConsentPurpose; status: string; expiresAt: string | null; updatedAt: string };

const purposeLabels: Record<ConsentPurpose, string> = {
  learning: "Apprentissage",
  personalization: "Personnalisation",
  profiling: "Profil de forces",
  sharing: "Partage",
  media: "Media",
};

const sourceStages = [
  { name: "Sources primaires", value: "125 cartes tracees", accent: "cyan" },
  { name: "Synthia", value: "Classification avec provenance", accent: "violet" },
  { name: "MemoryLake", value: "Index central", accent: "blue" },
  { name: "HippoRAG", value: "Recuperation seulement", accent: "cyan" },
  { name: "Gate5", value: "Adaptateurs prives", accent: "gold" },
];

async function responsePayload<T>(response: Response) {
  const payload = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "La requete n'a pas abouti.");
  return payload;
}

export function TeachSourcesPanel() {
  return <section id="teach-sources-panel" role="tabpanel" className="teach-dashboard-band teach-governance-band">
    <header><p className="teach-eyebrow">SOURCES ET PROVENANCE</p><h1>Le chemin de chaque preuve</h1></header>
    <div className="teach-source-pipeline" aria-label="Scholarium knowledge source pipeline">
      {sourceStages.map((stage, index) => <article key={stage.name} data-accent={stage.accent}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <div><h2>{stage.name}</h2><p>{stage.value}</p></div>
      </article>)}
    </div>
    <section className="teach-source-register" aria-labelledby="source-register-title">
      <div><p className="teach-eyebrow">CORPUS EDUCATION</p><h2 id="source-register-title">Registre approuve</h2></div>
      <dl>
        <div><dt>Partitions</dt><dd>Approuve · Preparation · Quarantaine</dd></div>
        <div><dt>Trace</dt><dd>Auteur · URL · Date · Licence · Citation</dd></div>
        <div><dt>Graphe</dt><dd>Entites · Relations · Contradictions</dd></div>
        <div><dt>Autorite</dt><dd>Revue humaine requise</dd></div>
      </dl>
    </section>
    <p className="teach-authority-note">Une source rejetee ou sans provenance ne traverse pas le graphe approuve. Synthia classe et trace; elle ne decide pas seule de la valeur pedagogique.</p>
  </section>;
}

export function TeachAdministrationPanel({ authenticated }: { authenticated: boolean }) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [supported, setSupported] = useState<ConsentPurpose[]>(Object.keys(purposeLabels) as ConsentPurpose[]);
  const [loading, setLoading] = useState(authenticated);
  const [saving, setSaving] = useState<ConsentPurpose | null>(null);
  const [notice, setNotice] = useState("");

  async function loadConsents() {
    setLoading(true);
    try {
      const payload = await fetch("/api/v1/teach/consents").then((response) => responsePayload<{ consents: Consent[]; supportedPurposes: ConsentPurpose[] }>(response));
      setConsents(payload.consents);
      setSupported(payload.supportedPurposes);
      setNotice("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Consentements indisponibles."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void loadConsents(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated]);

  async function setConsent(purpose: ConsentPurpose, granted: boolean) {
    setSaving(purpose);
    try {
      const response = granted
        ? await fetch("/api/v1/teach/consents", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose }) })
        : await fetch(`/api/v1/teach/consents?purpose=${encodeURIComponent(purpose)}`, { method: "DELETE" });
      await responsePayload(response);
      await loadConsents();
      setNotice(granted ? `${purposeLabels[purpose]} active.` : `${purposeLabels[purpose]} retire.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Modification non enregistree."); }
    finally { setSaving(null); }
  }

  const consentFor = (purpose: ConsentPurpose) => consents.find((consent) => consent.purpose === purpose && consent.status === "granted");

  return <section id="teach-administration-panel" role="tabpanel" className="teach-dashboard-band teach-governance-band">
    <header><p className="teach-eyebrow">CONTROLES</p><h1>Consentements et cycle de vie</h1></header>
    {!authenticated && <div className="teach-auth-required" role="status"><p>Une connexion est requise pour modifier les consentements du compte.</p><a className="primary" href="/app">Se connecter</a></div>}
    {loading && <p className="teach-loading" role="status">Chargement...</p>}
    {notice && <p className="teach-status" role="status" aria-live="polite">{notice}</p>}
    {authenticated && !loading && <div className="teach-consent-list">
      {supported.map((purpose) => {
        const active = Boolean(consentFor(purpose));
        return <label key={purpose}>
          <span><strong>{purposeLabels[purpose]}</strong><small>{active ? "Accorde" : "Non accorde"}</small></span>
          <input type="checkbox" role="switch" checked={active} disabled={saving === purpose} onChange={(event) => void setConsent(purpose, event.target.checked)} aria-label={`${purposeLabels[purpose]}: ${active ? "retirer" : "accorder"}`} />
        </label>;
      })}
    </div>}
    <div className="teach-lifecycle-actions">
      <a href="/api/v1/account/export">Exporter mes donnees</a>
      <a href="/app">Accès et correction</a>
      <a href="/privacy">Politique de confidentialite</a>
    </div>
    <p className="teach-authority-note">Les donnees brutes, observations, interpretations, recommandations et decisions humaines restent des categories distinctes.</p>
  </section>;
}
