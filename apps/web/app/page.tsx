import type { Metadata } from "next";
import { ScholariumControls } from "./components/scholarium-controls";
import "./landing-evidence.css";

export const metadata: Metadata = {
  title: "Scholarium — Knowledge with a visible history",
  description: "A public pre-alpha commons for publishing research and learning artifacts with sources, versions, provenance, and human review.",
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
    <div className="sch-institutional-strip"><span>SECUREDME EDUCATION</span><strong>Knowledge deserves context.</strong><span>PUBLIC PRE-ALPHA</span></div>
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
      <div className="sch-hero-visual" aria-label="Scholarium editorial identity">
        <img src="/brand/campaigns/landing-hero-dark.webp" alt="A luminous Scholarium archive device surrounded by knowledge traces." />
        <div className="sch-visual-caption"><span>01 / SCHOLARIUM COMMONS</span><strong>Context is part of the work.</strong></div>
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
