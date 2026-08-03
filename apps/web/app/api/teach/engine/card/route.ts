import { getDb } from "../../../../../db";
import { syllabicCards } from "../../../../../lib/teach-engine-contracts";
import { readEngineProgress } from "../../../../../lib/teach-engine-service";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const progress = await readEngineProgress(await getDb(), identity.userId);
  const index = Math.max(0, syllabicCards.findIndex((card) => card.nodeId === progress.checkpoint.current_node_id));
  return Response.json({ cards: syllabicCards.slice(index, index + 3), checkpoint: progress.checkpoint, offlinePolicy: "consultation_only" }, { headers: { "cache-control": "private, max-age=30" } });
}
