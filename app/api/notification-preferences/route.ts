import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { readerPreferences } from "../../../db/schema";
import { notificationPreferenceContract, notificationPreferenceFromRow, readerPreferenceInsert, type NotificationPreferenceInput } from "../../../lib/reader-preferences";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const db = await getDb();
  const [row] = await db.select().from(readerPreferences).where(eq(readerPreferences.userId, identity.userId)).limit(1);
  return Response.json({ preference: notificationPreferenceFromRow(row) }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = (await request.json()) as NotificationPreferenceInput;
  const preference = notificationPreferenceContract(input);
  const updatedAt = new Date().toISOString();
  const db = await getDb();
  await db.insert(readerPreferences).values({
    ...readerPreferenceInsert(identity.userId),
    digestCadence: preference.digestCadence,
    moderationAlerts: preference.moderationAlerts,
    notificationChannels: JSON.stringify(preference.channels),
    topicAlerts: preference.topicAlerts,
    updatedAt,
  }).onConflictDoUpdate({
    target: readerPreferences.userId,
    set: {
      digestCadence: preference.digestCadence,
      moderationAlerts: preference.moderationAlerts,
      notificationChannels: JSON.stringify(preference.channels),
      topicAlerts: preference.topicAlerts,
      updatedAt,
    },
  });
  return Response.json({ preference }, { headers: { "cache-control": "private, no-store" } });
}
