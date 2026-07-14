import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { citationAlerts, publications, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

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
    const alerts = await current.db.select({ createdAt: citationAlerts.createdAt, id: citationAlerts.id, publicationId: citationAlerts.publicationId, status: citationAlerts.status, title: publications.title, updatedAt: citationAlerts.updatedAt }).from(citationAlerts).innerJoin(publications, eq(publications.id, citationAlerts.publicationId)).where(eq(citationAlerts.userId, current.user.id)).orderBy(desc(citationAlerts.createdAt));
    return Response.json({ alerts, boundary: "This records an author alert preference. It does not claim an external citation count or scrape third-party records." }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load citation alerts" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as { publicationId?: unknown };
    if (typeof input.publicationId !== "string") return Response.json({ error: "publicationId is required" }, { status: 400 });
    const [publication] = await current.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, current.user.id))).limit(1);
    if (!publication) return Response.json({ error: "Only an author can enable a citation alert for this publication" }, { status: 404 });
    const now = new Date().toISOString();
    await current.db.insert(citationAlerts).values({ createdAt: now, id: crypto.randomUUID(), publicationId: publication.id, status: "active", updatedAt: now, userId: current.user.id }).onConflictDoUpdate({ target: [citationAlerts.userId, citationAlerts.publicationId], set: { status: "active", updatedAt: now } });
    return Response.json({ alert: { publicationId: publication.id, status: "active" }, delivery: "preference_recorded" }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create citation alert" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    await current.db.delete(citationAlerts).where(and(eq(citationAlerts.userId, current.user.id), eq(citationAlerts.publicationId, publicationId)));
    return Response.json({ deleted: true, publicationId });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete citation alert" }, { status: 500 }); }
}
