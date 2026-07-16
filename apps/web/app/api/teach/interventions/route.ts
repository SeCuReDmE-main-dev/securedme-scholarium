import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachInterventionPreferences } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { saveInterventionPreferences } from "../../../../lib/teach-assistant-service";
import { interventionPreferencesContract } from "../../../../lib/teach-contracts";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const [preferences] = await (await getDb()).select().from(teachInterventionPreferences).where(eq(teachInterventionPreferences.userId, identity.userId)).limit(1);
  let contexts: unknown = [];
  if (preferences) {
    try { contexts = JSON.parse(preferences.contexts) as unknown; } catch { contexts = []; }
  }
  return Response.json({ preferences: preferences ? interventionPreferencesContract({ ...preferences, contexts }) : interventionPreferencesContract({}) }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const preferences = await saveInterventionPreferences(await getDb(), identity.userId, await request.json() as Record<string, unknown>);
  return Response.json({ preferences });
}
