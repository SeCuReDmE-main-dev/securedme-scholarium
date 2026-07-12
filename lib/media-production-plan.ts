import { createVideoQualityContract, type MediaAspect, type MediaQualityPreset, type MediaReviewMode } from "./video-quality";

export type { MediaAspect } from "./video-quality";

const outputProfiles: Record<MediaAspect, { label: string; master: string; platform: string }> = {
  landscape: { label: "Landscape lesson", master: "1920 × 1080 · 16:9 · 25/30 fps", platform: "YouTube lesson, lecture, or panel" },
  portrait: { label: "Vertical explainer", master: "1080 × 1920 · 9:16 · 25/30 fps", platform: "YouTube Short or TikTok handoff" },
  square: { label: "Square audio-visual capsule", master: "1080 × 1080 · 1:1 · 25/30 fps", platform: "Podcast social card or community update" },
};

export function createMediaProductionPlan(input: { aspect?: string; script?: string; title?: string; qualityPreset?: MediaQualityPreset; reviewMode?: MediaReviewMode }) {
  const title = String(input.title ?? "").trim().slice(0, 240);
  const script = String(input.script ?? "").trim().slice(0, 12_000);
  const aspect = input.aspect === "portrait" || input.aspect === "square" ? input.aspect : "landscape";
  const profile = outputProfiles[aspect];
  const quality = createVideoQualityContract({ aspect, qualityPreset: input.qualityPreset, reviewMode: input.reviewMode });
  const hasSource = /https?:\/\//iu.test(script);
  const missing = [!title && "a working title", script.length < 40 && "a short spoken script", !hasSource && "at least one source or evidence link"].filter(Boolean);

  return {
    accessPolicy: {
      provider: "QuaNTecH-ViD",
      integration: "optional_external_proprietary_feature",
      freeCompletedRendersPerRollingWindow: 3,
      rollingWindowHours: 24,
      defaultPreset: "standard",
      scholariumAccess: "Scholarium exposes the QuaNTecH-ViD free feature with three completed renders per rolling 24 hours.",
      bundledEntitlements: "Eligible Pro, Enterprise, and Premium suite offers may include higher QuaNTecH-ViD operational limits through an explicit bundle entitlement.",
      enforcement: "QuaNTecH-ViD owns the entitlement decision. Count completed renders only; failed jobs do not consume quota; duplicate requests are idempotent; abuse controls must expose retry time and an appeal path. Scholarium receives only the allowed/denied result needed for the requested render.",
    },
    aspect,
    deliverables: [
      { name: "Source notebook", specification: "author-selected sources, claims, citations, and exclusions before scripting" },
      { name: "Three-role podcast package", specification: "Presenter, Specialist, and Interviewee script with timed 2–5 minute segments, show notes, and a TTS-ready version" },
      { name: "Master video", specification: profile.master },
      { name: "Accessible transcript", specification: "speaker-reviewed captions and a text transcript" },
      { name: "Cover image", specification: "1920 × 1080 source image; derive responsive AVIF/WebP web variants without enlarging a weak original" },
    ],
    disclaimer: "This is a production brief, not a renderer, scientific verifier, or publishing authorization. The author must review captions, image rights, sources, and the final export.",
    missing,
    qualityChecks: [
      `Master with ${quality.output.width} × ${quality.output.height}, ${quality.output.videoBitrate} video, and ${quality.output.audioBitrate} audio; QuaNTecH-ViD provides a free default tier and separately managed professional operating limits.`,
      "Use a real 1920 × 1080 or larger cover source; avoid upscaling a small or compressed image.",
      "Keep text inside a 10% safe margin and check contrast before export.",
      "Export captions and transcript before attaching the external YouTube or TikTok URL.",
      "Preserve the publication’s sources and limits in the video description or linked Scholarium record.",
    ],
    studio: {
      inspirationBoundary: "NotebookLM inspires the source-to-dialogue learning flow; Scholarium uses its own source ledger, script, voices, renderer, and audit trail.",
      roles: ["Presenter", "Specialist", "Interviewee"],
      defaultDurationMinutes: 23,
      pacing: { "en-US": 145, "fr-FR": 118, "fr-CA": 112 },
      audioPolicy: "Synthesize each approved role separately, join without aggressive tempo compression, and regenerate the script when duration is wrong.",
      authorGate: "No audio or video render begins until the author reviews the source notes and script.",
    },
    reviewBoundary: {
      codeProjectAi: "Optional local object/scene checks can flag framing problems. They are never started automatically and are not identity or biometric analysis.",
      videoPrism: "A future opt-in local review can compare sampled video scenes with the author-approved script and sources. VideoPrism helps semantic review; it does not enhance pixels or determine truth.",
    },
    quality,
    status: missing.length ? "needs_input" : "ready_for_author_review",
    title,
    useCase: profile.platform,
  };
}
