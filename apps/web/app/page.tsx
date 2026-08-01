import type { Metadata } from "next";
import { ScholariumControls } from "./components/scholarium-controls";
import "./landing-evidence.css";

export const metadata: Metadata = {
  title: "Scholarium — Knowledge with a visible history",
  description: "A public pre-alpha commons for publishing research and learning artifacts with sources, versions, provenance, and human review.",
  alternates: {
    canonical: "/",
    languages: { "fr-CA": "/?lang=fr-CA", "en-CA": "/?lang=en-CA", es: "/?lang=es", "x-default": "/" },
  },
};

const githubUrl = "https://github.com/SeCuReDmE-main-dev/securedme-scholarium";
const workflow = [
  ["01", "Create", "Start with a publication, lesson, project, proof, or field note in your own voice."],
  ["02", "Connect", "Attach sources, contributors, context, versions, and the questions that shaped the work."],
  ["03", "Review", "Keep interpretation and authority human. Structure supports judgment; it never replaces it."],
  ["04", "Publish", "Share a durable public artifact with an explicit visibility state and provenance receipt."],
];

const doors = [
  { className: "student", eyebrow: "SCHOLARIUM COMMONS", title: "Research, publish, and discover", text: "A scholarly social workspace for publications, profiles, collections, discussion, and author-controlled provenance.", href: "/app", action: "Enter the commons" },
  { className: "teacher", eyebrow: "SCHOLARIUM TEACH", title: "Learn with evidence and dignity", text: "A consent-aware learning environment where progress, strengths, sources, and review remain understandable.", href: "/teach", action: "Open Teach" },
  { className: "organization", eyebrow: "FOR ORGANIZATIONS", title: "Plan governed learning spaces", text: "A pre-alpha direction for institutions that need aggregate insight, policy boundaries, and auditable access.", href: "#organizations", action: "Read the boundary" },
];

export default function Home() {
  return <main className="sch-landing" id="top">
    <a className="sch-skip-link" href="#main-content">Skip to content</a>
    <div className="sch-institutional-strip" id="main-content"><span>SECUREDME EDUCATION</span><strong>Knowledge deserves context.</strong><span>PUBLIC PRE-ALPHA</span></div>
    <header className="sch-landing-header">
      <a className="sch-brand" href="#top" aria-label="Scholarium home"><img src="/brand/logos/final/1.webp" alt="" width="46" height="46" /><span><b>Scholarium</b><small>Research commons</small></span></a>
      <nav aria-label="Main navigation"><a href="#commons">Commons</a><a href="#provenance">Provenance</a><a href="#pathways">Pathways</a><a href="#organizations">Organizations</a><a href={githubUrl}>Source</a></nav>
      <div className="sch-header-actions"><ScholariumControls compact /><a className="sch-button sch-button-primary sch-header-enter" href="/app">Enter</a></div>
    </header>

    <section className="sch-hero">
      <div className="sch-hero-copy">
        <p className="sch-kicker">OPEN SCIENCE · OPEN EDUCATION · HUMAN AUTHORITY</p>
        <h1>Knowledge with<br />a visible <em>history.</em></h1>
        <p className="sch-lead">Scholarium is a free research and learning commons where work can travel with its sources, versions, contributors, and context.</p>
        <div className="sch-action-row"><a className="sch-button sch-button-primary" href="/app">Explore Scholarium <span>→</span></a><a className="sch-button sch-button-quiet" href="#provenance">Follow the trace</a></div>
        <div className="sch-proof-line"><span>Public pre-alpha</span><span>Human review remains human</span><span>No pay-to-rank</span></div>
      </div>
      <div className="sch-hero-visual" aria-label="Scholarium commons telemetry visualizer" style={{ background: "rgba(10, 20, 38, 0.92)", border: "1px solid rgba(216, 170, 77, 0.4)", borderRadius: "14px", padding: "20px", boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45)", backdropFilter: "blur(14px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(216, 170, 77, 0.2)", paddingBottom: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#929fb2" }}></span>
            <span style={{ color: "#d8aa4d", fontWeight: "800", fontSize: "11px", letterSpacing: "0.05em" }}>SCHOLARIUM PROVENANCE EXAMPLE</span>
          </div>
          <span style={{ fontSize: "11px", color: "#f7f4ec", fontWeight: "600" }}>Research Commons Telemetry</span>
          <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(216, 170, 77, 0.15)", border: "1px solid rgba(216, 170, 77, 0.35)", color: "#d8aa4d", fontSize: "10px", fontWeight: "800" }}>SAMPLE TRACE</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <div style={{ background: "rgba(18, 30, 52, 0.8)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ color: "#929fb2", fontSize: "10px", textTransform: "uppercase", display: "block" }}>Artifact Gate</span>
            <strong style={{ color: "#d8aa4d", fontFamily: "monospace", fontSize: "13px" }}>NOT EVALUATED</strong>
          </div>
          <div style={{ background: "rgba(18, 30, 52, 0.8)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ color: "#929fb2", fontSize: "10px", textTransform: "uppercase", display: "block" }}>Sources & Version</span>
            <strong style={{ color: "#f7f4ec", fontFamily: "monospace", fontSize: "13px" }}>Example v1.2</strong>
          </div>
          <div style={{ background: "rgba(18, 30, 52, 0.8)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ color: "#929fb2", fontSize: "10px", textTransform: "uppercase", display: "block" }}>Human Review</span>
            <strong style={{ color: "#2cbcff", fontFamily: "monospace", fontSize: "13px" }}>REQUIRED</strong>
          </div>
          <div style={{ background: "rgba(18, 30, 52, 0.8)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <span style={{ color: "#929fb2", fontSize: "10px", textTransform: "uppercase", display: "block" }}>Visibility State</span>
            <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: "13px" }}>DRAFT</strong>
          </div>
        </div>

        <div style={{ borderRadius: "8px", background: "radial-gradient(circle at center, rgba(16, 32, 60, 0.9) 0%, rgba(7, 16, 31, 0.98) 100%)", border: "1px solid rgba(216, 170, 77, 0.2)", padding: "12px", display: "flex", justifyContent: "center" }}>
          <svg viewBox="0 0 460 140" style={{ width: "100%", maxHeight: "150px" }} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Example provenance trace from idea to draft receipt">
            <path d="M 60 70 L 160 35" stroke="rgba(216, 170, 77, 0.5)" strokeWidth="2" fill="none" strokeDasharray="4 2"/>
            <path d="M 60 70 L 160 105" stroke="rgba(216, 170, 77, 0.5)" strokeWidth="2" fill="none"/>
            <path d="M 160 35 L 300 70" stroke="rgba(44, 188, 255, 0.65)" strokeWidth="2.5" fill="none"/>
            <path d="M 160 105 L 300 70" stroke="rgba(216, 170, 77, 0.5)" strokeWidth="2" fill="none"/>
            <path d="M 300 70 L 400 70" stroke="#34d399" strokeWidth="3" fill="none"/>

            <g transform="translate(60, 70)">
              <circle r="20" fill="rgba(10, 20, 38, 0.95)" stroke="#d8aa4d" strokeWidth="2"/>
              <text y="4" textAnchor="middle" fill="#d8aa4d" fontSize="9" fontWeight="bold">Idea Node</text>
            </g>
            <g transform="translate(160, 35)">
              <circle r="18" fill="rgba(10, 20, 38, 0.95)" stroke="#d8aa4d" strokeWidth="1.8"/>
              <text y="4" textAnchor="middle" fill="#f7f4ec" fontSize="8" fontWeight="bold">Sources</text>
            </g>
            <g transform="translate(160, 105)">
              <circle r="18" fill="rgba(10, 20, 38, 0.95)" stroke="#d8aa4d" strokeWidth="1.8"/>
              <text y="4" textAnchor="middle" fill="#f7f4ec" fontSize="8" fontWeight="bold">Version 1.2</text>
            </g>
            <g transform="translate(300, 70)">
              <circle r="20" fill="rgba(16, 32, 60, 0.95)" stroke="#2cbcff" strokeWidth="2.2"/>
              <text y="4" textAnchor="middle" fill="#2cbcff" fontSize="9" fontWeight="bold">Review</text>
            </g>
            <g transform="translate(400, 70)">
              <circle r="22" fill="rgba(10, 25, 45, 0.95)" stroke="#34d399" strokeWidth="2.5"/>
              <text y="4" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">Receipt</text>
            </g>
          </svg>
        </div>
        <div className="sch-visual-caption" style={{ marginTop: "12px" }}><span>01 / SCHOLARIUM COMMONS</span><strong>Context is part of the work.</strong></div>
      </div>
    </section>

    <section className="sch-manifesto" id="commons"><p>What if a publication did not end at the page?</p><h2>Preserve the path between a first question and what the work becomes.</h2><div><span>Sources</span><span>Versions</span><span>Contributors</span><span>Human review</span><span>Provenance</span></div></section>

    <section className="sch-process" id="provenance">
      <header className="sch-section-heading"><div><p className="sch-kicker">A DURABLE KNOWLEDGE TRAIL</p><h2>From an idea to a public artifact.</h2></div><p>Every step stays explicit, contestable, and controlled by the people doing the work.</p></header>
      <div className="sch-process-grid">{workflow.map(([number, title, text]) => <article key={number}><span>{number}</span><div className="sch-process-symbol" aria-hidden="true">{number === "01" ? "✦" : number === "02" ? "⌁" : number === "03" ? "◌" : "◇"}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="sch-receipt-band">
      <div><p className="sch-kicker">PUBLICATION OBJECT</p><h2>The receipt does not claim truth.<br />It records what happened.</h2><p>A Scholarium receipt can preserve a platform event, declared sources, version, visibility, license, and review state. It is not a legal verdict, peer review, or scientific authority.</p></div>
      <article className="sch-receipt"><header><span>RESEARCH ARTIFACT</span><b>PUBLIC EXAMPLE</b></header><h3>Learning geometry through movement</h3><p>A learner-authored project linking spatial strategy, angles, and reflection.</p><dl><div><dt>Version</dt><dd>1.2</dd></div><div><dt>Sources</dt><dd>Attached</dd></div><div><dt>Review</dt><dd>Human review pending</dd></div><div><dt>Visibility</dt><dd>Public</dd></div></dl><footer><span>Provenance trail recorded</span><strong>sch:example:7A91</strong></footer></article>
    </section>

    <section className="sch-pathways" id="pathways"><header className="sch-section-heading"><div><p className="sch-kicker">ONE COMMON PURPOSE · DISTINCT SPACES</p><h2>Choose the surface that matches the work.</h2></div></header><div className="sch-door-grid">{doors.map((door) => <article className={`sch-door ${door.className}`} key={door.title}><p>{door.eyebrow}</p><h3>{door.title}</h3><span>{door.text}</span><a href={door.href}>{door.action} →</a></article>)}</div></section>

    <section className="sch-organization" id="organizations"><div className="sch-org-mark" aria-hidden="true"><span /><span /><span /><b>MIN 10</b></div><div><p className="sch-kicker">ORGANIZATION DIRECTION</p><h2>Governance before dashboards.</h2><p>Organization views are being designed around minimum cohort thresholds, explicit permissions, retention controls, exceptional-access justification, and audit trails. Scholarium is not currently presented as deployed in a school or approved for real minor data.</p></div></section>

    <section className="sch-closing"><p className="sch-kicker">CURIOUS · CONNECTED · EMPOWERING · COLLABORATIVE</p><h2>Make the work easier to follow,<br />without making people easier to rank.</h2><div className="sch-action-row"><a className="sch-button sch-button-primary" href="/app">Enter Scholarium →</a><a className="sch-button sch-button-quiet" href="/teach">Explore Teach</a><a className="sch-text-link" href={githubUrl}>Inspect public source ↗</a></div></section>

    <footer className="sch-footer"><div><a className="sch-brand" href="#top"><img src="/brand/logos/final/1.webp" alt="" width="42" height="42" /><span><b>Scholarium</b><small>by SecuredMe Education</small></span></a><p>Open paths for knowledge, learning, and human-led review.</p></div><nav aria-label="Footer"><a href="/app">Commons</a><a href="/teach">Teach</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://securedme.ca/product/education/">Education</a><a href="mailto:hello@securedme.ca">Contact</a></nav><small>© 2026 SecuredMe. Public pre-alpha.</small></footer>
  </main>;
}
