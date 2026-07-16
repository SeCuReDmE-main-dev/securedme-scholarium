import type { Metadata } from "next";
import "./landing-evidence.css";

export const metadata: Metadata = {
  title: "Scholarium — Turn knowledge into traceable evidence",
  description: "A free social commons for research, learning, and organizational work with context, attribution, provenance, and human authority.",
};

const githubUrl = "https://github.com/SeCuReDmE-main-dev/securedme-scholarium";
const securedmeRootUrl = "https://securedme.ca";
const heroImage = "/brand/campaigns/landing-hero-dark.webp";
const educationBanner = "/brand/education/securedme-education-banner-dark-thin.webp";
const brandMark = "/brand/logos/final/1.webp";

const workflow = [
  { number: "01", title: "Share more than a post", text: "Publish the work, its sources, versions, contributors, and the context that makes it useful." },
  { number: "02", title: "Make form a learning tool", text: "Move from an idea to a structured artifact without surrendering voice or human review." },
  { number: "03", title: "Keep contribution human", text: "Connect people, projects, and evidence without turning reach or payment into authority." },
];

const trustPrinciples = [
  { number: "01", title: "Identity with boundaries", text: "Account actions are authenticated. Provider tokens, identity documents, and biometric material stay outside Scholarium." },
  { number: "02", title: "Provenance first", text: "Receipts preserve a platform event and its source trail without pretending to replace copyright, peer review, or legal authority." },
  { number: "03", title: "Privacy that stays local", text: "Personal insights are user-controlled. Platform monitoring is technical and excludes learner content." },
];

export default function Home() {
  return (
    <main className="ec-page">
      <header className="ec-header">
        <a className="ec-brand" href="#top" aria-label="Scholarium home">
          <img src={brandMark} alt="" width="38" height="38" />
          <span>SCHOLARIUM</span>
        </a>
        <nav aria-label="Landing navigation">
          <a href="#product">Product</a>
          <a href="#workflow">How it works</a>
          <a href="#trust">Trust</a>
          <a href="#organizations">Organizations</a>
          <a href={githubUrl}>Public source</a>
        </nav>
        <a className="ec-header-action" href="/app">Enter Scholarium</a>
      </header>

      <section className="ec-hero" id="top">
        <img className="ec-hero-media" src={heroImage} alt="" aria-hidden="true" />
        <div className="ec-hero-content">
          <p className="ec-kicker">SECUREDME EDUCATION / PUBLIC PRE-ALPHA</p>
          <h1>Scholarium</h1>
          <p className="ec-hero-offer">Turn knowledge into traceable evidence.</p>
          <p className="ec-hero-copy">A free social commons for research, learning, and organizational work, built so publications, people, context, and provenance can remain connected.</p>
          <div className="ec-actions">
            <a className="ec-primary" href="/app">Explore Scholarium <span aria-hidden="true">→</span></a>
            <a className="ec-secondary ec-secondary-dark" href="#workflow">See the workflow</a>
            <a className="ec-text-link" href={githubUrl}>View public source ↗</a>
          </div>
          <p className="ec-status"><span aria-hidden="true" /> Pre-alpha · Human review remains human · No pay-to-rank</p>
        </div>
      </section>

      <section className="ec-promise" id="product">
        <p className="ec-kicker">THE EVIDENCE COMMONS</p>
        <h2>A platform that respects the work and the learner.</h2>
        <p>Scholarium keeps the process around a publication visible: the source, the people, the method, the questions, and the next person who wants to learn from it. Discovery stays free from paid influence.</p>
      </section>

      <section className="ec-workflow" id="workflow" aria-labelledby="workflow-title">
        <div className="ec-section-heading">
          <p className="ec-kicker">THREE-PART WORKFLOW</p>
          <h2 id="workflow-title">From a first thought to durable context.</h2>
        </div>
        <div className="ec-workflow-grid">
          {workflow.map((item) => <article key={item.number}>
            <span>{item.number}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <a href="/app">Open the workspace →</a>
          </article>)}
        </div>
      </section>

      <section className="ec-trust" id="trust">
        <div className="ec-trust-intro">
          <p className="ec-kicker">TRUST BY DESIGN</p>
          <h2>Your work is not a product to be ranked by price.</h2>
          <p>Structure, provenance, accessibility, and transparent preferences belong in the core platform. They are not premium authority signals.</p>
        </div>
        <ol>
          {trustPrinciples.map((item) => <li key={item.number}>
            <span>{item.number}</span>
            <div><h3>{item.title}</h3><p>{item.text}</p></div>
          </li>)}
        </ol>
      </section>

      <section className="ec-artifact" aria-labelledby="artifact-title">
        <div className="ec-artifact-copy">
          <p className="ec-kicker">PUBLICATION OBJECT</p>
          <h2 id="artifact-title">Context travels with the work.</h2>
          <p>A Scholarium artifact can show its author-declared sources, version, license, review state, visibility, and a timestamped platform receipt. Each field remains explicit and contestable.</p>
          <a className="ec-secondary" href="/app">Explore Signal</a>
        </div>
        <article className="ec-receipt" aria-label="Example Scholarium publication receipt">
          <header><span>RESEARCH ARTIFACT</span><b>Public</b></header>
          <h3>Spatial strategies for introductory geometry</h3>
          <p>A classroom project connecting movement, angles, and learner-authored evidence.</p>
          <dl>
            <div><dt>Version</dt><dd>1.2</dd></div>
            <div><dt>License</dt><dd>CC BY-NC 4.0</dd></div>
            <div><dt>Review</dt><dd>Human review pending</dd></div>
            <div><dt>Receipt</dt><dd>sch:teach:7A91</dd></div>
          </dl>
          <footer><span>Source trail attached</span><strong>Provenance recorded</strong></footer>
        </article>
      </section>

      <section className="ec-teach" id="organizations">
        <img src={educationBanner} alt="SecuredMe Education suite" />
        <div>
          <p className="ec-kicker">SCHOLARIUM TEACH</p>
          <h2>Learning evidence without reducing a person to a grade.</h2>
          <p>Teach connects lessons, accessibility preferences, strengths, projects, reminders, and teacher-facing evidence. The learner keeps control over interpretations and sharing.</p>
          <div className="ec-actions">
            <a className="ec-primary" href="/teach">Open Teach <span aria-hidden="true">→</span></a>
            <a className="ec-secondary" href={securedmeRootUrl}>SecuredMe root ↗</a>
          </div>
        </div>
      </section>

      <section className="ec-boundary">
        <p className="ec-kicker">PUBLIC PRE-ALPHA</p>
        <h2>Proof before promotion.</h2>
        <p>Scholarium is in development. Provenance is not a legal verdict, QuaNthoR is not a publishing gatekeeper, and educational assistants do not diagnose or replace professional judgment.</p>
        <div className="ec-actions">
          <a className="ec-primary" href="/app">Enter Scholarium <span aria-hidden="true">→</span></a>
          <a className="ec-secondary" href={githubUrl}>Inspect the source ↗</a>
        </div>
      </section>

      <footer className="ec-footer">
        <a className="ec-brand" href="#top"><img src={brandMark} alt="" width="34" height="34" /><span>SCHOLARIUM</span></a>
        <p>Part of SecuredMe Education. Open learning needs open paths.</p>
        <nav aria-label="Footer navigation"><a href="/app">Product</a><a href="/teach">Teach</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href={githubUrl}>Developers</a></nav>
      </footer>
    </main>
  );
}
