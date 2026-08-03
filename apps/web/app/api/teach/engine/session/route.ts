import { getDb } from "../../../../../db";
import { openEngineSession } from "../../../../../lib/teach-engine-service";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

export async function POST() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const session = await openEngineSession(await getDb(), identity.userId);
  return Response.json({ session }, { status: 201, headers: { "cache-control": "private, no-store" } });
}
