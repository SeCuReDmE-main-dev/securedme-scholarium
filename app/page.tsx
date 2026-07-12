import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarium — Turn knowledge into traceable evidence",
  description: "A free scientific and educational platform for publishing work with context, attribution, provenance, and a durable knowledge trail.",
};

const githubUrl = "https://github.com/SeCuReDmE-main-dev/securedme-scholarium";
const securedmeRootUrl = "https://securedme.ca";
const heroBannerPath = "/brand/campaigns/landing-hero-dark.png";
const logoSystemPath = "/brand/identity/scholarium-logo-system.png";
const iconPackDarkPath = "/brand/icons/scholarium-icon-pack-dark.png";
const suiteBannerPath = "/brand/education/securedme-education-banner-dark-thin.png";
const navBrandMarkPath = "/brand/logos/final/1.png";
const navBadgePreviewPaths = ["/brand/badges/dark/1.png", "/brand/badges/dark/4.png", "/brand/badges/dark/10.png"];
const webBannerPaths = Array.from({ length: 10 }, (_, index) => `/brand/campaigns/web/${index + 1}.png`);
const badgeDarkPaths = Array.from({ length: 10 }, (_, index) => `/brand/badges/dark/${index + 1}.png`);
const badgeLightPaths = Array.from({ length: 10 }, (_, index) => `/brand/badges/light/${index + 1}.png`);
const iconPackPaths = Array.from({ length: 10 }, (_, index) => `/brand/icons/${index + 1}.png`);
const b2bHookPaths = Array.from({ length: 2 }, (_, index) => `/brand/b2b-hooks/${index + 1}.png`);
const logoDraftPaths = Array.from({ length: 2 }, (_, index) => `/brand/logos/draft/${index + 1}.png`);
const finalLogoPath = "/brand/logos/final/1.png";

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="Scholarium home"><img src={navBrandMarkPath} alt="Scholarium official logo." /><span>scholarium</span></a>
        <nav aria-label="Landing navigation"><a href={securedmeRootUrl}>SecuredMe root</a><a href="#how-it-works">How it works</a><a href="#trust">Trust</a><a href="#organizations">For organizations</a></nav>
        <a className="landing-nav-cta" href="/app">Enter Scholarium <span>↗</span></a>
      </header>

      <section className="landing-hero" id="top">
        <div className="landing-hero-copy">
          <p className="landing-kicker">SECUREDME EDUCATION / PRE-ALPHA</p>
          <h1>Turn knowledge into<br /><em>traceable evidence.</em></h1>
          <p className="landing-lede">A free social commons for research, learning, and organizational work — built so publications, people, context, and provenance can remain connected.</p>
          <p className="landing-bridge-copy">Scholarium is the live research-and-learning commons inside the broader <a href={securedmeRootUrl}>SecuredMe public root</a>.</p>
          <div className="landing-brand-panels">
            <img className="landing-brand-board" src={logoSystemPath} alt="Scholarium logo system board from the canonical asset vault." />
            <img className="landing-suite-strip" src={suiteBannerPath} alt="SecuredMe Education suite banner used as the Scholarium endorsement strip." />
            <div className="landing-top-badges" aria-label="Scholarium badge progression preview">
              {navBadgePreviewPaths.map((path, index) => <img key={path} src={path} alt={`Scholarium badge preview stage ${index + 1}.`} />)}
            </div>
          </div>
          <div className="landing-actions"><a className="landing-primary" href="/app">Explore Scholarium <span>→</span></a><a className="landing-secondary" href={securedmeRootUrl}>Back to SecuredMe root</a><a className="landing-secondary" href="#how-it-works">See the workflow</a></div>
          <div className="landing-proof"><span><b>0</b> paid reach controls</span><span><b>10</b> verified platform contracts</span><span><b>12</b> protected app endpoints</span></div>
        </div>
        <div className="landing-visual-stack">
          <img className="landing-hero-art" src={heroBannerPath} alt="Scholarium hero banner using the canonical dark campaign asset." />
          <div className="landing-signal" aria-label="Example of the Scholarium publication flow">
            <div className="signal-top"><span className="signal-badge">LIVE PRINCIPLE</span><span>◌</span></div>
            <p>From a first thought to a work people can build on.</p>
            <div className="signal-flow"><div><i>01</i><strong>Explain</strong><span>Write in your own voice</span></div><div><i>02</i><strong>Formalize</strong><span>Get a gentle QuaNthoR guide</span></div><div><i>03</i><strong>Publish</strong><span>Keep a provenance receipt</span></div></div>
            <div className="signal-footer"><span>Discovery follows relevance, quality, freshness &amp; variety.</span><b>Never payment.</b></div>
          </div>
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
        <div className="builder-card"><span>OPEN, VERIFIABLE BUILDING</span><h3>Make knowledge durable, reviewable, and useful.</h3><p>Explore the public-source application, its protected publication contracts, and the evidence-oriented work still required before a broader organizational rollout.</p><img className="builder-brand-board" src={iconPackDarkPath} alt="Scholarium icon asset system board used as a reference panel for the product identity." /><a href={`${githubUrl}/blob/main/docs/DEVELOPER-SEED-PROTOCOL.md`}>Read the Seed Protocol <b>↗</b></a><small>Pre-alpha · public source · no paid ranking path · evidence before attention.</small></div>
      </section>

      <section className="landing-suite-bridge">
        <div className="landing-suite-bridge-copy">
          <p className="landing-kicker">SECUREDME ROOT ↔ SCHOLARIUM</p>
          <h2>The suite root and the research commons now point at each other clearly.</h2>
          <p>Use SecuredMe for the suite map, service surfaces, and broader positioning. Use Scholarium when you need the active publishing, discovery, formalization, and learning commons.</p>
        </div>
        <div className="landing-suite-bridge-actions">
          <a className="landing-primary" href={securedmeRootUrl}>Open SecuredMe root <span>→</span></a>
          <a className="landing-secondary" href="/app">Open Scholarium app</a>
        </div>
      </section>

      <section className="landing-brand-system" id="brand-system">
        <div className="landing-brand-system-copy">
          <p className="landing-kicker">CANONICAL IDENTITY SYSTEM</p>
          <h2>Every visual pack is now mounted inside the product.</h2>
          <p>Scholarium now consumes the canonical assets vault directly: logos, campaign banners, badge morph stages, icon packs, and B2B hooks. The live product can reuse the same visual system across onboarding, profiles, landing, and future suite connectors.</p>
          <div className="tier-button-row" aria-label="Suite colour buttons">
            <a className="tier-button tier-button-free" href="/app">Free</a>
            <a className="tier-button tier-button-pro" href="/app">Pro</a>
            <a className="tier-button tier-button-education" href="/app">Education</a>
            <a className="tier-button tier-button-enterprise" href="/app">Enterprise</a>
            <a className="tier-button tier-button-premium" href="/app">Premium</a>
          </div>
        </div>
        <div className="identity-system-grid">
          <article className="identity-panel identity-panel-feature">
            <span>FINAL LOGO SYSTEM</span>
            <img src={finalLogoPath} alt="Final Scholarium logo concept board from the canonical asset vault." />
          </article>
          <article className="identity-panel">
            <span>LOGO DRAFTS</span>
            <div className="identity-thumb-grid">
              {logoDraftPaths.map((path, index) => <img key={path} src={path} alt={`Scholarium draft logo concept ${index + 1}.`} />)}
            </div>
          </article>
          <article className="identity-panel">
            <span>B2B HOOKS</span>
            <div className="identity-thumb-grid identity-thumb-grid-wide">
              {b2bHookPaths.map((path, index) => <img key={path} src={path} alt={`Scholarium business-facing banner hook ${index + 1}.`} />)}
            </div>
          </article>
        </div>
      </section>

      <section className="asset-gallery-section">
        <div className="asset-gallery-heading">
          <p className="landing-kicker">CAMPAIGN BANNERS</p>
          <h2>All 10 web banners are mounted for rollout use.</h2>
        </div>
        <div className="asset-gallery asset-gallery-banners">
          {webBannerPaths.map((path, index) => (
            <figure key={path} className="asset-card asset-card-banner">
              <img src={path} alt={`Scholarium web banner variation ${index + 1}.`} />
              <figcaption>Banner {index + 1}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="asset-gallery-section">
        <div className="asset-gallery-heading">
          <p className="landing-kicker">ICON PACK</p>
          <h2>All 10 icon-system boards are ready for UI extraction.</h2>
        </div>
        <div className="asset-gallery asset-gallery-icons">
          {iconPackPaths.map((path, index) => (
            <figure key={path} className="asset-card">
              <img src={path} alt={`Scholarium icon asset board ${index + 1}.`} />
              <figcaption>Icon pack {index + 1}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="asset-gallery-section asset-gallery-section-badges">
        <div className="asset-gallery-heading">
          <p className="landing-kicker">MORPHING BADGES</p>
          <h2>Dark and light badge ladders map directly to tool-connection growth.</h2>
        </div>
        <div className="badge-ladder-grid">
          <article className="badge-ladder">
            <span>DARK MODE</span>
            <div className="asset-gallery asset-gallery-badges">
              {badgeDarkPaths.map((path, index) => (
                <figure key={path} className="asset-card asset-card-badge">
                  <img src={path} alt={`Dark ecosystem badge stage ${index + 1}.`} />
                  <figcaption>Stage {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </article>
          <article className="badge-ladder">
            <span>LIGHT MODE</span>
            <div className="asset-gallery asset-gallery-badges">
              {badgeLightPaths.map((path, index) => (
                <figure key={path} className="asset-card asset-card-badge">
                  <img src={path} alt={`Light ecosystem badge stage ${index + 1}.`} />
                  <figcaption>Stage {index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="landing-cta"><p className="landing-kicker">START WITH THE WORK</p><h2>Bring a question. Leave with a clearer next step.</h2><p>Explore the pre-alpha with your ChatGPT account, create a role-aware profile, and see how publishing, formalization, and attribution fit together.</p><a className="landing-primary" href="/app">Enter Scholarium <span>→</span></a></section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><img src={navBrandMarkPath} alt="" /><span>scholarium</span></a><p>Part of SecuredMe Education. Open learning needs open paths.</p><div className="landing-footer-links"><a href={securedmeRootUrl}>SecuredMe root ↗</a><a href={githubUrl}>Public source ↗</a></div></footer>
    </main>
  );
}
