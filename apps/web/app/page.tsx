import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarium — Turn knowledge into traceable evidence",
  description: "A free scientific and educational platform for publishing work with context, attribution, provenance, and a durable knowledge trail.",
};

const githubUrl = "https://github.com/SeCuReDmE-main-dev/securedme-scholarium";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Scholarium home"><span>Ｓ</span>scholarium</a>
        <nav aria-label="Landing navigation"><a href="#how-it-works">How it works</a><a href="#trust">Trust</a><a href="#organizations">For organizations</a></nav>
        <a className="landing-nav-cta" href="/app">Enter Scholarium <span>↗</span></a>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <p className="landing-kicker">SECUREDME EDUCATION / PRE-ALPHA</p>
          <h1>Turn knowledge into<br /><em>traceable evidence.</em></h1>
          <p className="landing-lede">A free social commons for research, learning, and organizational work — built so publications, people, context, and provenance can remain connected.</p>
          <div className="landing-actions"><a className="landing-primary" href="/app">Explore Scholarium <span>→</span></a><a className="landing-secondary" href="#how-it-works">See the workflow</a></div>
          <div className="landing-proof"><span><b>0</b> paid reach controls</span><span><b>10</b> verified platform contracts</span><span><b>12</b> protected app endpoints</span></div>
        </div>
        <div className="landing-signal" aria-label="Example of the Scholarium publication flow">
          <div className="signal-top"><span className="signal-badge">LIVE PRINCIPLE</span><span>◌</span></div>
          <p>From a first thought to a work people can build on.</p>
          <div className="signal-flow"><div><i>01</i><strong>Explain</strong><span>Write in your own voice</span></div><div><i>02</i><strong>Formalize</strong><span>Get a gentle QuaNthoR guide</span></div><div><i>03</i><strong>Publish</strong><span>Keep a provenance receipt</span></div></div>
          <div className="signal-footer"><span>Discovery follows relevance, quality, freshness &amp; variety.</span><b>Never payment.</b></div>
        </div>
      </section>

      <section className="landing-manifesto" id="how-it-works">
        <p className="landing-kicker">THE PROMISE</p><h2>A platform that respects the work <em>and</em> the learner.</h2>
        <p>Scholarium is not another attention market. It is a home for the process behind a publication: the source, the people, the method, the questions, and the next person who wants to learn from it.</p>
      </section>

      <section className="landing-points">
        <article><span className="landing-number">01</span><h3>Share more than a post</h3><p>Publish reports, white papers, books, presentations, datasets, video explainers, and project updates with the context that makes them useful.</p><a href="/app">Open Signal →</a></article>
        <article><span className="landing-number">02</span><h3>Make form a learning tool</h3><p>QuaNthoR helps beginners and experts recognize a clear structure without policing their voice or blocking publication.</p><a href="/app">Meet QuaNthoR →</a></article>
        <article><span className="landing-number">03</span><h3>Keep contribution human</h3><p>Use GitHub when code collaboration belongs there. Scholarium keeps the story, attribution, and learning community around the work.</p><a href={githubUrl}>View the source ↗</a></article>
      </section>

      <section className="landing-trust" id="trust">
        <div><p className="landing-kicker">TRUST BY DESIGN</p><h2>Your work is not a product to be ranked by price.</h2><p>Every person should be able to publish and be discovered without buying visibility. Helpful structure, provenance, safety review, and transparent preferences are part of the platform — not premium unlocks.</p><a className="landing-secondary dark" href="/app">Read the in-app principles</a></div>
        <ul><li><b>01</b><span><strong>Identity with boundaries</strong> Sign in with ChatGPT protects account actions; profile verification never stores ID images or fingerprint data in Scholarium.</span></li><li><b>02</b><span><strong>Provenance first</strong> Publications receive a timestamped receipt. It records the platform event without pretending to replace copyright registration.</span></li><li><b>03</b><span><strong>Privacy that stays local</strong> Optional personal insights remain in the browser. Reliability monitoring is platform-level, never a per-user surveillance container.</span></li></ul>
      </section>

      <section className="landing-builder" id="organizations">
        <div><p className="landing-kicker">ORGANIZATIONAL CONTINUITY</p><h2>Build a research network, not another document archive.</h2><p>Use Scholarium to keep the context behind work visible: who contributed, what was published, and the provenance trail that helps the next team understand what came before.</p></div>
        <div className="builder-card"><span>OPEN, VERIFIABLE BUILDING</span><h3>Make knowledge durable, reviewable, and useful.</h3><p>Explore the public-source application, its protected publication contracts, and the evidence-oriented work still required before a broader organizational rollout.</p><a href={githubUrl}>Review the platform <b>↗</b></a><small>Pre-alpha · public source · no paid ranking path · evidence before attention.</small></div>
      </section>

      <section className="landing-cta"><p className="landing-kicker">START WITH THE WORK</p><h2>Bring a question. Leave with a clearer next step.</h2><p>Explore the pre-alpha with your ChatGPT account, create a role-aware profile, and see how publishing, formalization, and attribution fit together.</p><a className="landing-primary" href="/app">Enter Scholarium <span>→</span></a></section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><span>Ｓ</span>scholarium</a><p>Part of SecuredMe Education. Open learning needs open paths.</p><a href={githubUrl}>Public source ↗</a></footer>
    </main>
  );
}
