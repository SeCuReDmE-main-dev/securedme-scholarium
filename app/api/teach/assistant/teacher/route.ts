import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { teacherAssistantView } from "../../../../../lib/teach-assistant-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json(await teacherAssistantView(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
}
