"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { publicationTypeForFormalization, publicationTypeOptions } from "../lib/publication-types";

type View = "signal" | "library" | "studio" | "formalize";
type FeedMode = "chronological" | "discovery" | "following" | "verified";
type ColorScheme = "scholarium-dark" | "scholarium-light" | "midnight-code" | "paper-library";
type Publication = {
  id: string;
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
  classification?: string;
  favorite?: boolean;
  why?: string[];
  isPreview?: boolean;
};
type FormalizationPreview = {
  kind: string;
  label: string;
  status: "needs_input" | "structured_draft";
  sections: Array<{ id: string; label: string; guidance: string; required: boolean }>;
  missing: string[];
  formalVerification: boolean;
  lifeScienceSources: boolean;
  disclaimer: string;
};
type LocalInsightCounts = { formalizationGuides: number; publicationDrafts: number };
const profileToolOptions = [
  { id: "quanthor", label: "QuaNthoR" },
  { id: "synthia", label: "Synthia" },
  { id: "securedme_blog", label: "SecuredMe Blog" },
  { id: "codex_openai", label: "Codex / OpenAI" },
  { id: "antigravity_gemini", label: "Antigravity / Gemini" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
] as const;

const initialPublications: Publication[] = [
  {
    id: "preview-1",
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
    isPreview: true,
  },
  {
    id: "preview-2",
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
    isPreview: true,
  },
  {
    id: "preview-3",
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
    isPreview: true,
  },
];

type ApiPublication = {
  abstract: string;
  author: string;
  comments?: number;
  createdAt: string;
  favorite?: boolean;
  feedSignal?: { classification: string; reasons: string[] };
  id: string;
  reactions?: number;
  status: string;
  title: string;
  topics?: string[];
  type: string;
};
type CommunityComment = {
  author: string;
  authorId: string;
  body: string;
  createdAt: string;
  id: string;
  parentCommentId: string | null;
};

const publicationLabel = (type: string) => type.replaceAll("_", " ").toUpperCase();

const initialsFor = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "SC";

const fromApiPublication = (publication: ApiPublication): Publication => ({
  id: publication.id,
  author: publication.author,
  role: "Scholarium member",
  avatar: initialsFor(publication.author),
  type: publicationLabel(publication.type),
  title: publication.title,
  excerpt: publication.abstract,
  topics: publication.topics?.length ? publication.topics : [publication.type.replaceAll("_", " "), "Open education"],
  status: publication.status === "verified" ? "Verified" : "Processing",
  hours: "Published",
  reactions: publication.reactions ?? 0,
  comments: publication.comments ?? 0,
  kind: ["video", "short_video", "live_replay"].includes(publication.type) ? "video" : ["project_update", "school_project", "software_project", "git_tree"].includes(publication.type) ? "project" : "paper",
  classification: publication.feedSignal?.classification,
  favorite: publication.favorite,
  why: publication.feedSignal?.reasons,
});

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: "signal", label: "Signal", icon: "⌁" },
  { id: "library", label: "Library", icon: "▤" },
  { id: "studio", label: "Studio", icon: "◉" },
  { id: "formalize", label: "Formalize", icon: "◇" },
];

export function ScholariumClient({ session }: { session: { displayName: string | null; provider: "chatgpt" | "google" | "github" | "paypal" | null; signInPath: string; googleSignInPath: string; githubSignInPath: string; paypalSignInPath: string; signOutPath: string } }) {
  const [view, setView] = useState<View>("signal");
  const [query, setQuery] = useState("");
  const [publications, setPublications] = useState(initialPublications);
  const [feedMode, setFeedMode] = useState<FeedMode>("discovery");
  const [serverFeed, setServerFeed] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [publicationType, setPublicationType] = useState("research_article");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTopics, setDraftTopics] = useState("");
  const [externalMediaUrl, setExternalMediaUrl] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [ranking, setRanking] = useState({ relevance: 78, freshness: 52, diversity: 66 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("scholarium-dark");
  const [accentColor, setAccentColor] = useState("#2157ee");
  const [badgeVisibility, setBadgeVisibility] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profileMediaSaving, setProfileMediaSaving] = useState<"avatar" | "banner" | null>(null);
  const [formalizationKind, setFormalizationKind] = useState("research_article");
  const [formalizationTitle, setFormalizationTitle] = useState("");
  const [formalizationText, setFormalizationText] = useState("");
  const [formalization, setFormalization] = useState<FormalizationPreview | null>(null);
  const [formalizationLoading, setFormalizationLoading] = useState(false);
  const [localInsightsEnabled, setLocalInsightsEnabled] = useState(false);
  const [localInsightCounts, setLocalInsightCounts] = useState<LocalInsightCounts>({ formalizationGuides: 0, publicationDrafts: 0 });
  const [connectingTool, setConnectingTool] = useState<string | null>(null);
  const [accountReady, setAccountReady] = useState<boolean | null>(null);
  const [accountRole, setAccountRole] = useState("professional");
  const [accountAgeBand, setAccountAgeBand] = useState("adult");
  const [accountSaving, setAccountSaving] = useState(false);
  const [rankingSaving, setRankingSaving] = useState(false);
  const [discussionPublication, setDiscussionPublication] = useState<Publication | null>(null);
  const [discussionComments, setDiscussionComments] = useState<CommunityComment[]>([]);
  const [discussionDraft, setDiscussionDraft] = useState("");
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionSaving, setDiscussionSaving] = useState(false);
  const profileInitials = (session.displayName ?? "Guest").split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const providerLabel = session.provider ? ({ chatgpt: "ChatGPT", github: "GitHub", google: "Google", paypal: "PayPal" } as const)[session.provider] : null;

  useEffect(() => {
    const stored = window.localStorage.getItem("scholarium.local-insights.v1");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { enabled?: boolean; counts?: LocalInsightCounts };
      const timer = window.setTimeout(() => {
        setLocalInsightsEnabled(Boolean(parsed.enabled));
        if (parsed.counts) setLocalInsightCounts(parsed.counts);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch { window.localStorage.removeItem("scholarium.local-insights.v1"); }
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("auth_error");
    if (!code) return;
    const messages: Record<string, string> = {
      github_not_configured: "GitHub login is being connected. Please use another sign-in option for now.",
      google_not_configured: "Google login is being connected. Please use another sign-in option for now.",
      paypal_not_configured: "PayPal login is being connected in sandbox. Please use another sign-in option for now.",
    };
    const timer = window.setTimeout(() => setNotice(messages[code] ?? "That sign-in could not be completed. No Scholarium profile changes were made."), 0);
    window.history.replaceState({}, "", window.location.pathname);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!session.displayName) {
      const timer = window.setTimeout(() => setAccountReady(null), 0);
      return () => window.clearTimeout(timer);
    }
    let active = true;
    fetch("/api/v1/account").then(async (response) => ({ ok: response.ok, payload: await response.json() as { account?: unknown } })).then(({ ok, payload }) => {
      if (active) setAccountReady(ok && Boolean(payload.account));
    }).catch(() => { if (active) setAccountReady(false); });
    return () => { active = false; };
  }, [session.displayName]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    const load = async (kind: "avatar" | "banner") => {
      const response = await fetch(`/api/v1/profile-media?kind=${kind}`);
      if (!response.ok || !active) return;
      const url = URL.createObjectURL(await response.blob());
      if (active) (kind === "avatar" ? setAvatarPreview : setBannerPreview)(url);
    };
    void load("avatar");
    void load("banner");
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      setFeedLoading(true);
      const params = new URLSearchParams({ mode: feedMode });
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/v1/publications?${params.toString()}`)
        .then(async (response) => ({ ok: response.ok, payload: await response.json() as { publications?: ApiPublication[] } }))
        .then(({ ok, payload }) => {
          if (!active || !ok || !payload.publications) return;
          if (payload.publications.length || query.trim() || feedMode !== "discovery") {
            setPublications(payload.publications.map(fromApiPublication));
            setServerFeed(true);
          } else {
            setServerFeed(false);
            setPublications(initialPublications);
          }
        })
        .catch(() => undefined)
        .finally(() => { if (active) setFeedLoading(false); });
    };
    const timeout = window.setTimeout(refresh, query.trim() ? 220 : 0);
    const liveRefresh = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearTimeout(timeout); window.clearInterval(liveRefresh); };
  }, [feedMode, query]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    fetch("/api/v1/ranking-preferences")
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { preference?: { diversityWeight: number; freshnessWeight: number; relevanceWeight: number } | null } }))
      .then(({ ok, payload }) => {
        if (!active || !ok || !payload.preference) return;
        setRanking({ diversity: payload.preference.diversityWeight, freshness: payload.preference.freshnessWeight, relevance: payload.preference.relevanceWeight });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [accountReady, session.displayName]);

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

  const prepareToolConnection = async (provider: typeof profileToolOptions[number]["id"], label: string) => {
    setConnectingTool(provider);
    try {
      const response = await fetch("/api/v1/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) });
      const payload = await response.json() as { error?: string; nextStep?: string };
      if (!response.ok) throw new Error(payload.error ?? "The connection could not be prepared.");
      setNotice(`${label}: connection prepared. ${payload.nextStep ?? "Review the requested access before continuing."}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The connection could not be prepared.");
    } finally {
      setConnectingTool(null);
    }
  };

  const uploadProfileMedia = async (kind: "avatar" | "banner", file: File) => {
    setProfileMediaSaving(kind);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const response = await fetch("/api/v1/profile-media", { body: form, method: "POST" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Profile media could not be saved.");
      const preview = URL.createObjectURL(file);
      (kind === "avatar" ? setAvatarPreview : setBannerPreview)(preview);
      setNotice(`${kind === "avatar" ? "Profile picture" : "Profile banner"} saved.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Profile media could not be saved.");
    } finally { setProfileMediaSaving(null); }
  };

  const createAccount = async () => {
    setAccountSaving(true);
    try {
      const response = await fetch("/api/v1/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ primaryRole: accountRole, ageBand: accountAgeBand, displayName: session.displayName }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your profile could not be created.");
      setAccountReady(true);
      setNotice("Your Scholarium profile is ready. You can now save preferences and prepare connections.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your profile could not be created.");
    } finally { setAccountSaving(false); }
  };

  const saveProfilePreferences = async () => {
    if (!accountReady) return;
    setAccountSaving(true);
    try {
      const response = await fetch("/api/v1/profile-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accentColor, badgeVisibility: badgeVisibility ? "public" : "private", colorScheme }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your profile preferences could not be saved.");
      setProfileOpen(false);
      setNotice("Profile preferences saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your profile preferences could not be saved.");
    } finally { setAccountSaving(false); }
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

  const publishDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftTitle.trim() || !draftBody.trim()) return;
    if (!session.displayName) {
      window.location.assign(session.signInPath);
      return;
    }
    if (!accountReady) {
      setProfileOpen(true);
      setNotice("Create your Scholarium profile before publishing your first work.");
      return;
    }
    setPublishing(true);
    try {
      const type = publicationType;
      const topicSlugs = draftTopics.split(",").map((topic) => topic.trim()).filter(Boolean);
      const response = await fetch("/api/v1/publications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ abstract: draftBody.trim(), title: draftTitle.trim(), topicSlugs, type }) });
      const payload = await response.json() as { error?: string; moderation?: { message?: string; status: "quarantined" } | null; publication?: { id: string; status: string; topicSlugs?: string[]; visibility?: "private" | "public" } };
      if (!response.ok || !payload.publication) throw new Error(payload.error ?? "Your publication could not be created.");
      let uploadedArtifacts = 0;
      for (const file of attachedFiles) {
        const artifactForm = new FormData();
        artifactForm.set("publicationId", payload.publication.id);
        artifactForm.set("file", file);
        const artifactResponse = await fetch("/api/v1/artifacts", { method: "POST", body: artifactForm });
        if (artifactResponse.ok) uploadedArtifacts += 1;
      }
      let linkedExternalMedia = false;
      if (externalMediaUrl.trim() && payload.publication.status !== "quarantined") {
        const mediaResponse = await fetch("/api/v1/media-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicationId: payload.publication.id, url: externalMediaUrl.trim() }) });
        if (!mediaResponse.ok) {
          const mediaPayload = await mediaResponse.json() as { error?: string };
          throw new Error(mediaPayload.error ?? "Publication was created, but its external media link could not be saved.");
        }
        linkedExternalMedia = true;
      }
    setPublications((current) => [
      fromApiPublication({
        abstract: draftBody.trim(),
        author: session.displayName,
        createdAt: new Date().toISOString(),
        id: payload.publication.id,
        status: payload.publication.status,
        title: draftTitle.trim(),
        topics: payload.publication.topicSlugs,
        type,
      }),
      ...current,
    ]);
    const artifactCount = attachedFiles.length;
    setDraftTitle("");
    setDraftBody("");
    setDraftTopics("");
    setExternalMediaUrl("");
    setAttachedFiles([]);
    setComposerOpen(false);
    trackLocalInsight("publicationDrafts");
      const audienceNotice = payload.publication.visibility === "private" ? " This publication is private until guardian consent or verified school supervision permits public discovery." : "";
      const moderationNotice = payload.moderation?.status === "quarantined" ? ` ${payload.moderation.message ?? "This publication was saved privately for a safety review."}` : "";
      const skippedMediaNotice = externalMediaUrl.trim() && payload.publication.status === "quarantined" ? " The external media link was not attached while this work is quarantined." : "";
      setNotice(`Published. Your provenance receipt and safety scan are now processing.${artifactCount ? ` ${uploadedArtifacts} of ${artifactCount} artifact${artifactCount === 1 ? "" : "s"} uploaded.` : ""}${linkedExternalMedia ? " External media reference linked without copying the video." : ""}${audienceNotice}${moderationNotice}${skippedMediaNotice}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your publication could not be created.");
    } finally { setPublishing(false); }
  };

  const requireCommunityAccount = () => {
    if (session.displayName && accountReady) return true;
    setProfileOpen(true);
    setNotice("Create a Scholarium profile before participating in community discussions.");
    return false;
  };

  const loadDiscussion = async (publication: Publication) => {
    setDiscussionPublication(publication);
    setDiscussionDraft("");
    if (publication.isPreview) { setDiscussionComments([]); return; }
    setDiscussionLoading(true);
    try {
      const response = await fetch(`/api/v1/publication-interactions?publicationId=${encodeURIComponent(publication.id)}`);
      const payload = await response.json() as { comments?: CommunityComment[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Discussion could not be loaded.");
      setDiscussionComments(payload.comments ?? []);
    } catch (error) {
      setDiscussionComments([]);
      setNotice(error instanceof Error ? error.message : "Discussion could not be loaded.");
    } finally { setDiscussionLoading(false); }
  };

  const reactToPublication = async (publication: Publication) => {
    if (publication.isPreview) { setNotice("Preview examples do not accept live reactions."); return; }
    if (!requireCommunityAccount()) return;
    try {
      const response = await fetch("/api/v1/publication-interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reaction", kind: "insightful", publicationId: publication.id }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Reaction could not be saved.");
      setPublications((current) => current.map((item) => item.id === publication.id ? { ...item, reactions: item.reactions + 1 } : item));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Reaction could not be saved."); }
  };

  const setFeedPreference = async (publication: Publication, preference: "favorite" | "less_like" | "neutral") => {
    if (publication.isPreview) { setNotice("Preview examples do not change a live feed."); return; }
    if (!requireCommunityAccount()) return;
    try {
      const response = await fetch("/api/v1/feed-feedback", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preference, publicationId: publication.id }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Feed preference could not be saved.");
      if (preference === "less_like") setPublications((current) => current.filter((item) => item.id !== publication.id));
      else setPublications((current) => current.map((item) => item.id === publication.id ? { ...item, favorite: preference === "favorite" } : item));
      setNotice(preference === "favorite" ? "Saved as a favorite. Your discovery feed will use this private signal." : preference === "less_like" ? "You will see less work like this. This is private and can be changed later." : "Feed preference removed.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Feed preference could not be saved."); }
  };

  const addComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!discussionPublication || !discussionDraft.trim()) return;
    if (discussionPublication.isPreview) { setNotice("Preview examples do not accept live comments."); return; }
    if (!requireCommunityAccount()) return;
    setDiscussionSaving(true);
    try {
      const response = await fetch("/api/v1/publication-interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", body: discussionDraft.trim(), publicationId: discussionPublication.id }) });
      const payload = await response.json() as { comment?: CommunityComment; error?: string };
      if (!response.ok || !payload.comment) throw new Error(payload.error ?? "Comment could not be posted.");
      setDiscussionComments((current) => [...current, payload.comment!]);
      setPublications((current) => current.map((item) => item.id === discussionPublication.id ? { ...item, comments: item.comments + 1 } : item));
      setDiscussionDraft("");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Comment could not be posted."); }
    finally { setDiscussionSaving(false); }
  };

  const reportDiscussionPublication = async () => {
    if (!discussionPublication || discussionPublication.isPreview) { setNotice("Preview examples cannot be reported as live content."); return; }
    if (!requireCommunityAccount()) return;
    try {
      const response = await fetch("/api/v1/publication-interactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", publicationId: discussionPublication.id, reason: "other" }) });
      const payload = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error ?? "Report could not be sent.");
      setNotice(payload.message ?? "Report received. A human review case is open.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Report could not be sent."); }
  };

  const startProject = () => {
    setNotice("Private-project setup will preserve the source license and attribution before creating anything.");
  };

  const setRankingValue = (key: keyof typeof ranking, value: number) => {
    setRanking((current) => ({ ...current, [key]: value }));
  };

  const saveRankingPreferences = async () => {
    if (!session.displayName || !accountReady) {
      setNotice("Create a Scholarium profile before saving discovery preferences.");
      setProfileOpen(true);
      return;
    }
    setRankingSaving(true);
    try {
      const response = await fetch("/api/v1/ranking-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diversityWeight: ranking.diversity, freshnessWeight: ranking.freshness, relevanceWeight: ranking.relevance }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Discovery preferences could not be saved.");
      setNotice("Discovery preferences saved. Payment and contribution signals remain excluded.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Discovery preferences could not be saved.");
    } finally { setRankingSaving(false); }
  };

  const followTopic = async (topic: string) => {
    if (!session.displayName || !accountReady) { setProfileOpen(true); setNotice("Create a Scholarium profile before following topics."); return; }
    try {
      const response = await fetch("/api/v1/topic-follows", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
      const payload = await response.json() as { error?: string; topic?: { label: string } };
      if (!response.ok) throw new Error(payload.error ?? "Topic could not be followed.");
      setNotice(`Following ${payload.topic?.label ?? topic}. This affects your future Following feed, never paid reach.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Topic could not be followed."); }
  };

  const buildFormalization = async () => {
    setFormalizationLoading(true);
    try {
      const response = await fetch("/api/v1/quanthor-formalization", {
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
          <span className="avatar avatar-you" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}>{avatarPreview ? "" : profileInitials}</span>
          <span><b>{session.displayName ?? "Sign in"}</b><small>{session.displayName ? session.provider === "chatgpt" ? "Connected with ChatGPT" : `Connected with ${providerLabel}` : "Choose an identity provider"}</small></span>
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
          <button className={feedMode === "discovery" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("discovery")}>Discover</button>
          <button className={feedMode === "following" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => { if (!session.displayName || !accountReady) { setProfileOpen(true); setNotice("Create a profile before opening your Following feed."); return; } setFeedMode("following"); }}>Following</button>
          <button className={feedMode === "verified" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("verified")}>Verified</button>
          <button className={feedMode === "chronological" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("chronological")}>Chronological</button>
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
              <div className="card-heading"><div><p className="eyebrow">{formalization.status === "structured_draft" ? "YOUR OUTLINE" : "A FEW HELPFUL STARTERS"}</p><h2>{formalization.label}</h2></div><button type="button" onClick={() => { setPublicationType(publicationTypeForFormalization(formalization.kind)); setDraftTitle(formalizationTitle); setDraftBody(formalizationText); setComposerOpen(true); }}>Use in a post</button></div>
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
            {!serverFeed && publications.some((publication) => publication.isPreview) && <p className="feed-preview-note">Sample publications are shown while the public archive is empty. They are examples, not live activity or metrics.</p>}
            {serverFeed && <p className="feed-mode-note">{feedMode === "discovery" ? "Discovery uses text relevance, freshness, and verification status. It excludes subscriptions, contributions, and paid promotion." : feedMode === "following" ? "Following shows public work tagged with the topics you explicitly follow." : feedMode === "verified" ? "Verified shows public work whose status is verified." : "Chronological shows public work by publication time."}{feedLoading ? " Refreshing…" : ""}</p>}
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
                  <div className="publication-label"><span>{publication.type}</span>{publication.isPreview && <span className="status processing">PREVIEW EXAMPLE</span>}<span className={publication.status === "Verified" ? "status verified" : "status processing"}>{publication.status === "Verified" ? "✓ VERIFIED" : "◌ PROCESSING"}</span></div>
                  <h2>{publication.title}</h2>
                  <p>{publication.excerpt}</p>
                  {publication.why?.length ? <p className="feed-signal"><strong>Why you see this:</strong> {publication.why.join(" · ")}</p> : null}
                  {publication.kind === "video" && <div className="video-preview"><span className="play">▶</span><span>03:42 · Sources and Git tree attached</span></div>}
                  <div className="topic-row">{publication.topics.map((topic) => <button type="button" key={topic} onClick={() => setQuery(topic)}>#{topic.replaceAll(" ", "")}</button>)}</div>
                </div>
                <div className="publication-footer">
                  <button type="button" onClick={() => reactToPublication(publication)}>✦ {publication.reactions}</button>
                  <button type="button" onClick={() => loadDiscussion(publication)}>◌ {publication.comments}</button>
                  <button type="button" onClick={() => setFeedPreference(publication, publication.favorite ? "neutral" : "favorite")}>{publication.favorite ? "★ Favorite" : "☆ Favorite"}</button>
                  <button type="button" onClick={() => setFeedPreference(publication, "less_like")}>Less like this</button>
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
          <div className="ranking-mode"><span className="mode-dot" />{feedMode === "discovery" ? "Discovery" : feedMode === "verified" ? "Verified work" : "Chronological"}<button type="button" onClick={() => setFeedMode(feedMode === "chronological" ? "discovery" : "chronological")}>{feedMode === "chronological" ? "Use discovery" : "Use chronological"}</button></div>
          {showAdvanced && <div className="sliders">
            {(Object.keys(ranking) as Array<keyof typeof ranking>).map((key) => (
              <label key={key}><span>{key}<b>{ranking[key]}%</b></span><input type="range" min="0" max="100" value={ranking[key]} onChange={(event) => setRankingValue(key, Number(event.target.value))} /></label>
            ))}
            <div className="ranking-actions"><button className="quiet-button" type="button" onClick={() => setRanking({ relevance: 78, freshness: 52, diversity: 66 })}>Reset to balanced</button><button className="quiet-button" type="button" disabled={rankingSaving} onClick={saveRankingPreferences}>{rankingSaving ? "Saving…" : "Save preferences"}</button></div>
          </div>}
          <a href="#how-ranking-works">How this feed works →</a>
        </section>

        <section className="topics-card">
          <div className="card-heading"><h2>Topics to follow</h2><button type="button" onClick={() => setNotice("Following a topic shapes your Following feed. It never changes anyone’s reach.")}>How it works</button></div>
          <div className="followed-topics"><button type="button" onClick={() => followTopic("open-science")}>#OpenScience</button><button type="button" onClick={() => followTopic("quantum-education")}>#QuantumEducation</button><button type="button" onClick={() => followTopic("climate-systems")}>#ClimateSystems</button><button type="button" onClick={() => followTopic("community-code")}>#CommunityCode</button></div>
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
          <label>Format<select value={publicationType} onChange={(event) => setPublicationType(event.target.value)}>{publicationTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          <label>Title<input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Give the work a clear, specific name" autoFocus /></label>
          <label>Context<textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} placeholder="Explain what this is, who it helps, and how others can use it." rows={5} /></label>
              <label>Topics (optional)<input value={draftTopics} onChange={(event) => setDraftTopics(event.target.value)} placeholder="Open science, climate systems, teaching" /></label>
              <label>External video URL (optional)<input value={externalMediaUrl} onChange={(event) => setExternalMediaUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=... or TikTok video URL" /></label>
          <label>Attach evidence<input type="file" multiple accept=".pdf,.docx,.odt,.xlsx,.ods,.csv,.pptx,.odp,.epub,.zip,.txt,video/*" onChange={(event) => setAttachedFiles(Array.from(event.currentTarget.files ?? []))} /></label>
          {attachedFiles.length > 0 && <p className="attachment-summary">{attachedFiles.length} artifact{attachedFiles.length === 1 ? "" : "s"} ready for hashing and upload.</p>}
          <div className="composer-proof"><span>✓</span><p>A timestamped provenance receipt will be created. It records your Scholarium publication event; it does not replace copyright registration.</p></div>
          <div className="composer-actions"><button className="quiet-button" type="button" onClick={() => setComposerOpen(false)}>Save draft</button><button className="publish-button" type="submit" disabled={publishing}>{publishing ? "Publishing…" : "Publish now"}</button></div>
        </form>
      </div>}
      {discussionPublication && <div className="modal-backdrop" role="presentation">
        <section className="composer discussion-panel" aria-label={`Discussion for ${discussionPublication.title}`}>
          <div className="composer-header"><div><p className="eyebrow">VERSION-BOUND DISCUSSION</p><h2>{discussionPublication.title}</h2></div><button type="button" className="more-button" onClick={() => setDiscussionPublication(null)} aria-label="Close discussion">×</button></div>
          <p className="discussion-intro">Comments stay connected to this public publication version. Threads stop after one reply level, and reports open a traceable human-review case.</p>
          {discussionPublication.isPreview ? <p className="feed-preview-note">This is a sample publication. It has no live discussion.</p> : <>
            <div className="discussion-comments" aria-live="polite">{discussionLoading ? <p>Loading discussion…</p> : discussionComments.length === 0 ? <p>No public comments yet. Be specific, constructive, and cite sources when useful.</p> : discussionComments.map((comment) => <article key={comment.id} className={comment.parentCommentId ? "discussion-comment reply" : "discussion-comment"}><strong>{comment.author}</strong><span>{new Date(comment.createdAt).toLocaleString()}</span><p>{comment.body}</p></article>)}</div>
            <form className="discussion-form" onSubmit={addComment}><label>Contribute a constructive comment<textarea value={discussionDraft} maxLength={1200} onChange={(event) => setDiscussionDraft(event.target.value)} placeholder="What does this work clarify, challenge, or invite others to test?" rows={4} /></label><div className="composer-actions"><button className="quiet-button" type="button" onClick={reportDiscussionPublication}>Report this work</button><button className="publish-button" type="submit" disabled={discussionSaving}>{discussionSaving ? "Posting…" : "Post comment"}</button></div></form>
          </>}
        </section>
      </div>}
      {profileOpen && <div className="modal-backdrop" role="presentation">
        <section className="composer profile-editor" aria-label="Profile customization">
          <div className="composer-header"><div><p className="eyebrow">YOUR PROFILE</p><h2>Make Scholarium yours</h2></div><button type="button" className="more-button" onClick={() => setProfileOpen(false)} aria-label="Close profile preferences">×</button></div>
          <div className="profile-banner-preview" style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : undefined}><span className="avatar avatar-you profile-avatar-preview" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : undefined}>{avatarPreview ? "" : "JS"}</span></div>
          {!session.displayName ? <section className="account-setup identity-entry"><p className="eyebrow">SIGN IN WITH BOUNDARIES</p><h3>Choose the identity you want to use</h3><p>Each provider creates a separate Scholarium identity until you explicitly request a future account link. Only basic verified identity data is used; provider tokens are never stored as profile data.</p><div className="identity-entry-grid"><a className="quiet-button auth-link" href={session.signInPath}>Continue with ChatGPT</a><a className="quiet-button auth-link" href={session.googleSignInPath}>Continue with Google</a><a className="quiet-button auth-link" href={session.githubSignInPath}>Continue with GitHub</a><a className="quiet-button auth-link" href={session.paypalSignInPath}>Continue with PayPal</a></div></section> : <>
          {accountReady === false && <section className="account-setup"><p className="eyebrow">FIRST, SET UP YOUR ACCOUNT</p><h3>How will you use Scholarium?</h3><p>Your role helps us apply the right safety and visibility defaults. It does not affect ranking.</p><label>Primary role<select value={accountRole} onChange={(event) => setAccountRole(event.target.value)}><option value="student">Student</option><option value="teacher">Teacher</option><option value="professional">Professional</option><option value="amateur">Independent learner</option><option value="reader">Reader</option><option value="supporter">Supporter</option></select></label><label>Age band<select value={accountAgeBand} onChange={(event) => setAccountAgeBand(event.target.value)}><option value="adult">Adult</option><option value="minor">Minor</option><option value="unknown">Prefer not to say</option></select></label><button className="publish-button" type="button" disabled={accountSaving} onClick={createAccount}>{accountSaving ? "Creating profile…" : "Create my Scholarium profile"}</button></section>}
          {accountReady === null && <p className="account-loading">Checking your connected profile…</p>}
          {accountReady && <><div className="profile-upload-grid">
            <label>Profile picture<input type="file" accept="image/png,image/jpeg,image/webp" disabled={profileMediaSaving !== null} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadProfileMedia("avatar", file); }} />{profileMediaSaving === "avatar" && <small>Saving picture…</small>}</label>
            <label>Profile banner<input type="file" accept="image/png,image/jpeg,image/webp" disabled={profileMediaSaving !== null} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void uploadProfileMedia("banner", file); }} />{profileMediaSaving === "banner" && <small>Saving banner…</small>}</label>
          </div>
          <fieldset className="profile-fieldset"><legend>Colour scheme</legend><div className="theme-options">{(["scholarium-dark", "scholarium-light", "midnight-code", "paper-library"] as ColorScheme[]).map((scheme) => <button className={colorScheme === scheme ? "theme-choice selected" : "theme-choice"} type="button" key={scheme} onClick={() => setColorScheme(scheme)}>{scheme.replaceAll("-", " ")}</button>)}</div></fieldset>
          <label>Accent colour<input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} /></label>
          <label className="toggle-label"><input type="checkbox" checked={badgeVisibility} onChange={(event) => setBadgeVisibility(event.target.checked)} /> Make my ecosystem-maturity badge visible when earned</label>
          <div className="badge-row">{badgeVisibility && <span>Recognition is contribution-based — never purchased</span>}</div>
          <label className="toggle-label"><input type="checkbox" checked={localInsightsEnabled} onChange={(event) => updateLocalInsights(event.target.checked)} /> Enable local-only activity insights on this device</label>
          <div className="local-insights-card"><strong>Private activity snapshot</strong>{localInsightsEnabled ? <span>{localInsightCounts.formalizationGuides} guide{localInsightCounts.formalizationGuides === 1 ? "" : "s"} created · {localInsightCounts.publicationDrafts} publication draft{localInsightCounts.publicationDrafts === 1 ? "" : "s"} started. Kept only in this browser.</span> : <span>Off by default. No activity snapshot is collected or sent anywhere.</span>}</div>
          <div className="profile-tools"><strong>Attach your learning tools</strong><span>QuaNthoR, Synthia, SecuredMe Blog, Codex/OpenAI, and Antigravity/Gemini are consent-first profile connections. Provider sessions and tokens stay with their provider.</span><div className="tool-actions">{profileToolOptions.map((tool) => <button className="quiet-button" type="button" key={tool.id} disabled={connectingTool !== null} onClick={() => tool.id === "quanthor" ? (setProfileOpen(false), setView("formalize")) : prepareToolConnection(tool.id, tool.label)}>{connectingTool === tool.id ? "Preparing…" : tool.label}</button>)}</div></div>
          <div className="composer-proof"><span>◌</span><p>Profile images upload only after you choose a file and remain private to your account until a future public-profile visibility control is approved. Identity verification uses a document provider and a passkey: Scholarium never stores ID images or fingerprint data.</p></div>
          <div className="composer-actions"><a className="quiet-button auth-link" href="/api/v1/account/export">Export my data</a><a className="quiet-button auth-link" href={session.signOutPath}>Sign out</a><button className="quiet-button" type="button" onClick={() => setProfileOpen(false)}>Cancel</button><button className="publish-button" type="button" disabled={accountSaving} onClick={saveProfilePreferences}>{accountSaving ? "Saving…" : "Save preferences"}</button></div></>}</>}
        </section>
      </div>}

      {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button></div>}
    </main>
  );
}
