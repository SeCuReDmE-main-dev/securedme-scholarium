"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";

type View = "signal" | "library" | "studio" | "formalize";
type ColorScheme = "scholarium-dark" | "scholarium-light" | "midnight-code" | "paper-library";
type Publication = {
  id: number;
  author: string;
  role: string;
  avatar: string;
  type: string;
  title: string;
  excerpt: string;
  topics: string[];
  status: "Verified" | "Processing";
  hours: string;
  reactions: number;
  comments: number;
  kind: "paper" | "video" | "project";
};
type FormalizationPreview = {
  label: string;
  status: "needs_input" | "structured_draft";
  sections: Array<{ id: string; label: string; guidance: string; required: boolean }>;
  missing: string[];
  formalVerification: boolean;
  lifeScienceSources: boolean;
  disclaimer: string;
};
type LocalInsightCounts = { formalizationGuides: number; publicationDrafts: number };

const initialPublications: Publication[] = [
  {
    id: 1,
    author: "Dr. Amina Rahman",
    role: "Researcher · Computational ecology",
    avatar: "AR",
    type: "WHITE PAPER",
    title: "Open watershed models for community climate resilience",
    excerpt:
      "A reproducible framework connecting field observations, accessible models, and community-led adaptation decisions.",
    topics: ["Climate systems", "Open science", "Data commons"],
    status: "Verified",
    hours: "42m",
    reactions: 184,
    comments: 28,
    kind: "paper",
  },
  {
    id: 2,
    author: "Nora Vidal",
    role: "Teacher · Montréal science lab",
    avatar: "NV",
    type: "STUDENT PROJECT",
    title: "Celebrating our Grade 11 soil microbiome field team",
    excerpt:
      "Their project journal, dataset, and three-minute explanation are now open for peer feedback and reuse.",
    topics: ["Education", "Biology", "Fieldwork"],
    status: "Verified",
    hours: "3h",
    reactions: 96,
    comments: 17,
    kind: "project",
  },
  {
    id: 3,
    author: "Open Hardware Collective",
    role: "Maintainers · Community engineering",
    avatar: "OH",
    type: "SHORT EXPLAINER",
    title: "How our low-cost spectrometer becomes a classroom project",
    excerpt:
      "Watch the build, inspect the open Git tree, or start a private learning project with attribution preserved.",
    topics: ["Open hardware", "Engineering", "Git"],
    status: "Verified",
    hours: "5h",
    reactions: 231,
    comments: 39,
    kind: "video",
  },
];

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: "signal", label: "Signal", icon: "⌁" },
  { id: "library", label: "Library", icon: "▤" },
  { id: "studio", label: "Studio", icon: "◉" },
  { id: "formalize", label: "Formalize", icon: "◇" },
];

export function ScholariumClient() {
  const [view, setView] = useState<View>("signal");
  const [query, setQuery] = useState("");
  const [publications, setPublications] = useState(initialPublications);
  const [composerOpen, setComposerOpen] = useState(false);
  const [publicationType, setPublicationType] = useState("Research note");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [ranking, setRanking] = useState({ relevance: 78, freshness: 52, diversity: 66 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("scholarium-dark");
  const [accentColor, setAccentColor] = useState("#2157ee");
  const [badgeVisibility, setBadgeVisibility] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formalizationKind, setFormalizationKind] = useState("research_article");
  const [formalizationTitle, setFormalizationTitle] = useState("");
  const [formalizationText, setFormalizationText] = useState("");
  const [formalization, setFormalization] = useState<FormalizationPreview | null>(null);
  const [formalizationLoading, setFormalizationLoading] = useState(false);
  const [localInsightsEnabled, setLocalInsightsEnabled] = useState(false);
  const [localInsightCounts, setLocalInsightCounts] = useState<LocalInsightCounts>({ formalizationGuides: 0, publicationDrafts: 0 });

  useEffect(() => {
    const stored = window.localStorage.getItem("scholarium.local-insights.v1");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { enabled?: boolean; counts?: LocalInsightCounts };
      setLocalInsightsEnabled(Boolean(parsed.enabled));
      if (parsed.counts) setLocalInsightCounts(parsed.counts);
    } catch { window.localStorage.removeItem("scholarium.local-insights.v1"); }
  }, []);

  const updateLocalInsights = (enabled: boolean, counts = localInsightCounts) => {
    setLocalInsightsEnabled(enabled);
    window.localStorage.setItem("scholarium.local-insights.v1", JSON.stringify({ enabled, counts }));
  };

  const trackLocalInsight = (key: keyof LocalInsightCounts) => {
    if (!localInsightsEnabled) return;
    setLocalInsightCounts((current) => {
      const counts = { ...current, [key]: current[key] + 1 };
      window.localStorage.setItem("scholarium.local-insights.v1", JSON.stringify({ enabled: true, counts }));
      return counts;
    });
  };

  const filteredPublications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return publications;
    return publications.filter((publication) =>
      [publication.author, publication.title, publication.excerpt, ...publication.topics]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [publications, query]);

  const publishDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftTitle.trim() || !draftBody.trim()) return;
    setPublications((current) => [
      {
        id: Date.now(),
        author: "You",
        role: "Professional learner · Scholarium member",
        avatar: "YO",
        type: publicationType.toUpperCase(),
        title: draftTitle.trim(),
        excerpt: draftBody.trim(),
        topics: ["Your work", "Verification pending"],
        status: "Processing",
        hours: "now",
        reactions: 0,
        comments: 0,
        kind: publicationType === "Short video" ? "video" : "paper",
      },
      ...current,
    ]);
    const artifactCount = attachedFiles.length;
    setDraftTitle("");
    setDraftBody("");
    setAttachedFiles([]);
    setComposerOpen(false);
    trackLocalInsight("publicationDrafts");
    setNotice(`Published. Your provenance receipt, safety scan${artifactCount ? `, and ${artifactCount} artifact${artifactCount === 1 ? "" : "s"}` : ""} are now processing.`);
  };

  const reactToPublication = (id: number) => {
    setPublications((current) =>
      current.map((publication) =>
        publication.id === id ? { ...publication, reactions: publication.reactions + 1 } : publication,
      ),
    );
  };

  const startProject = () => {
    setNotice("Private-project setup will preserve the source license and attribution before creating anything.");
  };

  const setRankingValue = (key: keyof typeof ranking, value: number) => {
    setRanking((current) => ({ ...current, [key]: value }));
  };

  const buildFormalization = async () => {
    setFormalizationLoading(true);
    try {
      const response = await fetch("/api/quanthor-formalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: formalizationKind, text: formalizationText, title: formalizationTitle }),
      });
      if (!response.ok) throw new Error("QuaNthoR could not prepare a guide right now.");
      const payload = await response.json() as { formalization: FormalizationPreview };
      setFormalization(payload.formalization);
      trackLocalInsight("formalizationGuides");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "QuaNthoR could not prepare a guide right now.");
    } finally {
      setFormalizationLoading(false);
    }
  };

  return (
    <main className={`scholarium-shell theme-${colorScheme}`} style={{ "--blue": accentColor } as CSSProperties}>
      <aside className="left-rail" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Scholarium home">
          <span className="brand-mark">S</span>
          <span>scholarium</span>
        </a>
        <div className="suite-label">SECUREDME EDUCATION</div>

        <nav className="main-nav">
          {navItems.map((item) => (
            <button
              className={view === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className="nav-item" type="button" onClick={() => setNotice("Your learning circles will appear here.")}>
            <span aria-hidden="true">◌</span> Circles
          </button>
          <button className="nav-item" type="button" onClick={() => setNotice("Your saved reading list is empty.")}>
            <span aria-hidden="true">▱</span> Saved
          </button>
        </nav>

        <div className="rail-note">
          <strong>Free means discoverable.</strong>
          <span>Paid tools never change reach, ranking, or your right to publish.</span>
        </div>
        <button className="profile-switcher" type="button" onClick={() => setProfileOpen(true)}>
          <span className="avatar avatar-you" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}>{avatarPreview ? "" : "JS"}</span>
          <span><b>Jean-Sebastien</b><small>Professional profile</small></span>
          <span aria-hidden="true">⌄</span>
        </button>
      </aside>

      <section className="main-column" id="top">
        <div className="prealpha-bar"><strong>Pre-alpha preview</strong><span>Features are being validated. Identity, payments, and external connections are not live yet.</span></div>
        <header className="topbar">
          <div>
            <p className="eyebrow">OPEN SCIENCE / OPEN EDUCATION</p>
            <h1>{view === "signal" ? "Today’s signal" : view === "library" ? "Your knowledge library" : view === "studio" ? "Creator studio" : "Formalize with QuaNthoR"}</h1>
          </div>
          <button className="publish-button" type="button" onClick={() => setComposerOpen(true)}>Publish work <span>+</span></button>
        </header>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search research, people, projects, topics" />
          <kbd>⌘ K</kbd>
        </label>

        {view !== "formalize" && <div className="feed-tabs" role="tablist" aria-label="Feed options">
          <button className="feed-tab active" type="button">For you</button>
          <button className="feed-tab" type="button" onClick={() => setNotice("Following will prioritize people and topics you choose.")}>Following</button>
          <button className="feed-tab" type="button" onClick={() => setNotice("Verified shows work that completed safety and provenance checks.")}>Verified</button>
          <button className="feed-tab" type="button" onClick={() => setNotice("Chronological removes personalization.")}>Chronological</button>
        </div>}

        {view === "formalize" ? (
          <section className="formalization-panel" aria-label="QuaNthoR formalization coach">
            <div className="formalization-hero">
              <p className="eyebrow">QUANTHOR / COACH MODE</p>
              <h2>Make the structure clear. Keep your voice.</h2>
              <p>Choose a format, describe the work in your own words, and get an adaptable outline. Nothing here prevents you from publishing.</p>
              <div className="formalization-promise"><span>◇</span><strong>Educational, non-blocking, and author-led.</strong><span>Suggestions make formats easier to recognize across Scholarium; they never decide whether your work deserves to exist.</span></div>
            </div>
            <div className="formalization-form">
              <label>What are you making?<select value={formalizationKind} onChange={(event) => setFormalizationKind(event.target.value)}><option value="research_article">Research article</option><option value="white_paper">White paper</option><option value="book_chapter">Book chapter</option><option value="presentation">Presentation story</option><option value="project_brief">Project brief</option><option value="short_video">Short video</option><option value="life_science_protocol">Life-science protocol</option><option value="mizar_proof">Formal proof</option></select></label>
              <label>Working title<input value={formalizationTitle} onChange={(event) => setFormalizationTitle(event.target.value)} placeholder="It can be rough — you can change it later." /></label>
              <label>Describe the work<textarea value={formalizationText} onChange={(event) => setFormalizationText(event.target.value)} placeholder="What are you trying to explain, test, build, or share? Add a source link when you have one." rows={6} /></label>
              <div className="formalization-actions"><button className="quiet-button" type="button" onClick={() => { setFormalization(null); setFormalizationText(""); setFormalizationTitle(""); }}>Start over</button><button className="publish-button" type="button" onClick={buildFormalization} disabled={formalizationLoading}>{formalizationLoading ? "Building guide…" : "Create a gentle guide"}</button></div>
            </div>
            {formalization && <div className="formalization-result" role="status">
              <div className="card-heading"><div><p className="eyebrow">{formalization.status === "structured_draft" ? "YOUR OUTLINE" : "A FEW HELPFUL STARTERS"}</p><h2>{formalization.label}</h2></div><button type="button" onClick={() => { setPublicationType(formalization.label); setDraftTitle(formalizationTitle); setDraftBody(formalizationText); setComposerOpen(true); }}>Use in a post</button></div>
              <p>{formalization.disclaimer}</p>
              {formalization.missing.length > 0 && <p className="formalization-missing">Optional next additions: {formalization.missing.join(", ")}.</p>}
              <ol>{formalization.sections.map((section) => <li key={section.id}><strong>{section.label}</strong><span>{section.guidance}</span></li>)}</ol>
              {formalization.formalVerification && <p className="formalization-note">A Mizar draft must still be verified by QuaNthoR/Mizar. A helpful outline is not a formal proof.</p>}
              {formalization.lifeScienceSources && <p className="formalization-note">Official-source lookup can be requested later. It supports literature discovery only and does not replace ethics review, biosafety review, or scientific judgment.</p>}
            </div>}
          </section>
        ) : view === "studio" ? (
          <section className="studio-panel">
            <div className="studio-hero">
              <p className="eyebrow">CREATE WITHOUT A PAYWALL</p>
              <h2>Explain the work behind the work.</h2>
              <p>Record a Short, plan a project Live, attach a report, or turn an existing publication into a clear teaching story.</p>
              <div className="studio-actions">
                <button className="publish-button" type="button" onClick={() => setComposerOpen(true)}>Start a publication</button>
                <button className="quiet-button" type="button" onClick={() => setNotice("Live planning is ready for your project and moderator settings.")}>Plan a Live</button>
              </div>
            </div>
            <div className="studio-grid">
              <article><span>01</span><h3>Short explainers</h3><p>Video lives apart from the research feed, with captions and sources.</p></article>
              <article><span>02</span><h3>Project Lives</h3><p>Present a method, answer questions, and preserve a replay as a citable artifact.</p></article>
              <article><span>03</span><h3>Documents first</h3><p>Every video can connect directly to reports, books, slides, and datasets.</p></article>
              <article><span>04</span><h3>Synthia workspace</h3><p>Plan an essay, podcast, or short-video outline with traceability prompts and a required human review.</p></article>
            </div>
          </section>
        ) : (
          <section className="feed" aria-label="Publication feed">
            {filteredPublications.length === 0 ? (
              <div className="empty-state"><h2>No work matches that search.</h2><p>Try a topic, an author, or a broader scientific phrase.</p></div>
            ) : filteredPublications.map((publication) => (
              <article className={`publication-card ${publication.kind}`} key={publication.id}>
                <div className="publication-header">
                  <span className="avatar">{publication.avatar}</span>
                  <div><strong>{publication.author}</strong><span>{publication.role} · {publication.hours}</span></div>
                  <button className="more-button" aria-label={`More options for ${publication.title}`} type="button">•••</button>
                </div>
                <div className="publication-content">
                  <div className="publication-label"><span>{publication.type}</span><span className={publication.status === "Verified" ? "status verified" : "status processing"}>{publication.status === "Verified" ? "✓ VERIFIED" : "◌ PROCESSING"}</span></div>
                  <h2>{publication.title}</h2>
                  <p>{publication.excerpt}</p>
                  {publication.kind === "video" && <div className="video-preview"><span className="play">▶</span><span>03:42 · Sources and Git tree attached</span></div>}
                  <div className="topic-row">{publication.topics.map((topic) => <button type="button" key={topic} onClick={() => setQuery(topic)}>#{topic.replaceAll(" ", "")}</button>)}</div>
                </div>
                <div className="publication-footer">
                  <button type="button" onClick={() => reactToPublication(publication.id)}>✦ {publication.reactions}</button>
                  <button type="button" onClick={() => setNotice("Thoughtful comments and citations will stay connected to this version.")}>◌ {publication.comments}</button>
                  <button type="button" onClick={startProject}>⌘ Start project</button>
                  <button type="button" onClick={() => setNotice("A contribution supports the project, never the feed rank.")}>♡ Support</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      <aside className="right-rail" aria-label="Discovery controls">
        <section className="ranking-card">
          <div className="card-heading"><div><p className="eyebrow">YOUR DISCOVERY</p><h2>Open algorithm</h2></div><button type="button" onClick={() => setShowAdvanced((open) => !open)}>{showAdvanced ? "Close" : "Tune"}</button></div>
          <p>Visibility is never for sale. You control what this feed values.</p>
          <div className="ranking-mode"><span className="mode-dot" />Balanced science <button type="button" onClick={() => setNotice("Chronological mode is available from the feed tabs.")}>Change</button></div>
          {showAdvanced && <div className="sliders">
            {(Object.keys(ranking) as Array<keyof typeof ranking>).map((key) => (
              <label key={key}><span>{key}<b>{ranking[key]}%</b></span><input type="range" min="0" max="100" value={ranking[key]} onChange={(event) => setRankingValue(key, Number(event.target.value))} /></label>
            ))}
            <button className="quiet-button" type="button" onClick={() => setRanking({ relevance: 78, freshness: 52, diversity: 66 })}>Reset to balanced</button>
          </div>}
          <a href="#how-ranking-works">How this feed works →</a>
        </section>

        <section className="topics-card">
          <div className="card-heading"><h2>Topics you follow</h2><button type="button" onClick={() => setNotice("Topic editing is part of your profile preferences.")}>Edit</button></div>
          <div className="followed-topics"><button>#OpenScience</button><button>#QuantumEducation</button><button>#ClimateSystems</button><button>#CommunityCode</button></div>
        </section>

        <section className="project-card">
          <p className="eyebrow">PREVIEW PROJECT</p>
          <h2>Libre Lab Instruments</h2>
          <p>Example of a community-built classroom project. Funding figures and checkout are intentionally disabled until the provider and review flow are verified.</p>
          <button type="button" onClick={() => setNotice("Project contributions are unavailable during the public preview.")}>Preview contribution rules</button>
        </section>

        <section className="transparency-card" id="how-ranking-works">
          <strong>Why you see work</strong>
          <p>Topic fit, source quality, freshness, and diverse perspectives. Never payment.</p>
        </section>
      </aside>

      {composerOpen && <div className="modal-backdrop" role="presentation">
        <form className="composer" onSubmit={publishDraft}>
          <div className="composer-header"><div><p className="eyebrow">NEW PUBLICATION</p><h2>Share work with context</h2></div><button type="button" className="more-button" onClick={() => setComposerOpen(false)} aria-label="Close composer">×</button></div>
          <label>Format<select value={publicationType} onChange={(event) => setPublicationType(event.target.value)}><option>Research note</option><option>White paper</option><option>Project update</option><option>Short video</option><option>Teaching artifact</option></select></label>
          <label>Title<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Give the work a clear, specific name" autoFocus /></label>
          <label>Context<textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} placeholder="Explain what this is, who it helps, and how others can use it." rows={5} /></label>
          <label>Attach evidence<input type="file" multiple accept=".pdf,.docx,.odt,.xlsx,.ods,.csv,.pptx,.odp,.epub,.zip,.txt,video/*" onChange={(event) => setAttachedFiles(Array.from(event.currentTarget.files ?? []))} /></label>
          {attachedFiles.length > 0 && <p className="attachment-summary">{attachedFiles.length} artifact{attachedFiles.length === 1 ? "" : "s"} ready for hashing and upload.</p>}
          <div className="composer-proof"><span>✓</span><p>A timestamped provenance receipt will be created. It records your Scholarium publication event; it does not replace copyright registration.</p></div>
          <div className="composer-actions"><button className="quiet-button" type="button" onClick={() => setComposerOpen(false)}>Save draft</button><button className="publish-button" type="submit">Publish now</button></div>
        </form>
      </div>}
      {profileOpen && <div className="modal-backdrop" role="presentation">
        <section className="composer profile-editor" aria-label="Profile customization">
          <div className="composer-header"><div><p className="eyebrow">YOUR PROFILE</p><h2>Make Scholarium yours</h2></div><button type="button" className="more-button" onClick={() => setProfileOpen(false)} aria-label="Close profile preferences">×</button></div>
          <div className="profile-banner-preview" style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : undefined}><span className="avatar avatar-you profile-avatar-preview" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}>{avatarPreview ? "" : "JS"}</span></div>
          <div className="profile-upload-grid">
            <label>Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} /></label>
            <label>Profile banner<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) setBannerPreview(URL.createObjectURL(file)); }} /></label>
          </div>
          <fieldset className="profile-fieldset"><legend>Colour scheme</legend><div className="theme-options">{(["scholarium-dark", "scholarium-light", "midnight-code", "paper-library"] as ColorScheme[]).map((scheme) => <button className={colorScheme === scheme ? "theme-choice selected" : "theme-choice"} type="button" key={scheme} onClick={() => setColorScheme(scheme)}>{scheme.replaceAll("-", " ")}</button>)}</div></fieldset>
          <label>Accent colour<input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /></label>
          <label className="toggle-label"><input type="checkbox" checked={badgeVisibility} onChange={(event) => setBadgeVisibility(event.target.checked)} /> Show earned badges on my profile</label>
          <div className="badge-row">{badgeVisibility && <><span>Provenance ready</span><span>Open education</span></>}</div>
          <label className="toggle-label"><input type="checkbox" checked={localInsightsEnabled} onChange={(event) => updateLocalInsights(event.target.checked)} /> Enable local-only activity insights on this device</label>
          <div className="local-insights-card"><strong>Private activity snapshot</strong>{localInsightsEnabled ? <span>{localInsightCounts.formalizationGuides} guide{localInsightCounts.formalizationGuides === 1 ? "" : "s"} created · {localInsightCounts.publicationDrafts} publication draft{localInsightCounts.publicationDrafts === 1 ? "" : "s"} started. Kept only in this browser.</span> : <span>Off by default. No activity snapshot is collected or sent anywhere.</span>}</div>
          <div className="profile-tools"><strong>Attach your learning tools</strong><span>QuaNthoR, Synthia, SecuredMe Blog, Codex/OpenAI, and Antigravity/Gemini are consent-first profile connections. Provider sessions and tokens stay with their provider.</span><button className="quiet-button" type="button" onClick={() => { setProfileOpen(false); setView("formalize"); }}>Open QuaNthoR</button></div>
          <div className="composer-proof"><span>◌</span><p>Profile images stay local until you choose to save them to your account. Identity verification uses a document provider and a passkey: Scholarium never stores ID images or fingerprint data.</p></div>
          <div className="composer-actions"><button className="quiet-button" type="button" onClick={() => setProfileOpen(false)}>Cancel</button><button className="publish-button" type="button" onClick={() => { setProfileOpen(false); setNotice("Profile preferences are ready to save when your authenticated account is connected."); }}>Save preferences</button></div>
        </section>
      </div>}

      {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button></div>}
    </main>
  );
}
