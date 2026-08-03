import { getDb } from "../../../../../db";
import { readEngineProgress } from "../../../../../lib/teach-engine-service";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json(await readEngineProgress(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
}
