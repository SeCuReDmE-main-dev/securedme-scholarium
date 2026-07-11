import { createMediaProductionPlan } from "../../../lib/media-production-plan";

type VideoProductionInput = { aspect?: unknown; script?: unknown; title?: unknown; qualityPreset?: unknown; reviewMode?: unknown };

/** Produces an ephemeral author-facing production brief. No video, image, transcript, identity information, or provider credential is uploaded here. */
export async function POST(request: Request) {
  try {
    const input = (await request.json()) as VideoProductionInput;
    if (input.aspect !== undefined && input.aspect !== "landscape" && input.aspect !== "portrait" && input.aspect !== "square") return Response.json({ error: "aspect must be landscape, portrait, or square" }, { status: 400 });
    if (input.script !== undefined && typeof input.script !== "string") return Response.json({ error: "script must be plain text" }, { status: 400 });
    if (input.title !== undefined && typeof input.title !== "string") return Response.json({ error: "title must be plain text" }, { status: 400 });
    if (input.qualityPreset !== undefined && input.qualityPreset !== "standard" && input.qualityPreset !== "high") return Response.json({ error: "qualityPreset must be standard or high" }, { status: 400 });
    if (input.reviewMode !== undefined && input.reviewMode !== "none" && input.reviewMode !== "local_videoprism") return Response.json({ error: "reviewMode must be none or local_videoprism" }, { status: 400 });
    return Response.json({ plan: createMediaProductionPlan({ aspect: input.aspect, script: input.script, title: input.title, qualityPreset: input.qualityPreset, reviewMode: input.reviewMode }) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ error: "A valid JSON production brief is required" }, { status: 400 });
  }
}
