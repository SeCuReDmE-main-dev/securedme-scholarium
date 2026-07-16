import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { administrativeAssistantView } from "../../../../../lib/teach-assistant-service";

export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await administrativeAssistantView(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Administrative assistant access denied." }, { status: 403 });
  }
}
