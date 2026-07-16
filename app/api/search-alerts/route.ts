import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { searchAlerts, users } from "../../../db/schema";
import { normalizedTopicSlugs } from "../../../lib/topics";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type AlertInput = { cadence?: unknown; label?: unknown; query?: unknown; topicSlugs?: unknown };
const cadences = new Set(["daily", "weekly", "monthly"]);

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const alerts = await current.db.select().from(searchAlerts).where(eq(searchAlerts.userId, current.user.id)).orderBy(desc(searchAlerts.createdAt));
    return Response.json({ alerts, boundary: "Alerts are explicit private subscriptions. They do not use passive reading signals or affect feed ranking." }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load search alerts" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as AlertInput;
    if (typeof input.label !== "string" || !input.label.trim() || input.label.trim().length > 100) return Response.json({ error: "label is required and must be at most 100 characters" }, { status: 400 });
    const query = typeof input.query === "string" ? input.query.trim().slice(0, 160) : "";
    const topicSlugs = normalizedTopicSlugs(input.topicSlugs);
    if (!query && topicSlugs.length === 0) return Response.json({ error: "Choose a query, a topic, or both" }, { status: 400 });
    const cadence = typeof input.cadence === "string" && cadences.has(input.cadence) ? input.cadence : "weekly";
    const now = new Date().toISOString();
    const alert = { cadence, createdAt: now, id: crypto.randomUUID(), label: input.label.trim(), query, status: "active", topicSlugs: JSON.stringify(topicSlugs), updatedAt: now, userId: current.user.id };
    await current.db.insert(searchAlerts).values(alert);
    return Response.json({ alert, delivery: "preference_recorded" }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create search alert" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    await current.db.delete(searchAlerts).where(and(eq(searchAlerts.id, id), eq(searchAlerts.userId, current.user.id)));
    return Response.json({ deleted: true, id });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete search alert" }, { status: 500 }); }
}
