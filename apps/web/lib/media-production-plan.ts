export type MediaAspect = "landscape" | "portrait" | "square";

const outputProfiles: Record<MediaAspect, { label: string; master: string; platform: string }> = {
  landscape: { label: "Landscape lesson", master: "1920 × 1080 · 16:9 · 25/30 fps", platform: "YouTube lesson, lecture, or panel" },
  portrait: { label: "Vertical explainer", master: "1080 × 1920 · 9:16 · 25/30 fps", platform: "YouTube Short or TikTok handoff" },
  square: { label: "Square audio-visual capsule", master: "1080 × 1080 · 1:1 · 25/30 fps", platform: "Podcast social card or community update" },
};

export function createMediaProductionPlan(input: { aspect?: string; script?: string; title?: string }) {
  const title = String(input.title ?? "").trim().slice(0, 240);
  const script = String(input.script ?? "").trim().slice(0, 12_000);
  const aspect = input.aspect === "portrait" || input.aspect === "square" ? input.aspect : "landscape";
  const profile = outputProfiles[aspect];
  const hasSource = /https?:\/\//iu.test(script);
  const missing = [!title && "a working title", script.length < 40 && "a short spoken script", !hasSource && "at least one source or evidence link"].filter(Boolean);

  return {
    aspect,
    deliverables: [
      { name: "Master video", specification: profile.master },
      { name: "Accessible transcript", specification: "speaker-reviewed captions and a text transcript" },
      { name: "Cover image", specification: "1920 × 1080 source image; derive responsive AVIF/WebP web variants without enlarging a weak original" },
    ],
    disclaimer: "This is a production brief, not a renderer, scientific verifier, or publishing authorization. The author must review captions, image rights, sources, and the final export.",
    missing,
    qualityChecks: [
      "Use a real 1920 × 1080 or larger cover source; avoid upscaling a small or compressed image.",
      "Keep text inside a 10% safe margin and check contrast before export.",
      "Export captions and transcript before attaching the external YouTube or TikTok URL.",
      "Preserve the publication’s sources and limits in the video description or linked Scholarium record.",
    ],
    reviewBoundary: {
      codeProjectAi: "Optional local object/scene checks can flag framing problems. They are never started automatically and are not identity or biometric analysis.",
      videoPrism: "A future opt-in local review can compare sampled video scenes with the author-approved script and sources. VideoPrism helps semantic review; it does not enhance pixels or determine truth.",
    },
    status: missing.length ? "needs_input" : "ready_for_author_review",
    title,
    useCase: profile.platform,
  };
}
