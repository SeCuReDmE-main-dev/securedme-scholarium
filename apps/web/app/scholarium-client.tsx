"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { quantechProviderSurface } from "../lib/quantech-render-request";
import { publicationTypeForFormalization, publicationTypeOptions } from "../lib/publication-types";

type View = "signal" | "library" | "studio" | "formalize" | "migration" | "saved";
type FeedMode = "chronological" | "discovery" | "following" | "verified";
type ColorScheme = "scholarium-dark" | "scholarium-light" | "midnight-code" | "paper-library";
type Publication = {
  id: string;
  author: string;
  authorPublicId?: string | null;
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
  scorecard?: { explicitSatisfaction: number; personalRelevance: number; researchContext: number } | null;
  externalMedia?: Array<{ provider: "tiktok" | "youtube"; url: string }>;
  repositoryLinks?: Array<{ provider: "github" | "gitlab" | "sourceforge"; url: string }>;
  favorite?: boolean;
  followingAuthor?: boolean;
  profileVisible?: boolean;
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
type SavedCollection = { description: string | null; id: string; itemCount: number; kind: string; title: string };
type SavedItem = { abstract: string; createdAt: string; id: string; publicationId: string; status: string; title: string; type: string };
type MediaWebhookEvent = { channelId: string; eventType: string; receivedAt: string; status: string; videoId: string };
type IntegrationConnection = { expiresAt: string | null; provider: string; scopes: string; status: string; updatedAt: string };
type MediaProductionPlan = {
  accessPolicy: {
    provider: string;
    integration: string;
    freeCompletedRendersPerRollingWindow: number;
    rollingWindowHours: number;
    defaultPreset: "standard" | "high";
    scholariumAccess: string;
    bundledEntitlements: string;
    enforcement: string;
  };
  aspect: "landscape" | "portrait" | "square";
  deliverables: Array<{ name: string; specification: string }>;
  disclaimer: string;
  missing: string[];
  qualityChecks: string[];
  reviewBoundary: { codeProjectAi: string; videoPrism: string };
  quality: {
    preset: "standard" | "high";
    output: {
      width: number;
      height: number;
      videoBitrate: string;
      audioBitrate: string;
      videoCodec: string;
      audioCodec: string;
      pixelFormat: string;
      safeMarginPercent: number;
    };
    review: {
      mode: "none" | "local_videoprism";
      status: string;
      provider: string;
      model: string | null;
      purpose: string;
      privacy: string;
      outputBoundary: string;
    };
  };
  status: "needs_input" | "ready_for_author_review";
  studio: {
    inspirationBoundary: string;
    roles: string[];
    defaultDurationMinutes: number;
    pacing: Record<string, number>;
    audioPolicy: string;
    authorGate: string;
  };
  title: string;
  useCase: string;
};
type QuantechRenderPreparation = {
  requestId: string;
  provider: "QuaNTecH-ViD";
  status: "prepared";
  handoffUrl: string;
  entitlement: {
    status: "scholarium_free_feature" | "bundle_not_connected";
    allowed: true;
    reason: string;
    freeCompletedRendersPerRollingWindow: number;
    rollingWindowHours: number;
  };
  payloadBoundary: {
    transmits: string[];
    excludes: string[];
    scriptDigest: string;
    sourceUrlCount: number;
  };
  reviewBoundary: {
    localOnly: boolean;
    note: string;
  };
  nextStep: string;
};
type QuantechRenderHistoryItem = {
  aspect: MediaProductionPlan["aspect"];
  createdAt: string;
  entitlementStatus: string;
  handoffUrl: string;
  id: string;
  provider: string;
  qualityPreset: "standard" | "high";
  reviewMode: "none" | "local_videoprism";
  scriptDigest: string;
  sourceUrlCount: number;
  status: string;
};
type LiveSessionPlan = {
  agenda: string;
  audienceMode: string;
  createdAt: string;
  id: string;
  moderatorPlan: string;
  replayConsent: boolean;
  scheduledAt: string;
  status: string;
  title: string;
  youthMode: string;
};
type FundingCampaign = {
  beneficiaryStatus: string;
  createdAt: string;
  currency: string;
  deadlineAt: string | null;
  goalCents: number;
  id: string;
  publicProgress: boolean;
  status: string;
  title: string;
};
type AcademiaMigrationItem = { id: string; sourceUrl: string; title: string; abstract: string; topicSlugs: string[]; type: string; selected: boolean; visibility: "private" | "public"; status: string; importedPublicationId?: string | null };
type AcademiaMigration = { id: string; sourceProfileUrl: string; state: string; items: AcademiaMigrationItem[] };
type AccessibilityPreference = { keyboardFirst: boolean; reducedMotion: boolean; screenReaderOptimized: boolean };
type NotificationPreference = { channels: string[]; digestCadence: "off" | "daily" | "weekly"; topicAlerts: boolean; moderationAlerts: boolean };
type TranslationPreference = { allowPublicationTranslation: boolean; glossaryTerms: string[]; interfaceLanguage: string; showOriginalFirst: boolean };
type ArchiveManifest = {
  id: string;
  provider: string;
  providerPath: string;
  objectCount: number;
  status: string;
  restoreRequestedAt: string | null;
  resyncRequestedAt: string | null;
  updatedAt: string;
};
const profileToolOptions = [
  { id: "quanthor", label: "QuaNthoR" },
  { id: "synthia", label: "Synthia" },
  { id: "securedme_blog", label: "SecuredMe Blog" },
  { id: "codex_openai", label: "Codex / OpenAI" },
  { id: "antigravity_gemini", label: "Antigravity / Gemini" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
] as const;
const educationToolIds = [
  "orcid",
  "github",
  "zenodo",
  "google_drive",
  "youtube",
  "quanthor",
  "synthia",
  "securedme_blog",
  "codex_openai",
  "antigravity_gemini",
] as const;
const suiteThemeAssets: Record<ColorScheme, { banner: string; logo: string }> = {
  "scholarium-dark": {
    banner: "/brand/education/securedme-education-banner-dark-thin.webp",
    logo: "/brand/education/securedme-education-logo-dark.webp",
  },
  "scholarium-light": {
    banner: "/brand/education/securedme-education-banner-light-thin.webp",
    logo: "/brand/education/securedme-education-logo-light.webp",
  },
  "midnight-code": {
    banner: "/brand/education/securedme-education-banner-dark-thin.webp",
    logo: "/brand/education/securedme-education-logo-dark.webp",
  },
  "paper-library": {
    banner: "/brand/education/securedme-education-banner-light-thin.webp",
    logo: "/brand/education/securedme-education-logo-light.webp",
  },
};

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
  authorPublicId?: string | null;
  comments?: number;
  createdAt: string;
  externalMedia?: Array<{ provider: "tiktok" | "youtube"; url: string }>;
  favorite?: boolean;
  followingAuthor?: boolean;
  profileVisible?: boolean;
  feedSignal?: { classification: string; reasons: string[]; scorecard?: { explicitSatisfaction: number; personalRelevance: number; researchContext: number } | null };
  id: string;
  reactions?: number;
  repositoryLinks?: Array<{ provider: "github" | "gitlab" | "sourceforge"; url: string }>;
  status: string;
  title: string;
  topics?: string[];
  type: string;
};
type LibrarySearchResult = ApiPublication & { reasons: string[]; score: number; topics: Array<{ label: string; slug: string }> };
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

const providerConnectionLabel = (status: string | undefined) => {
  switch (status) {
    case "pending_consent":
      return "Prepared — consent pending";
    case "connected":
      return "Connected";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default:
      return "Not prepared";
  }
};

const fromApiPublication = (publication: ApiPublication): Publication => ({
  id: publication.id,
  author: publication.author,
  authorPublicId: publication.authorPublicId,
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
  externalMedia: publication.externalMedia ?? [],
  repositoryLinks: publication.repositoryLinks ?? [],
  kind: ["video", "short_video", "live_replay"].includes(publication.type) ? "video" : ["project_update", "school_project", "software_project", "git_tree"].includes(publication.type) ? "project" : "paper",
  classification: publication.feedSignal?.classification,
  scorecard: publication.feedSignal?.scorecard,
  favorite: publication.favorite,
  followingAuthor: publication.followingAuthor,
  profileVisible: publication.profileVisible,
  why: publication.feedSignal?.reasons,
});

const navItems: Array<{ id: View; label: string; icon: string }> = [
  { id: "signal", label: "Signal", icon: "⌁" },
  { id: "library", label: "Library", icon: "▤" },
  { id: "studio", label: "Studio", icon: "◉" },
  { id: "formalize", label: "Formalize", icon: "◇" },
  { id: "saved", label: "Saved", icon: "▱" },
  { id: "migration", label: "Migrate", icon: "⇆" },
];

export function ScholariumClient({ session }: { session: { displayName: string | null; provider: "chatgpt" | "google" | "github" | "paypal" | null; signInPath: string; googleSignInPath: string; githubSignInPath: string; paypalSignInPath: string; signOutPath: string } }) {
  const [view, setView] = useState<View>("signal");
  const [query, setQuery] = useState("");
  const [libraryType, setLibraryType] = useState("");
  const [libraryVerified, setLibraryVerified] = useState(false);
  const [libraryResults, setLibraryResults] = useState<LibrarySearchResult[]>([]);
  const [librarySearchLoading, setLibrarySearchLoading] = useState(false);
  const [librarySearchError, setLibrarySearchError] = useState<string | null>(null);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedCollectionTitle, setSavedCollectionTitle] = useState("");
  const [savedCollectionSaving, setSavedCollectionSaving] = useState(false);
  const [selectedSavedCollectionId, setSelectedSavedCollectionId] = useState<string | null>(null);
  const [publications, setPublications] = useState(initialPublications);
  const [feedMode, setFeedMode] = useState<FeedMode>("discovery");
  const [serverFeed, setServerFeed] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [pendingLiveFeed, setPendingLiveFeed] = useState<Publication[] | null>(null);
  const [liveUpdateCount, setLiveUpdateCount] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [publicationType, setPublicationType] = useState("research_article");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftTopics, setDraftTopics] = useState("");
  const [externalMediaUrl, setExternalMediaUrl] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [ranking, setRanking] = useState({ relevance: 78, freshness: 52, diversity: 66 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>("scholarium-dark");
  const [accentColor, setAccentColor] = useState("#2157ee");
  const [badgeVisibility, setBadgeVisibility] = useState(true);
  const [publicProfileVisible, setPublicProfileVisible] = useState(false);
  const [keyboardFirst, setKeyboardFirst] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(false);
  const [digestCadence, setDigestCadence] = useState<NotificationPreference["digestCadence"]>("off");
  const [topicAlerts, setTopicAlerts] = useState(true);
  const [moderationAlerts, setModerationAlerts] = useState(true);
  const [interfaceLanguage, setInterfaceLanguage] = useState("en");
  const [showOriginalFirst, setShowOriginalFirst] = useState(true);
  const [allowPublicationTranslation, setAllowPublicationTranslation] = useState(false);
  const [glossaryTermsInput, setGlossaryTermsInput] = useState("");
  const [readerPreferencesSaving, setReaderPreferencesSaving] = useState(false);
  const [archiveManifests, setArchiveManifests] = useState<ArchiveManifest[]>([]);
  const [archiveProvider, setArchiveProvider] = useState("google_drive");
  const [archivePath, setArchivePath] = useState("");
  const [archiveObjectCount, setArchiveObjectCount] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [orcidInput, setOrcidInput] = useState("");
  const [orcidStatus, setOrcidStatus] = useState<"claimed" | "none">("none");
  const [orcidSaving, setOrcidSaving] = useState(false);
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
  const [integrationConnections, setIntegrationConnections] = useState<Record<string, IntegrationConnection>>({});
  const [mediaWebhookEvents, setMediaWebhookEvents] = useState<MediaWebhookEvent[]>([]);
  const [mediaWebhookTraceLoading, setMediaWebhookTraceLoading] = useState(false);
  const [mediaProductionTitle, setMediaProductionTitle] = useState("");
  const [mediaProductionScript, setMediaProductionScript] = useState("");
  const [mediaProductionAspect, setMediaProductionAspect] = useState<MediaProductionPlan["aspect"]>("landscape");
  const [mediaProductionQuality, setMediaProductionQuality] = useState<"standard" | "high">("standard");
  const [mediaProductionReviewMode, setMediaProductionReviewMode] = useState<"none" | "local_videoprism">("none");
  const [mediaProductionPlan, setMediaProductionPlan] = useState<MediaProductionPlan | null>(null);
  const [mediaProductionLoading, setMediaProductionLoading] = useState(false);
  const [quantechPreparation, setQuantechPreparation] = useState<QuantechRenderPreparation | null>(null);
  const [quantechPreparationLoading, setQuantechPreparationLoading] = useState(false);
  const [quantechRequests, setQuantechRequests] = useState<QuantechRenderHistoryItem[]>([]);
  const [quantechHistoryLoading, setQuantechHistoryLoading] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const [liveAgenda, setLiveAgenda] = useState("");
  const [liveScheduledAt, setLiveScheduledAt] = useState("");
  const [liveAudienceMode, setLiveAudienceMode] = useState("public_review");
  const [liveModeratorPlan, setLiveModeratorPlan] = useState("author_moderated");
  const [liveReplayConsent, setLiveReplayConsent] = useState(false);
  const [liveSessions, setLiveSessions] = useState<LiveSessionPlan[]>([]);
  const [livePlanningLoading, setLivePlanningLoading] = useState(false);
  const [fundingCampaigns, setFundingCampaigns] = useState<FundingCampaign[]>([]);
  const [fundingTitle, setFundingTitle] = useState("");
  const [fundingPurpose, setFundingPurpose] = useState("");
  const [fundingGoalCents, setFundingGoalCents] = useState(5000);
  const [fundingCurrency, setFundingCurrency] = useState("USD");
  const [fundingDeadlineAt, setFundingDeadlineAt] = useState("");
  const [fundingPublicProgress, setFundingPublicProgress] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [paypalCheckoutLoading, setPaypalCheckoutLoading] = useState(false);
  const [academiaProfileUrl, setAcademiaProfileUrl] = useState("");
  const [academiaSourceLines, setAcademiaSourceLines] = useState("");
  const [academiaOwnershipConfirmed, setAcademiaOwnershipConfirmed] = useState(false);
  const [academiaMigration, setAcademiaMigration] = useState<AcademiaMigration | null>(null);
  const [academiaMigrating, setAcademiaMigrating] = useState(false);
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
  const appliedFeedPublicationIds = useRef(new Set<string>());
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
    if (!session.displayName || !accountReady) return;
    let active = true;
    fetch("/api/v1/author-identifiers")
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { identifiers?: Array<{ canonicalUrl: string; scheme: string; status: "claimed" | "authenticated" }> } }))
      .then(({ ok, payload }) => {
        if (!active || !ok) return;
        const orcid = payload.identifiers?.find((identifier) => identifier.scheme === "orcid");
        if (!orcid) return;
        setOrcidInput(orcid.canonicalUrl);
        setOrcidStatus(orcid.status === "authenticated" ? "claimed" : orcid.status);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    fetch("/api/v1/profile-preferences")
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { preference?: { accentColor?: string; badgeVisibility?: string; colorScheme?: ColorScheme; profileVisibility?: string } | null } }))
      .then(({ ok, payload }) => {
        if (!active || !ok || !payload.preference) return;
        if (payload.preference.accentColor) setAccentColor(payload.preference.accentColor);
        if (payload.preference.colorScheme) setColorScheme(payload.preference.colorScheme);
        setBadgeVisibility(payload.preference.badgeVisibility !== "private");
        setPublicProfileVisible(payload.preference.profileVisibility === "public");
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    Promise.all([
      fetch("/api/v1/accessibility-preferences").then(async (response) => ({ ok: response.ok, payload: await response.json() as { preference?: AccessibilityPreference } })),
      fetch("/api/v1/notification-preferences").then(async (response) => ({ ok: response.ok, payload: await response.json() as { preference?: NotificationPreference } })),
      fetch("/api/v1/translation-preferences").then(async (response) => ({ ok: response.ok, payload: await response.json() as { preference?: TranslationPreference } })),
    ]).then(([accessibility, notifications, translations]) => {
      if (!active) return;
      if (accessibility.ok && accessibility.payload.preference) {
        setKeyboardFirst(accessibility.payload.preference.keyboardFirst);
        setReducedMotion(accessibility.payload.preference.reducedMotion);
        setScreenReaderOptimized(accessibility.payload.preference.screenReaderOptimized);
      }
      if (notifications.ok && notifications.payload.preference) {
        setNotificationEmail(notifications.payload.preference.channels.includes("email"));
        setDigestCadence(notifications.payload.preference.digestCadence);
        setTopicAlerts(notifications.payload.preference.topicAlerts);
        setModerationAlerts(notifications.payload.preference.moderationAlerts);
      }
      if (translations.ok && translations.payload.preference) {
        setInterfaceLanguage(translations.payload.preference.interfaceLanguage);
        setShowOriginalFirst(translations.payload.preference.showOriginalFirst);
        setAllowPublicationTranslation(translations.payload.preference.allowPublicationTranslation);
        setGlossaryTermsInput(translations.payload.preference.glossaryTerms.join(", "));
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    setArchiveLoading(true);
    fetch("/api/v1/archive-manifests")
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { manifests?: ArchiveManifest[] } }))
      .then(({ ok, payload }) => {
        if (!active || !ok) return;
        setArchiveManifests(payload.manifests ?? []);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setArchiveLoading(false); });
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    if (!session.displayName || !accountReady) return;
    let active = true;
    fetch("/api/v1/integrations")
      .then(async (response) => ({
        ok: response.ok,
        payload: await response.json() as {
          connections?: IntegrationConnection[];
          integrations?: Array<{ connection?: IntegrationConnection | null; id: string }>;
        },
      }))
      .then(({ ok, payload }) => {
        if (!active || !ok) return;
        const rows = payload.connections ?? payload.integrations?.flatMap((integration) => integration.connection ? [integration.connection] : []) ?? [];
        setIntegrationConnections(Object.fromEntries(rows.map((connection) => [connection.provider, connection])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [accountReady, session.displayName]);

  useEffect(() => {
    let active = true;
    let receivedInitialResponse = false;
    const clearPendingUpdate = window.setTimeout(() => {
      if (!active) return;
      setPendingLiveFeed(null);
      setLiveUpdateCount(0);
    }, 0);
    const refresh = () => {
      setFeedLoading(true);
      const params = new URLSearchParams({ mode: feedMode });
      if (query.trim()) params.set("q", query.trim());
      fetch(`/api/v1/publications?${params.toString()}`)
        .then(async (response) => ({ ok: response.ok, payload: await response.json() as { publications?: ApiPublication[] } }))
        .then(({ ok, payload }) => {
          if (!active || !ok || !payload.publications) return;
          if (payload.publications.length || query.trim() || feedMode !== "discovery") {
            const incoming = payload.publications.map(fromApiPublication);
            if (receivedInitialResponse) {
              const newCount = incoming.filter((publication) => !appliedFeedPublicationIds.current.has(publication.id)).length;
              if (newCount > 0) {
                setPendingLiveFeed(incoming);
                setLiveUpdateCount(newCount);
                return;
              }
            }
            receivedInitialResponse = true;
            appliedFeedPublicationIds.current = new Set(incoming.map((publication) => publication.id));
            setPendingLiveFeed(null);
            setLiveUpdateCount(0);
            setPublications(incoming);
            setServerFeed(true);
          } else {
            receivedInitialResponse = true;
            appliedFeedPublicationIds.current = new Set();
            setPendingLiveFeed(null);
            setLiveUpdateCount(0);
            setServerFeed(false);
            setPublications(initialPublications);
          }
        })
        .catch(() => undefined)
        .finally(() => { if (active) setFeedLoading(false); });
    };
    const timeout = window.setTimeout(refresh, query.trim() ? 220 : 0);
    const liveRefresh = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearTimeout(clearPendingUpdate); window.clearTimeout(timeout); window.clearInterval(liveRefresh); };
  }, [feedMode, query]);

  const showPendingLiveFeed = () => {
    if (!pendingLiveFeed) return;
    appliedFeedPublicationIds.current = new Set(pendingLiveFeed.map((publication) => publication.id));
    setPublications(pendingLiveFeed);
    setPendingLiveFeed(null);
    setLiveUpdateCount(0);
    setNotice("Your live feed is up to date.");
  };

  useEffect(() => {
    if (view !== "library" || query.trim().length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLibrarySearchLoading(true);
      setLibrarySearchError(null);
      const parameters = new URLSearchParams({ limit: "25", q: query.trim() });
      if (libraryType) parameters.set("type", libraryType);
      if (libraryVerified) parameters.set("verified", "true");
      fetch(`/api/v1/search?${parameters.toString()}`)
        .then(async (response) => ({ ok: response.ok, payload: await response.json() as { error?: string; results?: LibrarySearchResult[] } }))
        .then(({ ok, payload }) => {
          if (!active) return;
          if (!ok) { setLibrarySearchError(payload.error ?? "The library search could not be completed."); return; }
          setLibraryResults(payload.results ?? []);
        })
        .catch(() => { if (active) setLibrarySearchError("The library search could not be completed."); })
        .finally(() => { if (active) setLibrarySearchLoading(false); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [libraryType, libraryVerified, query, view]);

  useEffect(() => {
    if (view !== "saved" || !selectedSavedCollectionId) return;
    let active = true;
    fetch(`/api/v1/collection-items?collectionId=${encodeURIComponent(selectedSavedCollectionId)}`)
      .then(async (response) => ({ ok: response.ok, payload: await response.json() as { error?: string; items?: SavedItem[] } }))
      .then(({ ok, payload }) => {
        if (!active) return;
        if (!ok) { setNotice(payload.error ?? "Saved work could not be loaded."); setSavedItems([]); return; }
        setSavedItems(payload.items ?? []);
      })
      .catch(() => { if (active) setNotice("Saved work could not be loaded."); })
      .finally(() => { if (active) setSavedLoading(false); });
    return () => { active = false; };
  }, [selectedSavedCollectionId, view]);

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
      setIntegrationConnections((current) => ({
        ...current,
        [provider]: {
          expiresAt: null,
          provider,
          scopes: "[]",
          status: "pending_consent",
          updatedAt: new Date().toISOString(),
        },
      }));
      setNotice(`${label}: connection prepared. ${payload.nextStep ?? "Review the requested access before continuing."}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The connection could not be prepared.");
    } finally {
      setConnectingTool(null);
    }
  };

  const quantechConnection = integrationConnections.quantech_vid;
  const activeEducationToolCount = Math.min(
    10,
    Object.values(integrationConnections).filter((connection) =>
      educationToolIds.includes(connection.provider as (typeof educationToolIds)[number]) &&
      (connection.status === "pending_consent" || connection.status === "connected"),
    ).length,
  );
  const badgeTheme = colorScheme === "scholarium-light" || colorScheme === "paper-library" ? "light" : "dark";
  const activeEducationBadgeAsset = activeEducationToolCount > 0 ? `/brand/badges/${badgeTheme}/${activeEducationToolCount}.webp` : null;
  const activeEducationIconStage = Math.min(Math.max(activeEducationToolCount, 1), 10);
  const activeEducationIconAsset = `/brand/icons/${activeEducationIconStage}.webp`;
  const currentSuiteAssets = suiteThemeAssets[colorScheme];
  const currentCampaignBanner = `/brand/campaigns/web/${activeEducationIconStage}.webp`;

  const loadMediaWebhookTrace = async () => {
    setMediaWebhookTraceLoading(true);
    try {
      const response = await fetch("/api/v1/media-webhook-events?provider=youtube");
      const payload = await response.json() as { error?: string; events?: MediaWebhookEvent[] };
      if (!response.ok) throw new Error(payload.error ?? "The provider delivery trace could not be read.");
      setMediaWebhookEvents(payload.events ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The provider delivery trace could not be read.");
    } finally {
      setMediaWebhookTraceLoading(false);
    }
  };

  const buildMediaProductionPlan = async () => {
    setMediaProductionLoading(true);
    try {
      const response = await fetch("/api/v1/video-production-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aspect: mediaProductionAspect, script: mediaProductionScript, title: mediaProductionTitle, qualityPreset: mediaProductionQuality, reviewMode: mediaProductionReviewMode }) });
      const payload = await response.json() as { error?: string; plan?: MediaProductionPlan };
      if (!response.ok || !payload.plan) throw new Error(payload.error ?? "The production brief could not be prepared.");
      setMediaProductionPlan(payload.plan);
      setQuantechPreparation(null);
      trackLocalInsight("formalizationGuides");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The production brief could not be prepared.");
    } finally {
      setMediaProductionLoading(false);
    }
  };

  const prepareQuantechHandoff = async () => {
    setQuantechPreparationLoading(true);
    try {
      const response = await fetch("/api/v1/quantech-render-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aspect: mediaProductionAspect,
          qualityPreset: mediaProductionQuality,
          reviewMode: mediaProductionReviewMode,
          script: mediaProductionScript,
          title: mediaProductionTitle,
        }),
      });
      const payload = await response.json() as { error?: string; prepared?: QuantechRenderPreparation };
      if (!response.ok || !payload.prepared) throw new Error(payload.error ?? "The QuaNTecH provider handoff could not be prepared.");
      setQuantechPreparation(payload.prepared);
      setQuantechRequests((current) => [{
        aspect: mediaProductionAspect,
        createdAt: new Date().toISOString(),
        entitlementStatus: payload.prepared.entitlement.status,
        handoffUrl: payload.prepared.handoffUrl,
        id: payload.prepared.requestId,
        provider: payload.prepared.provider,
        qualityPreset: mediaProductionQuality,
        reviewMode: mediaProductionReviewMode,
        scriptDigest: payload.prepared.payloadBoundary.scriptDigest,
        sourceUrlCount: payload.prepared.payloadBoundary.sourceUrlCount,
        status: payload.prepared.status,
      }, ...current.filter((request) => request.id !== payload.prepared?.requestId)].slice(0, 12));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The QuaNTecH provider handoff could not be prepared.");
    } finally {
      setQuantechPreparationLoading(false);
    }
  };

  const loadQuantechHistory = async () => {
    setQuantechHistoryLoading(true);
    try {
      const response = await fetch("/api/v1/quantech-render-request");
      const payload = await response.json() as { error?: string; requests?: QuantechRenderHistoryItem[] };
      if (!response.ok) throw new Error(payload.error ?? "The QuaNTecH request history could not be loaded.");
      setQuantechRequests(payload.requests ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The QuaNTecH request history could not be loaded.");
    } finally {
      setQuantechHistoryLoading(false);
    }
  };

  const loadLiveSessions = async () => {
    setLivePlanningLoading(true);
    try {
      const response = await fetch("/api/v1/live-sessions");
      const payload = await response.json() as { error?: string; sessions?: LiveSessionPlan[] };
      if (!response.ok) throw new Error(payload.error ?? "Live planning history could not be loaded.");
      setLiveSessions(payload.sessions ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Live planning history could not be loaded.");
    } finally {
      setLivePlanningLoading(false);
    }
  };

  const createLiveSession = async () => {
    if (!accountReady) { setProfileOpen(true); setNotice("Create your Scholarium profile before planning a Live."); return; }
    setLivePlanningLoading(true);
    try {
      const response = await fetch("/api/v1/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agenda: liveAgenda,
          audienceMode: liveAudienceMode,
          moderatorPlan: liveModeratorPlan,
          replayConsent: liveReplayConsent,
          scheduledAt: liveScheduledAt,
          title: liveTitle,
        }),
      });
      const payload = await response.json() as { error?: string; session?: LiveSessionPlan };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "The Live session could not be planned.");
      setLiveSessions((current) => [payload.session!, ...current.filter((session) => session.id !== payload.session?.id)].slice(0, 8));
      setNotice("Live plan saved. Stream keys, chat, polls, and recording stay launch-gated.");
      setLiveTitle("");
      setLiveAgenda("");
      setLiveScheduledAt("");
      setLiveReplayConsent(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The Live session could not be planned.");
    } finally {
      setLivePlanningLoading(false);
    }
  };

  const loadFundingCampaigns = async () => {
    setFundingLoading(true);
    try {
      const response = await fetch("/api/v1/funding-campaigns");
      const payload = await response.json() as { campaigns?: FundingCampaign[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Funding campaigns could not be loaded.");
      setFundingCampaigns(payload.campaigns ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Funding campaigns could not be loaded.");
    } finally {
      setFundingLoading(false);
    }
  };

  const createFundingCampaign = async () => {
    if (!accountReady) { setProfileOpen(true); setNotice("Create your Scholarium profile before preparing a funding campaign."); return; }
    setFundingLoading(true);
    try {
      const response = await fetch("/api/v1/funding-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: fundingCurrency,
          deadlineAt: fundingDeadlineAt,
          goalCents: fundingGoalCents,
          publicProgress: fundingPublicProgress,
          purpose: fundingPurpose,
          title: fundingTitle,
        }),
      });
      const payload = await response.json() as { campaign?: FundingCampaign; error?: string };
      if (!response.ok || !payload.campaign) throw new Error(payload.error ?? "Funding campaign could not be prepared.");
      setFundingCampaigns((current) => [payload.campaign!, ...current.filter((campaign) => campaign.id !== payload.campaign?.id)].slice(0, 8));
      setFundingTitle("");
      setFundingPurpose("");
      setFundingGoalCents(5000);
      setFundingDeadlineAt("");
      setFundingPublicProgress(false);
      setNotice("Funding campaign prepared. Provider/KYC setup is still required before funds can move.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Funding campaign could not be prepared.");
    } finally {
      setFundingLoading(false);
    }
  };

  const startPayPalCheckout = async () => {
    setPaypalCheckoutLoading(true);
    try {
      const response = await fetch("/api/v1/payments/paypal/order", { method: "POST" });
      const payload = await response.json() as { approveUrl?: string; error?: string };
      if (!response.ok || !payload.approveUrl) throw new Error(payload.error ?? "PayPal checkout could not be started.");
      window.location.assign(payload.approveUrl);
    } catch (error) { setNotice(error instanceof Error ? error.message : "PayPal checkout could not be started."); setPaypalCheckoutLoading(false); }
  };

  const academiaItemsFromLines = () => academiaSourceLines.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title = "", abstract = "", sourceUrl = "", topics = ""] = line.split("|").map((part) => part.trim());
    return { abstract, sourceUrl, title, topicSlugs: topics.split(",").map((topic) => topic.trim()).filter(Boolean), type: "research_article" };
  });

  const prepareAcademiaMigration = async () => {
    if (!accountReady) { setProfileOpen(true); setNotice("Create your Scholarium profile before preparing an Academia migration."); return; }
    setAcademiaMigrating(true);
    try {
      const response = await fetch("/api/v1/academia-migrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "draft", items: academiaItemsFromLines(), sourceOwnershipConfirmed: academiaOwnershipConfirmed, sourceProfileUrl: academiaProfileUrl }) });
      const payload = await response.json() as { error?: string; migration?: { id: string } };
      if (!response.ok || !payload.migration) throw new Error(payload.error ?? "The Academia migration draft could not be prepared.");
      const drafts = await fetch("/api/v1/academia-migrations");
      const draftPayload = await drafts.json() as { migrations?: AcademiaMigration[] };
      const migration = (draftPayload.migrations ?? []).find((entry) => entry.id === payload.migration?.id) ?? null;
      setAcademiaMigration(migration);
      setNotice("Migration review created. Every item is private until you choose otherwise during final import.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The Academia migration draft could not be prepared."); }
    finally { setAcademiaMigrating(false); }
  };

  const updateAcademiaItem = (itemId: string, patch: Partial<Pick<AcademiaMigrationItem, "selected" | "visibility">>) => {
    setAcademiaMigration((migration) => migration ? { ...migration, items: migration.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) } : migration);
  };

  const importAcademiaSelection = async () => {
    if (!academiaMigration) return;
    setAcademiaMigrating(true);
    try {
      const response = await fetch("/api/v1/academia-migrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "commit", migrationId: academiaMigration.id, selections: academiaMigration.items.map((item) => ({ itemId: item.id, selected: item.selected && item.status === "pending", visibility: item.visibility })) }) });
      const payload = await response.json() as { error?: string; imported?: Array<{ title: string; visibility: string }> };
      if (!response.ok) throw new Error(payload.error ?? "The selected Academia publications could not be imported.");
      setAcademiaMigration((migration) => migration ? { ...migration, state: "imported", items: migration.items.map((item) => item.selected ? { ...item, status: "imported" } : item) } : migration);
      void loadPublications();
      setNotice(`${payload.imported?.length ?? 0} publication(s) imported. Private remains the default; only your selected public items can enter public discovery.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "The selected Academia publications could not be imported."); }
    finally { setAcademiaMigrating(false); }
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
      const response = await fetch("/api/v1/profile-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accentColor, badgeVisibility: badgeVisibility ? "public" : "private", colorScheme, profileVisibility: publicProfileVisible ? "public" : "private" }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Your profile preferences could not be saved.");
      await saveReaderPreferences();
      setProfileOpen(false);
      setNotice(publicProfileVisible ? "Profile preferences saved. Your public profile can now show your chosen visuals and public work." : "Profile preferences saved. Your profile visuals remain private.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Your profile preferences could not be saved.");
    } finally { setAccountSaving(false); }
  };

  const saveReaderPreferences = async () => {
    if (!accountReady) return;
    setReaderPreferencesSaving(true);
    try {
      const glossaryTerms = glossaryTermsInput.split(",").map((term) => term.trim()).filter(Boolean);
      const channels = ["in_app", ...(notificationEmail ? ["email"] : [])];
      const requests = [
        fetch("/api/v1/accessibility-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyboardFirst, reducedMotion, screenReaderOptimized }) }),
        fetch("/api/v1/notification-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channels, digestCadence, topicAlerts, moderationAlerts }) }),
        fetch("/api/v1/translation-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allowPublicationTranslation, glossaryTerms, interfaceLanguage, showOriginalFirst }) }),
      ];
      const responses = await Promise.all(requests);
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const payload = await failed.json() as { error?: string };
        throw new Error(payload.error ?? "Reader preferences could not be saved.");
      }
    } finally {
      setReaderPreferencesSaving(false);
    }
  };

  const createArchiveManifest = async () => {
    if (!accountReady) return;
    setArchiveSaving(true);
    try {
      const response = await fetch("/api/v1/archive-manifests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: archiveProvider, providerPath: archivePath, objectCount: archiveObjectCount }) });
      const payload = await response.json() as { error?: string; manifest?: ArchiveManifest };
      if (!response.ok) throw new Error(payload.error ?? "Archive manifest could not be saved.");
      if (payload.manifest) setArchiveManifests((items) => [payload.manifest!, ...items.filter((item) => item.id !== payload.manifest!.id)]);
      setArchivePath("");
      setArchiveObjectCount(0);
      setNotice("Archive manifest saved. Restore and resync remain explicit owner actions.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Archive manifest could not be saved.");
    } finally {
      setArchiveSaving(false);
    }
  };

  const requestArchiveAction = async (manifest: ArchiveManifest, action: "restore" | "resync") => {
    setArchiveSaving(true);
    try {
      const response = await fetch("/api/v1/archive-manifests", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: manifest.id, action }) });
      const payload = await response.json() as { error?: string; requestedAt?: string };
      if (!response.ok) throw new Error(payload.error ?? "Archive request could not be recorded.");
      setArchiveManifests((items) => items.map((item) => item.id === manifest.id ? { ...item, status: `${action}_requested`, restoreRequestedAt: action === "restore" ? payload.requestedAt ?? new Date().toISOString() : item.restoreRequestedAt, resyncRequestedAt: action === "resync" ? payload.requestedAt ?? new Date().toISOString() : item.resyncRequestedAt } : item));
      setNotice(`${action === "restore" ? "Restore" : "Resync"} request recorded. No provider token or file bytes were sent.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Archive request could not be recorded.");
    } finally {
      setArchiveSaving(false);
    }
  };

  const saveOrcid = async () => {
    if (!accountReady) return;
    setOrcidSaving(true);
    try {
      const method = orcidInput.trim() ? "PUT" : "DELETE";
      const response = await fetch("/api/v1/author-identifiers", method === "PUT" ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orcid: orcidInput.trim() }) } : { method });
      const payload = await response.json() as { error?: string; identifier?: { canonicalUrl: string; status: "claimed" } };
      if (!response.ok) throw new Error(payload.error ?? "ORCID iD could not be saved.");
      if (method === "DELETE") { setOrcidStatus("none"); setNotice("ORCID claim removed from this account."); }
      else { setOrcidInput(payload.identifier?.canonicalUrl ?? orcidInput); setOrcidStatus("claimed"); setNotice("ORCID iD saved as a private self-claim. It is not displayed as authenticated until ORCID OAuth is connected."); }
    } catch (error) { setNotice(error instanceof Error ? error.message : "ORCID iD could not be saved."); }
    finally { setOrcidSaving(false); }
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
      const externalMediaReference = externalMediaUrl.trim();
      const repositoryReference = repositoryUrl.trim();
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
      let linkedRepository: { provider: "github" | "gitlab" | "sourceforge"; url: string } | null = null;
      if (externalMediaReference && payload.publication.status !== "quarantined") {
        const mediaResponse = await fetch("/api/v1/media-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicationId: payload.publication.id, url: externalMediaReference }) });
        if (!mediaResponse.ok) {
          const mediaPayload = await mediaResponse.json() as { error?: string };
          throw new Error(mediaPayload.error ?? "Publication was created, but its external media link could not be saved.");
        }
        linkedExternalMedia = true;
      }
      if (repositoryReference && payload.publication.status !== "quarantined") {
        const repositoryResponse = await fetch("/api/v1/repository-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicationId: payload.publication.id, url: repositoryReference }) });
        const repositoryPayload = await repositoryResponse.json() as { error?: string; link?: { canonicalUrl: string; provider: "github" | "gitlab" | "sourceforge" } };
        if (!repositoryResponse.ok || !repositoryPayload.link) throw new Error(repositoryPayload.error ?? "Publication was created, but its repository link could not be saved.");
        linkedRepository = { provider: repositoryPayload.link.provider, url: repositoryPayload.link.canonicalUrl };
      }
      const newlyPublished = fromApiPublication({
        abstract: draftBody.trim(),
        author: session.displayName,
        createdAt: new Date().toISOString(),
        id: payload.publication.id,
        status: payload.publication.status,
        title: draftTitle.trim(),
        topics: payload.publication.topicSlugs,
        type,
        repositoryLinks: linkedRepository ? [linkedRepository] : [],
      });
    appliedFeedPublicationIds.current.add(newlyPublished.id);
    setPublications((current) => [newlyPublished, ...current]);
    const artifactCount = attachedFiles.length;
    setDraftTitle("");
    setDraftBody("");
    setDraftTopics("");
    setExternalMediaUrl("");
    setRepositoryUrl("");
    setAttachedFiles([]);
    setComposerOpen(false);
    trackLocalInsight("publicationDrafts");
      const audienceNotice = payload.publication.visibility === "private" ? " This publication is private until guardian consent or verified school supervision permits public discovery." : "";
      const moderationNotice = payload.moderation?.status === "quarantined" ? ` ${payload.moderation.message ?? "This publication was saved privately for a safety review."}` : "";
      const skippedMediaNotice = externalMediaReference && payload.publication.status === "quarantined" ? " The external media link was not attached while this work is quarantined." : "";
      const skippedRepositoryNotice = repositoryReference && payload.publication.status === "quarantined" ? " The repository link was not attached while this work is quarantined." : "";
      setNotice(`Published. Your provenance receipt and safety scan are now processing.${artifactCount ? ` ${uploadedArtifacts} of ${artifactCount} artifact${artifactCount === 1 ? "" : "s"} uploaded.` : ""}${linkedExternalMedia ? " External media reference linked without copying the video." : ""}${linkedRepository ? " Source repository linked; code collaboration stays with its provider." : ""}${audienceNotice}${moderationNotice}${skippedMediaNotice}${skippedRepositoryNotice}`);
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

  const startProject = (publication: Publication) => {
    const repository = publication.repositoryLinks?.[0];
    if (!repository) {
      setNotice("This publication has no linked source repository yet. Scholarium never invents a code project or copies source code without an author-provided link.");
      return;
    }
    setNotice(`Opening the attributed ${repository.provider} repository. Forking, private-project settings, and collaboration permissions stay with that provider.`);
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

  const followAuthor = async (publication: Publication) => {
    if (publication.isPreview || !publication.authorPublicId) return;
    if (!session.displayName || !accountReady) { setProfileOpen(true); setNotice("Create a Scholarium profile before following authors."); return; }
    try {
      const method = publication.followingAuthor ? "DELETE" : "PUT";
      const response = await fetch("/api/v1/user-follows", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicProfileId: publication.authorPublicId }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Author follow preference could not be saved.");
      setPublications((current) => current.map((item) => item.authorPublicId === publication.authorPublicId ? { ...item, followingAuthor: !publication.followingAuthor } : item));
      setNotice(publication.followingAuthor ? `Stopped following ${publication.author}.` : `Following ${publication.author}. Their public work now appears in Following.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Author follow preference could not be saved."); }
  };

  const openSaved = async () => {
    if (!session.displayName || !accountReady) { setProfileOpen(true); setNotice("Create a Scholarium profile before using private saved collections."); return; }
    setView("saved");
    setSavedLoading(true);
    try {
      const response = await fetch("/api/v1/collections");
      const payload = await response.json() as { collections?: SavedCollection[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Saved collections could not be loaded.");
      const available = payload.collections ?? [];
      setSavedCollections(available);
      setSelectedSavedCollectionId((current) => available.some((collection) => collection.id === current) ? current : available[0]?.id ?? null);
      if (!available.length) setSavedItems([]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Saved collections could not be loaded."); }
    finally { setSavedLoading(false); }
  };

  const saveToReadingList = async (publication: Publication) => {
    if (publication.isPreview) { setNotice("Preview examples cannot be saved to a live reading list."); return; }
    if (!requireCommunityAccount()) return;
    try {
      const response = await fetch("/api/v1/collection-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicationId: publication.id }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "This work could not be saved.");
      setNotice("Saved to your private Reading list. It does not affect public reach or your discovery ranking.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "This work could not be saved."); }
  };

  const createSavedCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!savedCollectionTitle.trim()) return;
    setSavedCollectionSaving(true);
    try {
      const response = await fetch("/api/v1/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: savedCollectionTitle.trim() }) });
      const payload = await response.json() as { collection?: SavedCollection; error?: string };
      if (!response.ok || !payload.collection) throw new Error(payload.error ?? "Collection could not be created.");
      setSavedCollections((current) => [...current, payload.collection!]);
      setSavedLoading(true);
      setSelectedSavedCollectionId(payload.collection.id);
      setSavedCollectionTitle("");
      setNotice(`Created private collection: ${payload.collection.title}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Collection could not be created."); }
    finally { setSavedCollectionSaving(false); }
  };

  const removeSavedItem = async (item: SavedItem) => {
    if (!selectedSavedCollectionId) return;
    try {
      const response = await fetch(`/api/v1/collection-items?collectionId=${encodeURIComponent(selectedSavedCollectionId)}&publicationId=${encodeURIComponent(item.publicationId)}`, { method: "DELETE" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Saved work could not be removed.");
      setSavedItems((current) => current.filter((saved) => saved.publicationId !== item.publicationId));
      setSavedCollections((current) => current.map((collection) => collection.id === selectedSavedCollectionId ? { ...collection, itemCount: Math.max(0, collection.itemCount - 1) } : collection));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Saved work could not be removed."); }
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
          <span className="brand-mark"><img src={activeEducationIconAsset} alt="" /></span>
          <span>scholarium</span>
        </a>
        <div className="suite-label">SECUREDME EDUCATION</div>
        <img className="suite-strip-mark" src={currentSuiteAssets.banner} alt="SecuredMe Education suite banner." />

        <nav className="main-nav">
          {navItems.map((item) => (
            <button
              className={view === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => item.id === "saved" ? void openSaved() : setView(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className="nav-item" type="button" onClick={() => setNotice("Your learning circles will appear here.")}>
            <span aria-hidden="true">◌</span> Circles
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
            <h1>{view === "signal" ? "Today’s signal" : view === "library" ? "Your knowledge library" : view === "studio" ? "Creator studio" : view === "saved" ? "Your saved library" : view === "migration" ? "Bring your work with you" : "Formalize with QuaNthoR"}</h1>
            <img className="topbar-suite-logo" src={currentSuiteAssets.logo} alt="SecuredMe Education suite identity sheet." />
          </div>
          <button className="publish-button" type="button" onClick={() => setComposerOpen(true)}>Publish work <span>+</span></button>
        </header>

        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === "library" ? "Search titles, authors, abstracts, topics" : "Search research, people, projects, topics"} />
          <kbd>⌘ K</kbd>
        </label>

        {view === "signal" && <div className="feed-tabs" role="tablist" aria-label="Feed options">
          <button className={feedMode === "discovery" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("discovery")}>Discover</button>
          <button className={feedMode === "following" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => { if (!session.displayName || !accountReady) { setProfileOpen(true); setNotice("Create a profile before opening your Following feed."); return; } setFeedMode("following"); }}>Following</button>
          <button className={feedMode === "verified" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("verified")}>Verified</button>
          <button className={feedMode === "chronological" ? "feed-tab active" : "feed-tab"} type="button" onClick={() => setFeedMode("chronological")}>Chronological</button>
        </div>}

        {view === "migration" ? (
          <section className="library-page academia-migration" aria-label="Academia.edu migration">
            <div className="library-search-card">
              <p className="eyebrow">OWNER-CONFIRMED IMPORT</p>
              <h2>Move selected Academia.edu publications into Scholarium</h2>
              <p>Use this only for a profile you own or are explicitly authorized to import. Scholarium never asks for or stores an Academia password, cookie, or provider token. Nothing is copied until you review it.</p>
              <div className="feature-brand-strip"><img src={currentSuiteAssets.banner} alt="SecuredMe Education suite banner." /></div>
              {!academiaMigration ? <>
                <label>Your Academia.edu profile URL<input value={academiaProfileUrl} onChange={(event) => setAcademiaProfileUrl(event.target.value)} placeholder="https://independent.academia.edu/YourProfile" /></label>
                <label>Selected publication metadata<textarea value={academiaSourceLines} onChange={(event) => setAcademiaSourceLines(event.target.value)} rows={7} placeholder={"One publication per line:\nTitle | short abstract | https://www.academia.edu/… | topic one, topic two"} /></label>
                <label className="toggle-label"><input type="checkbox" checked={academiaOwnershipConfirmed} onChange={(event) => setAcademiaOwnershipConfirmed(event.target.checked)} /> I own this profile or have explicit permission to migrate these selected works.</label>
                <div className="composer-proof"><span>◌</span><p>First we create a private review. Every item starts private. You will choose each item again before final import, and a new Scholarium provenance receipt will record the import event.</p></div>
                <button className="publish-button" type="button" disabled={academiaMigrating} onClick={prepareAcademiaMigration}>{academiaMigrating ? "Preparing review…" : "Create private review"}</button>
              </> : <>
                <p className="feed-preview-note">Source: {academiaMigration.sourceProfileUrl}. Review each work individually; selecting public does not override youth or safety policy.</p>
                <div className="migration-review-list">{academiaMigration.items.map((item) => <article className="publication-card" key={item.id}><div className="publication-body"><p className="eyebrow">{item.type.replaceAll("_", " ")}</p><h3>{item.title}</h3><p>{item.abstract || "No abstract was supplied; add detail after import."}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer noopener">Review source on Academia.edu ↗</a><div className="tool-actions"><label className="toggle-label"><input type="checkbox" disabled={item.status !== "pending"} checked={item.selected} onChange={(event) => updateAcademiaItem(item.id, { selected: event.target.checked })} /> Import this work</label><label>Visibility<select disabled={!item.selected || item.status !== "pending"} value={item.visibility} onChange={(event) => updateAcademiaItem(item.id, { visibility: event.target.value === "public" ? "public" : "private" })}><option value="private">Private — default</option><option value="public">Public after import</option></select></label></div></div></article>)}</div>
                <div className="composer-actions"><button className="quiet-button" type="button" disabled={academiaMigrating} onClick={() => setAcademiaMigration(null)}>Start another review</button><button className="publish-button" type="button" disabled={academiaMigrating || academiaMigration.state === "imported"} onClick={importAcademiaSelection}>{academiaMigrating ? "Importing…" : academiaMigration.state === "imported" ? "Import complete" : "Import selected work"}</button></div>
              </>}
            </div>
            <section className="transparency-card"><strong>Public discovery is not an account bypass</strong><p>Search bots may discover only an owner-enabled public Scholarium profile and already-public publications. Private profiles, migration drafts, account data, provider sessions, and all authenticated APIs remain inaccessible.</p><p>For a professor or colleague, send a consent-first invitation. Do not create their profile or import their material based only on an email address.</p></section>
          </section>
        ) : view === "saved" ? (
          <section className="saved-library" aria-label="Private saved collections">
            <div className="library-search-heading"><div><p className="eyebrow">PRIVATE READING SPACE</p><h2>Keep work without changing its reach.</h2><p>Your saved collections are private, portable in your data export, and never used as a public popularity signal.</p></div></div>
            <form className="saved-collection-form" onSubmit={createSavedCollection}><label>New private collection<input maxLength={80} onChange={(event) => setSavedCollectionTitle(event.target.value)} placeholder="e.g. Methods to read" value={savedCollectionTitle} /></label><button className="quiet-button" disabled={savedCollectionSaving} type="submit">{savedCollectionSaving ? "Creating…" : "Create collection"}</button></form>
            {savedCollections.length > 0 && <div className="saved-collection-tabs" role="tablist" aria-label="Saved collections">{savedCollections.map((collection) => <button className={collection.id === selectedSavedCollectionId ? "active" : ""} key={collection.id} onClick={() => { setSavedLoading(true); setSelectedSavedCollectionId(collection.id); }} role="tab" type="button">{collection.title}<span>{collection.itemCount}</span></button>)}</div>}
            {savedLoading ? <div className="empty-state"><h2>Loading saved work…</h2></div> : !savedCollections.length ? <div className="empty-state"><h2>Your reading space is ready.</h2><p>Use Save on a public publication to create your private Reading list, or create a named collection above.</p></div> : savedItems.length === 0 ? <div className="empty-state"><h2>No available work in this collection.</h2><p>Saved work stays here while it remains publicly available; add more from the Signal feed.</p></div> : <div className="saved-item-list">{savedItems.map((item) => <article key={item.publicationId}><div><span>{publicationLabel(item.type)}</span><span className={item.status === "verified" ? "status verified" : "status processing"}>{item.status === "verified" ? "✓ VERIFIED" : "◌ PROCESSING"}</span></div><h2>{item.title}</h2><p>{item.abstract}</p><footer><time dateTime={item.createdAt}>Saved {new Date(item.createdAt).toLocaleDateString()}</time><button type="button" onClick={() => removeSavedItem(item)}>Remove</button></footer></article>)}</div>}
          </section>
        ) : view === "formalize" ? (
          <section className="formalization-panel" aria-label="QuaNthoR formalization coach">
            <div className="formalization-hero">
              <p className="eyebrow">QUANTHOR / COACH MODE</p>
              <h2>Make the structure clear. Keep your voice.</h2>
              <p>Choose a format, describe the work in your own words, and get an adaptable outline. Nothing here prevents you from publishing.</p>
              <div className="feature-brand-cluster"><img className="feature-brand-icon" src={activeEducationIconAsset} alt="Current Scholarium tool-stage icon." /><img className="feature-brand-banner" src={currentSuiteAssets.banner} alt="SecuredMe Education suite banner." /></div>
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
              <p className="eyebrow">PODCAST & VIDEO STUDIO / CREATE WITHOUT A PAYWALL</p>
              <h2>Make the explanation as clear as the work.</h2>
              <p>Build a caption-first podcast or short-video brief, prepare a quality cover, and keep sources connected before you choose YouTube or TikTok.</p>
              <div className="feature-brand-cluster"><img className="feature-brand-icon" src={activeEducationIconAsset} alt="Current Scholarium tool-stage icon." /><img className="feature-brand-banner" src={currentCampaignBanner} alt="Current Scholarium campaign banner." /></div>
              <div className="studio-actions">
                <button className="publish-button" type="button" onClick={() => setComposerOpen(true)}>Start a publication</button>
                <button className="quiet-button" type="button" disabled={livePlanningLoading} onClick={loadLiveSessions}>{livePlanningLoading ? "Loading Lives…" : "Load Live plans"}</button>
              </div>
            </div>
            <section className="live-planning-card" aria-label="Educational Live planning">
              <div><p className="eyebrow">LIVE / PLANNING CONTRACT</p><h3>Plan an educational Live without exposing stream keys.</h3><p>Use this to define schedule, agenda, moderator model, youth restrictions, and replay consent. Real RTMPS/SRT keys, chat, polls, recording, and replay publication remain launch-gated.</p></div>
              <div className="live-planning-grid">
                <label>Live title<input value={liveTitle} onChange={(event) => setLiveTitle(event.target.value)} placeholder="e.g. Method walkthrough and questions" /></label>
                <label>Schedule<input type="datetime-local" value={liveScheduledAt} onChange={(event) => setLiveScheduledAt(event.target.value)} /></label>
                <label>Audience<select value={liveAudienceMode} onChange={(event) => setLiveAudienceMode(event.target.value)}><option value="public_review">Public review room</option><option value="classroom">Classroom / school context</option><option value="private_rehearsal">Private rehearsal</option></select></label>
                <label>Moderation<select value={liveModeratorPlan} onChange={(event) => setLiveModeratorPlan(event.target.value)}><option value="author_moderated">Author moderated</option><option value="teacher_moderated">Teacher moderated</option><option value="organization_moderated">Organization moderated</option></select></label>
              </div>
              <label>Agenda<textarea value={liveAgenda} onChange={(event) => setLiveAgenda(event.target.value)} rows={4} placeholder="List learning goals, speaker order, project demo, questions, and documents to prepare." /></label>
              <label className="toggle-label"><input type="checkbox" checked={liveReplayConsent} onChange={(event) => setLiveReplayConsent(event.target.checked)} /> Author consents to prepare a replay publication after review.</label>
              <p className="media-review-boundary"><strong>Safety boundary:</strong> questions are moderated before public display; minors require guardian or verified school consent for public Lives; no stream key, raw chat, viewer list, provider token, or biometric signal is stored here.</p>
              <div className="studio-actions"><button className="quiet-button" type="button" onClick={loadLiveSessions} disabled={livePlanningLoading}>{livePlanningLoading ? "Loading…" : "Refresh Live plans"}</button><button className="publish-button" type="button" onClick={createLiveSession} disabled={livePlanningLoading || !liveTitle.trim() || !liveScheduledAt}>{livePlanningLoading ? "Saving…" : "Save Live plan"}</button></div>
              {liveSessions.length > 0 && <div className="live-plan-list">{liveSessions.map((session) => <article key={session.id}><strong>{session.title}</strong><span>{new Date(session.scheduledAt).toLocaleString()} · {session.audienceMode.replaceAll("_", " ")} · {session.moderatorPlan.replaceAll("_", " ")} · {session.status}</span><small>{session.replayConsent ? "Replay review prepared after author consent." : "Replay is off until explicit author consent."} Youth mode: {session.youthMode.replaceAll("_", " ")}.</small></article>)}</div>}
            </section>
            <div className="media-production-form">
              <div><p className="eyebrow">AUTHOR-LED PRODUCTION BRIEF</p><h3>Podcast to teaching video</h3><p>Nothing is uploaded, rendered, or shared while you prepare this brief.</p></div>
              <label>Working title<input value={mediaProductionTitle} onChange={(event) => setMediaProductionTitle(event.target.value)} placeholder="What should a learner understand?" /></label>
               <label>Format<select value={mediaProductionAspect} onChange={(event) => setMediaProductionAspect(event.target.value as MediaProductionPlan["aspect"])}><option value="landscape">Landscape lesson · 16:9</option><option value="portrait">Vertical explainer · 9:16</option><option value="square">Square audio-visual capsule · 1:1</option></select></label>
               <label>Quality<select value={mediaProductionQuality} onChange={(event) => setMediaProductionQuality(event.target.value as "standard" | "high")}><option value="standard">Standard · free 720p default</option><option value="high">High · free 1080p option</option></select></label>
               <label>Optional local review<select value={mediaProductionReviewMode} onChange={(event) => setMediaProductionReviewMode(event.target.value as "none" | "local_videoprism")}><option value="none">Off — no media analysis</option><option value="local_videoprism">VideoPrism — semantic scene review</option></select></label>
              <label>Spoken script and source link<textarea value={mediaProductionScript} onChange={(event) => setMediaProductionScript(event.target.value)} placeholder="Write the spoken explanation in your voice, then add a source or evidence URL." rows={5} /></label>
              <div className="media-provider-note"><strong>Provider boundary:</strong> Scholarium prepares the brief and publication context. QuaNTecH-ViD remains a separate rendering service with its own allowance, support, and operational limits. <a href={quantechProviderSurface.officialUrl} rel="noreferrer noopener" target="_blank">Open QuaNTecH-ViD ↗</a> <a href={quantechProviderSurface.marketUrl} rel="noreferrer noopener" target="_blank">Chrome extension ↗</a></div>
              <div className="studio-actions"><button className="quiet-button" type="button" onClick={() => { setMediaProductionPlan(null); setQuantechPreparation(null); setMediaProductionScript(""); setMediaProductionTitle(""); }}>Start over</button><button className="publish-button" disabled={mediaProductionLoading} type="button" onClick={buildMediaProductionPlan}>{mediaProductionLoading ? "Preparing…" : "Create production brief"}</button></div>
            </div>
            {mediaProductionPlan && <section className="media-production-result" aria-live="polite"><div><p className="eyebrow">{mediaProductionPlan.status === "ready_for_author_review" ? "READY FOR AUTHOR REVIEW" : "A FEW HELPFUL STARTERS"}</p><h3>{mediaProductionPlan.title || "Your media plan"}</h3><p>{mediaProductionPlan.useCase}</p></div>{mediaProductionPlan.missing.length > 0 && <p className="formalization-missing">Add {mediaProductionPlan.missing.join(", ")}.</p>}<div className="media-deliverables">{mediaProductionPlan.deliverables.map((deliverable) => <article key={deliverable.name}><strong>{deliverable.name}</strong><span>{deliverable.specification}</span></article>)}</div><p className="media-review-boundary"><strong>Master profile:</strong> {mediaProductionPlan.quality.output.width} × {mediaProductionPlan.quality.output.height} · {mediaProductionPlan.quality.output.videoBitrate} video · {mediaProductionPlan.quality.output.audioBitrate} audio · {mediaProductionPlan.quality.output.pixelFormat}</p><div className="media-provider-note"><strong>{mediaProductionPlan.accessPolicy.provider} in Scholarium:</strong> {mediaProductionPlan.accessPolicy.scholariumAccess} {mediaProductionPlan.accessPolicy.bundledEntitlements} {mediaProductionPlan.accessPolicy.enforcement}</div><div className="media-provider-note"><strong>Provider connection status:</strong> {providerConnectionLabel(quantechConnection?.status)}. {quantechConnection ? `Last updated ${new Date(quantechConnection.updatedAt).toLocaleString()}.` : "Prepare the provider connection before you leave Scholarium for rendering."} Provider sessions and entitlements stay with QuaNTecH-ViD.</div><div className="media-provider-note"><strong>Author gate:</strong> {mediaProductionPlan.studio.authorGate} <a href={quantechProviderSurface.officialUrl} rel="noreferrer noopener" target="_blank">Provider site ↗</a> <a href={quantechProviderSurface.marketUrl} rel="noreferrer noopener" target="_blank">Chrome extension ↗</a></div><ol>{mediaProductionPlan.qualityChecks.map((check) => <li key={check}>{check}</li>)}</ol><p className="media-review-boundary"><strong>Optional local review:</strong> {mediaProductionPlan.reviewBoundary.codeProjectAi} {mediaProductionPlan.reviewBoundary.videoPrism} {mediaProductionPlan.quality.review.status === "not_connected" ? "The VideoPrism adapter is prepared but not connected." : "No semantic review runs for this brief."}</p><p className="media-production-disclaimer">{mediaProductionPlan.disclaimer}</p><div className="studio-actions"><button className="quiet-button" type="button" onClick={() => { setPublicationType(mediaProductionAspect === "portrait" ? "short_video" : "video"); setDraftTitle(mediaProductionTitle); setDraftBody(mediaProductionScript); setComposerOpen(true); }}>Use in a publication</button><button className="quiet-button" type="button" disabled={connectingTool === "quantech_vid"} onClick={() => void prepareToolConnection("quantech_vid", "QuaNTecH-ViD")}>{connectingTool === "quantech_vid" ? "Preparing provider…" : "Prepare provider connection"}</button><button className="quiet-button" type="button" disabled={quantechHistoryLoading} onClick={loadQuantechHistory}>{quantechHistoryLoading ? "Loading history…" : "Refresh request history"}</button><button className="publish-button" type="button" disabled={quantechPreparationLoading} onClick={prepareQuantechHandoff}>{quantechPreparationLoading ? "Preparing handoff…" : "Prepare QuaNTecH handoff"}</button></div>{quantechPreparation && <div className="media-provider-note"><strong>Prepared provider handoff:</strong> {quantechPreparation.entitlement.reason} Minimal provider payload only: {quantechPreparation.payloadBoundary.transmits.join(", ")}. Never sent: {quantechPreparation.payloadBoundary.excludes.join(", ")}. Script digest {quantechPreparation.payloadBoundary.scriptDigest.slice(0, 16)}… · {quantechPreparation.payloadBoundary.sourceUrlCount} source link{quantechPreparation.payloadBoundary.sourceUrlCount === 1 ? "" : "s"}. <a href={quantechPreparation.handoffUrl} rel="noreferrer noopener" target="_blank">Open provider ↗</a></div>}<div className="media-provider-note quantech-history"><div><strong>Private QuaNTecH request history</strong><span>Owner-only handoff metadata. No raw script, media, provider token, ranking signal, or badge state is stored here.</span></div>{quantechRequests.length === 0 ? <p>No prepared handoffs loaded yet.</p> : <ul>{quantechRequests.map((request) => <li key={request.id}><span>{request.aspect} · {request.qualityPreset} · {request.status}</span><small>{new Date(request.createdAt).toLocaleString()} · digest {request.scriptDigest.slice(0, 16)}… · {request.sourceUrlCount} source link{request.sourceUrlCount === 1 ? "" : "s"}</small><a href={request.handoffUrl} rel="noreferrer noopener" target="_blank">Open ↗</a></li>)}</ul>}</div></section>}
            <div className="studio-grid">
              <article><span>01</span><h3>Short explainers</h3><p>Video lives apart from the research feed, with captions and sources.</p></article>
              <article><span>02</span><h3>Project Lives</h3><p>Present a method, answer questions, and preserve a replay as a citable artifact.</p></article>
              <article><span>03</span><h3>Quality cover</h3><p>Start from a high-resolution original and generate responsive web derivatives without enlarging weak imagery.</p></article>
              <article><span>04</span><h3>Local review, by choice</h3><p>Future VideoPrism and YOLO checks can support script-to-scene review; neither identifies people nor decides truth.</p></article>
            </div>
          </section>
        ) : view === "library" ? (
          <section className="library-search" aria-label="Research library search">
            <div className="library-search-heading"><div><p className="eyebrow">PUBLIC RESEARCH LIBRARY</p><h2>Search work, not popularity.</h2><p>Matches are explained from titles, topics, authors, formats, and abstracts. No paid or behavioural ranking.</p></div></div>
            <div className="library-search-filters"><label>Format<select value={libraryType} onChange={(event) => setLibraryType(event.target.value)}><option value="">All formats</option>{publicationTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label><label className="toggle-label"><input type="checkbox" checked={libraryVerified} onChange={(event) => setLibraryVerified(event.target.checked)} /> Verified only</label></div>
            {query.trim().length < 2 ? <div className="empty-state"><h2>Start with two characters.</h2><p>Try a field, author, title, format, or research topic.</p></div> : librarySearchLoading ? <div className="empty-state"><h2>Searching the public library…</h2></div> : librarySearchError ? <div className="empty-state"><h2>Search unavailable.</h2><p>{librarySearchError}</p></div> : libraryResults.length === 0 ? <div className="empty-state"><h2>No public work matches these filters.</h2><p>Broaden the phrase, choose another format, or clear Verified only.</p></div> : <div className="library-results">{libraryResults.map((result) => <article className="library-result" key={result.id}><div className="publication-label"><span>{publicationLabel(result.type)}</span><span className={result.status === "verified" ? "status verified" : "status processing"}>{result.status === "verified" ? "✓ VERIFIED" : "◌ PROCESSING"}</span></div><h2>{result.title}</h2><p>{result.abstract}</p><div className="library-result-meta"><strong>{result.author}</strong><span>Matched by {result.reasons.join(" · ")}</span></div><div className="topic-row">{result.topics.map((topic) => <button type="button" key={topic.slug} onClick={() => setQuery(topic.label)}>#{topic.label.replaceAll(" ", "")}</button>)}</div></article>)}</div>}
          </section>
        ) : (
          <section className="feed" aria-label="Publication feed">
            {!serverFeed && publications.some((publication) => publication.isPreview) && <p className="feed-preview-note">Sample publications are shown while the public archive is empty. They are examples, not live activity or metrics.</p>}
            {serverFeed && <p className="feed-mode-note">{feedMode === "discovery" ? "Live discovery refreshes from public posts every 30 seconds. It uses three visible lanes: your explicit interest, your explicit satisfaction signals, and research context. It excludes subscriptions, contributions, global-like popularity, and paid promotion." : feedMode === "following" ? "Following refreshes from public work tagged with the topics or authors you explicitly follow." : feedMode === "verified" ? "Verified shows public work whose status is verified." : "Chronological shows public work by publication time."}{feedLoading ? " Refreshing…" : ""}</p>}
            {liveUpdateCount > 0 && <div className="live-update-notice" aria-live="polite"><span>{liveUpdateCount} new public post{liveUpdateCount === 1 ? "" : "s"} available.</span><button type="button" onClick={showPendingLiveFeed}>Show new posts</button></div>}
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
                   {publication.scorecard && <p className="feed-signal"><strong>Open score lanes:</strong> relevance {Math.round(publication.scorecard.personalRelevance * 100)}% · explicit satisfaction {Math.round(publication.scorecard.explicitSatisfaction * 100)}% · research context {Math.round(publication.scorecard.researchContext * 100)}%</p>}
                   {publication.externalMedia?.length ? <div className="external-media-links" aria-label="Author-owned external video links">{publication.externalMedia.map((media) => <a href={media.url} key={media.url} rel="noreferrer noopener" target="_blank">{media.provider === "youtube" ? "▶ Open on YouTube" : "♪ Open on TikTok"} <span aria-hidden="true">↗</span></a>)}<span>Hosted by the author’s provider; Scholarium keeps the source link and research context.</span></div> : publication.kind === "video" && <div className="video-preview"><span className="play">▶</span><span>External video link can be attached with sources and Git tree context.</span></div>}
                   {publication.repositoryLinks?.length ? <div className="repository-links" aria-label="Attributed source repositories">{publication.repositoryLinks.map((repository) => <a href={repository.url} key={repository.url} rel="noreferrer noopener" target="_blank">{repository.provider === "github" ? "⌘ Open source on GitHub" : repository.provider === "gitlab" ? "⌘ Open source on GitLab" : "⌘ Open source on SourceForge"} <span aria-hidden="true">↗</span></a>)}<span>Code changes, forks, and permissions stay with the source provider.</span></div> : null}
                  <div className="topic-row">{publication.topics.map((topic) => <button type="button" key={topic} onClick={() => setQuery(topic)}>#{topic.replaceAll(" ", "")}</button>)}</div>
                </div>
                <div className="publication-footer">
                  <button type="button" onClick={() => reactToPublication(publication)}>✦ {publication.reactions}</button>
                  <button type="button" onClick={() => loadDiscussion(publication)}>◌ {publication.comments}</button>
                   <button type="button" onClick={() => setFeedPreference(publication, publication.favorite ? "neutral" : "favorite")}>{publication.favorite ? "★ Favorite" : "☆ Favorite"}</button>
                   <button type="button" onClick={() => saveToReadingList(publication)}>▱ Save</button>
                   {publication.authorPublicId && publication.profileVisible && !publication.isPreview && <a className="publication-action-link" href={`/profile/${publication.authorPublicId}`}>View profile</a>}
                   {publication.authorPublicId && !publication.isPreview && <button type="button" onClick={() => followAuthor(publication)}>{publication.followingAuthor ? "Following author" : "Follow author"}</button>}
                  <button type="button" onClick={() => setFeedPreference(publication, "less_like")}>Less like this</button>
                  {publication.repositoryLinks?.[0] ? <a className="publication-action-link" href={publication.repositoryLinks[0].url} rel="noreferrer noopener" target="_blank" onClick={() => startProject(publication)}>⌘ Start project</a> : <button type="button" onClick={() => startProject(publication)}>⌘ Start project</button>}
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
          <p>Three visible lanes: relevance from your search and hashtags, satisfaction from actions you chose, and research context from provenance. A safety gate removes quarantined work before ranking. Never payment, global-like popularity, or passive viewing surveillance.</p>
          <ul className="algorithm-sources"><li><strong>YouTube pattern:</strong> your deliberate satisfaction choices, never hidden watch time.</li><li><strong>Meta pattern:</strong> eligibility first, then relevance and format diversity — never social-graph prediction.</li><li><strong>Netflix pattern:</strong> separate Discovery, Following, Verified, and Chronological views — never one opaque feed.</li></ul>
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
               <label>Source repository URL (optional)<input value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/project" /></label>
          <label>Attach evidence<input type="file" multiple accept=".pdf,.docx,.odt,.xlsx,.ods,.csv,.pptx,.odp,.epub,.zip,.txt,video/*" onChange={(event) => setAttachedFiles(Array.from(event.currentTarget.files ?? []))} /></label>
          {attachedFiles.length > 0 && <p className="attachment-summary">{attachedFiles.length} artifact{attachedFiles.length === 1 ? "" : "s"} ready for hashing and upload.</p>}
           <div className="composer-proof"><span>✓</span><p>A timestamped provenance receipt will be created. It records your Scholarium publication event; it does not replace copyright registration.</p></div>
           <p className="author-identity-prompt">No DOI, ISBN, or ORCID yet? You can still publish. Add a free ORCID claim from your profile when you are ready; it remains private until authenticated through ORCID.</p>
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
          <div className="profile-brand-gallery"><img src={currentSuiteAssets.logo} alt="SecuredMe Education suite identity sheet." /><img src={activeEducationIconAsset} alt="Current Scholarium tool-stage icon." />{activeEducationBadgeAsset ? <img src={activeEducationBadgeAsset} alt={`Current ecosystem badge stage ${activeEducationToolCount}.`} /> : <img src={currentCampaignBanner} alt="Current Scholarium campaign banner." />}</div>
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
           <div className="badge-row">{badgeVisibility && activeEducationBadgeAsset ? <><img className="ecosystem-badge" src={activeEducationBadgeAsset} alt={`Scholarium ecosystem badge for ${activeEducationToolCount} active tools.`} /><span>{activeEducationToolCount} active tool{activeEducationToolCount === 1 ? "" : "s"} · badge morphs with your Education-suite connections</span></> : badgeVisibility ? <span>Recognition is contribution-based — never purchased</span> : null}</div>
           <label className="toggle-label"><input type="checkbox" checked={publicProfileVisible} onChange={(event) => setPublicProfileVisible(event.target.checked)} /> Make my profile, chosen picture/banner, and public work viewable on Scholarium</label>
           <div className="orcid-panel"><strong>ORCID iD (optional)</strong><span>Use a free, persistent researcher identifier. A manually entered iD remains private and is never presented as authenticated.</span><div><input value={orcidInput} onChange={(event) => setOrcidInput(event.target.value)} placeholder="https://orcid.org/0000-0002-1825-0097" /><button className="quiet-button" disabled={orcidSaving} type="button" onClick={saveOrcid}>{orcidSaving ? "Saving…" : orcidInput.trim() ? "Save ORCID claim" : "Remove ORCID"}</button></div><small>{orcidStatus === "claimed" ? "Checksum valid — self-claimed, private until ORCID OAuth authentication." : "No ORCID saved yet."} <a href="https://orcid.org/register" rel="noreferrer noopener" target="_blank">Create one free ↗</a></small></div>
          <label className="toggle-label"><input type="checkbox" checked={localInsightsEnabled} onChange={(event) => updateLocalInsights(event.target.checked)} /> Enable local-only activity insights on this device</label>
          <div className="local-insights-card"><strong>Private activity snapshot</strong>{localInsightsEnabled ? <span>{localInsightCounts.formalizationGuides} guide{localInsightCounts.formalizationGuides === 1 ? "" : "s"} created · {localInsightCounts.publicationDrafts} publication draft{localInsightCounts.publicationDrafts === 1 ? "" : "s"} started. Kept only in this browser.</span> : <span>Off by default. No activity snapshot is collected or sent anywhere.</span>}</div>
          <section className="reader-preferences-card" aria-label="Reader comfort, notification, and translation preferences">
            <div><strong>Reader comfort</strong><span>Saved privately to your account. These settings help access and comprehension; they never influence ranking.</span></div>
            <div className="reader-preference-grid">
              <fieldset className="profile-fieldset"><legend>Accessibility</legend>
                <label className="toggle-label"><input type="checkbox" checked={keyboardFirst} onChange={(event) => setKeyboardFirst(event.target.checked)} /> Prefer keyboard-first navigation</label>
                <label className="toggle-label"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Reduce non-essential motion</label>
                <label className="toggle-label"><input type="checkbox" checked={screenReaderOptimized} onChange={(event) => setScreenReaderOptimized(event.target.checked)} /> Optimize labels for screen readers</label>
              </fieldset>
              <fieldset className="profile-fieldset"><legend>Notifications</legend>
                <label>Digest cadence<select value={digestCadence} onChange={(event) => setDigestCadence(event.target.value as NotificationPreference["digestCadence"])}><option value="off">Off</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
                <label className="toggle-label"><input type="checkbox" checked={topicAlerts} onChange={(event) => setTopicAlerts(event.target.checked)} /> Topic alerts for followed hashtags</label>
                <label className="toggle-label"><input type="checkbox" checked={moderationAlerts} onChange={(event) => setModerationAlerts(event.target.checked)} /> Moderation and archive alerts</label>
                <label className="toggle-label"><input type="checkbox" checked={notificationEmail} onChange={(event) => setNotificationEmail(event.target.checked)} /> Also allow email delivery</label>
              </fieldset>
              <fieldset className="profile-fieldset"><legend>Language and translation</legend>
                <label>Interface language<select value={interfaceLanguage} onChange={(event) => setInterfaceLanguage(event.target.value)}><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="pt">Português</option><option value="de">Deutsch</option></select></label>
                <label className="toggle-label"><input type="checkbox" checked={showOriginalFirst} onChange={(event) => setShowOriginalFirst(event.target.checked)} /> Show original publication first</label>
                <label className="toggle-label"><input type="checkbox" checked={allowPublicationTranslation} onChange={(event) => setAllowPublicationTranslation(event.target.checked)} /> Allow automatic translation when clearly labeled</label>
                <label>Scientific glossary terms<input value={glossaryTermsInput} onChange={(event) => setGlossaryTermsInput(event.target.value)} placeholder="neutrosophy, plithogenic set, ORCID" /></label>
              </fieldset>
            </div>
            <small>Original publications remain canonical. Formulas, citations, identifiers, and provenance receipts are protected from automatic rewriting.</small>
          </section>
          <div className="profile-tools"><strong>Attach your learning tools</strong><span>QuaNthoR, Synthia, SecuredMe Blog, Codex/OpenAI, and Antigravity/Gemini are consent-first profile connections. Provider sessions and tokens stay with their provider.</span><div className="tool-actions">{profileToolOptions.map((tool) => <button className="quiet-button" type="button" key={tool.id} disabled={connectingTool !== null} onClick={() => tool.id === "quanthor" ? (setProfileOpen(false), setView("formalize")) : prepareToolConnection(tool.id, tool.label)}>{connectingTool === tool.id ? "Preparing…" : tool.label}{integrationConnections[tool.id] ? ` · ${providerConnectionLabel(integrationConnections[tool.id].status)}` : ""}</button>)}<button className="quiet-button" type="button" onClick={() => { setProfileOpen(false); setView("migration"); }}>Academia.edu migration</button></div></div>
          <section className="archive-continuity-card" aria-label="Archive continuity">
            <div><strong>Archive continuity</strong><span>Register where your originals are backed up. Scholarium stores the manifest only: no Drive token, local credential, private key, or file bytes.</span></div>
            <div className="archive-form-grid">
              <label>Provider<select value={archiveProvider} onChange={(event) => setArchiveProvider(event.target.value)}><option value="google_drive">Google Drive</option><option value="microsoft_drive">Microsoft Drive</option><option value="local_sync">Local sync</option><option value="r2_cold">Cold R2</option></select></label>
              <label>Archive path<input value={archivePath} onChange={(event) => setArchivePath(event.target.value)} placeholder="/Scholarium/archives/project-name" /></label>
              <label>Objects<input type="number" min={0} max={10000} value={archiveObjectCount} onChange={(event) => setArchiveObjectCount(Number(event.target.value))} /></label>
              <button className="quiet-button" type="button" disabled={archiveSaving || !archivePath.trim()} onClick={createArchiveManifest}>{archiveSaving ? "Saving…" : "Save manifest"}</button>
            </div>
            {archiveLoading ? <small>Loading archive manifests…</small> : archiveManifests.length === 0 ? <small>No archive manifest yet. Public metadata and provenance can remain visible even if an original file becomes unavailable.</small> : <ul>{archiveManifests.map((manifest) => <li key={manifest.id}><span>{manifest.provider.replaceAll("_", " ")} · {manifest.providerPath} · {manifest.objectCount} object{manifest.objectCount === 1 ? "" : "s"} · {manifest.status}</span><div><button className="quiet-button" type="button" disabled={archiveSaving} onClick={() => requestArchiveAction(manifest, "resync")}>Request resync</button><button className="quiet-button" type="button" disabled={archiveSaving} onClick={() => requestArchiveAction(manifest, "restore")}>Request restore</button></div></li>)}</ul>}
            <small>Restore and resync do not delete R2 objects or bypass safety, moderation, or provenance checks.</small>
          </section>
          <div className="webhook-trace-card"><strong>YouTube delivery trace</strong><span>Visible only to you after a channel is linked and the signed callback is configured. Scholarium retains no raw Atom feed or provider token.</span><button className="quiet-button" type="button" disabled={mediaWebhookTraceLoading} onClick={loadMediaWebhookTrace}>{mediaWebhookTraceLoading ? "Loading trace…" : "View callback trace"}</button>{mediaWebhookEvents.length > 0 ? <ul>{mediaWebhookEvents.map((event) => <li key={`${event.videoId}-${event.receivedAt}`}>{event.eventType} · video {event.videoId} · {new Date(event.receivedAt).toLocaleString()} · {event.status}</li>)}</ul> : <small>No recorded callback yet. A prepared connection is not a linked channel or an active webhook.</small>}</div>
          <section className="funding-campaign-card" aria-label="Funding campaign preparation">
            <div><strong>Funding campaign</strong><span>Prepare a campaign without storing funds. Provider onboarding, KYC, refunds, disputes, crypto, and territory approval remain launch-gated.</span></div>
            <div className="funding-form-grid">
              <label>Campaign title<input value={fundingTitle} onChange={(event) => setFundingTitle(event.target.value)} placeholder="Open lab instrument parts" /></label>
              <label>Goal cents<input type="number" min={100} max={10000000} value={fundingGoalCents} onChange={(event) => setFundingGoalCents(Number(event.target.value))} /></label>
              <label>Currency<select value={fundingCurrency} onChange={(event) => setFundingCurrency(event.target.value)}><option value="USD">USD</option><option value="CAD">CAD</option><option value="EUR">EUR</option></select></label>
              <label>Deadline<input type="date" value={fundingDeadlineAt} onChange={(event) => setFundingDeadlineAt(event.target.value)} /></label>
            </div>
            <label>Purpose<textarea value={fundingPurpose} onChange={(event) => setFundingPurpose(event.target.value)} rows={3} placeholder="Explain the work, beneficiary, and how funds will be used." /></label>
            <label className="toggle-label"><input type="checkbox" checked={fundingPublicProgress} onChange={(event) => setFundingPublicProgress(event.target.checked)} /> Allow public progress display after provider verification</label>
            <small>Campaign status, goals, contribution counts, and contribution amounts are excluded from discovery ranking. Minor accounts cannot use this flow without a reviewed supervised path.</small>
            <div className="studio-actions"><button className="quiet-button" type="button" disabled={fundingLoading} onClick={loadFundingCampaigns}>{fundingLoading ? "Loading…" : "Refresh campaigns"}</button><button className="publish-button" type="button" disabled={fundingLoading || !fundingTitle.trim()} onClick={createFundingCampaign}>{fundingLoading ? "Saving…" : "Prepare campaign"}</button></div>
            {fundingCampaigns.length > 0 && <ul>{fundingCampaigns.map((campaign) => <li key={campaign.id}><span>{campaign.title} · {(campaign.goalCents / 100).toLocaleString(undefined, { currency: campaign.currency, style: "currency" })} · {campaign.status}</span><small>{campaign.beneficiaryStatus.replaceAll("_", " ")} · public progress {campaign.publicProgress ? "enabled by owner" : "off"}</small></li>)}</ul>}
          </section>
          <div className="webhook-trace-card"><strong>Verified contributor</strong><span>A fixed USD 0.99 contribution supports the service. It never affects your reach, ranking, moderation, or essential access. Checkout requires verified identity and passkey safeguards.</span><button className="quiet-button" type="button" disabled={paypalCheckoutLoading} onClick={startPayPalCheckout}>{paypalCheckoutLoading ? "Opening PayPal…" : "Continue with PayPal"}</button><small>Crypto checkout is not connected until a provider account, available assets, fees, regions, and verified webhook are approved. Scholarium never stores wallet private keys.</small></div>
          <div className="composer-proof"><span>◌</span><p>Profile images upload only after you choose a file. They remain private unless you enable public profile visibility above; a public profile exposes only your chosen visuals and already-public work. Identity verification uses a document provider and a passkey: Scholarium never stores ID images or fingerprint data.</p></div>
          <div className="composer-actions"><a className="quiet-button auth-link" href="/api/v1/account/export">Export my data</a><a className="quiet-button auth-link" href={session.signOutPath}>Sign out</a><button className="quiet-button" type="button" onClick={() => setProfileOpen(false)}>Cancel</button><button className="publish-button" type="button" disabled={accountSaving || readerPreferencesSaving} onClick={saveProfilePreferences}>{accountSaving || readerPreferencesSaving ? "Saving…" : "Save preferences"}</button></div></>}</>}
        </section>
      </div>}

      {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button></div>}
    </main>
  );
}
