import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { requestEphemeralAudioObservation } from "../../../../../lib/teach-engine-client";

export async function POST(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const ageBand = request.headers.get("x-teach-age-band");
  const consent = request.headers.get("x-teach-audio-consent") === "granted";
  if (!consent || ageBand !== "adult") return Response.json({ error: "Audio is closed for minors and requires separate adult consent.", canChangeMastery: false }, { status: 403 });
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const result = await requestEphemeralAudioObservation(await request.arrayBuffer(), contentType);
    return Response.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audio observer unavailable.";
    return Response.json({ error: message, canChangeMastery: false }, { status: message.includes("WAV") || message.includes("limit") ? 415 : 503, headers: { "cache-control": "private, no-store" } });
  }
}
