export type MediaAspect = "landscape" | "portrait" | "square";
export type MediaQualityPreset = "standard" | "high";
export type MediaReviewMode = "none" | "local_videoprism";

type OutputProfile = {
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
};

const profiles: Record<MediaAspect, Record<MediaQualityPreset, OutputProfile>> = {
  landscape: {
    standard: { width: 1280, height: 720, videoBitrate: "3000k", audioBitrate: "128k" },
    high: { width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k" },
  },
  portrait: {
    standard: { width: 720, height: 1280, videoBitrate: "3000k", audioBitrate: "128k" },
    high: { width: 1080, height: 1920, videoBitrate: "5000k", audioBitrate: "192k" },
  },
  square: {
    standard: { width: 720, height: 720, videoBitrate: "2500k", audioBitrate: "128k" },
    high: { width: 1080, height: 1080, videoBitrate: "4500k", audioBitrate: "192k" },
  },
};

/**
 * Returns a renderer-neutral quality contract. Scholarium stores the contract,
 * while an author-controlled worker may later execute the FFmpeg or VideoPrism
 * steps. The web worker never downloads model weights or receives raw media.
 */
export function createVideoQualityContract(input: { aspect?: MediaAspect; qualityPreset?: MediaQualityPreset; reviewMode?: MediaReviewMode }) {
  const aspect = input.aspect ?? "landscape";
  const qualityPreset = input.qualityPreset ?? "high";
  const reviewMode = input.reviewMode ?? "none";
  const output = profiles[aspect][qualityPreset];

  return {
    aspect,
    preset: qualityPreset,
    output: {
      ...output,
      videoCodec: "libx264",
      audioCodec: "aac",
      pixelFormat: "yuv420p",
      shortest: true,
      safeMarginPercent: 10,
      coverRule: "Use an author-owned source at or above the target dimensions; never upscale a weak original.",
    },
    review: reviewMode === "local_videoprism"
      ? {
          mode: reviewMode,
          status: "not_connected",
          provider: "VideoPrism",
          model: "videoprism_lvt_public_v1_base",
          purpose: "Optional local semantic comparison between sampled scenes, the author-approved script, and cited sources.",
          privacy: "local_only",
          requires: ["Python 3.9+", "JAX/Flax", "author-approved local media input"],
          outputBoundary: "Review notes only; never pixel enhancement, identity analysis, ranking, moderation, or a scientific-truth verdict.",
        }
      : {
          mode: "none",
          status: "disabled",
          provider: "VideoPrism",
          model: null,
          purpose: "No semantic review requested.",
          privacy: "not_applicable",
          requires: [],
          outputBoundary: "No external or local analysis runs.",
        },
  };
}
