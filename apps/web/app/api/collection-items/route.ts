import { and, desc, eq, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { collectionItems, collections, publications, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return { response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { response: Response.json({ error: "Create a Scholarium account before saving work" }, { status: 404 }) };
  return { db, user };
}

async function ownCollection(db: Awaited<ReturnType<typeof getDb>>, userId: string, collectionId: string) {
  const [collection] = await db.select().from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, userId))).limit(1);
  return collection ?? null;
}

async function readingList(db: Awaited<ReturnType<typeof getDb>>, userId: string) {
  const now = new Date().toISOString();
  await db.insert(collections).values({ createdAt: now, id: crypto.randomUUID(), kind: "reading_list", title: "Reading list", updatedAt: now, userId, visibility: "private" }).onConflictDoNothing({ target: [collections.userId, collections.title] });
  const [collection] = await db.select().from(collections).where(and(eq(collections.userId, userId), eq(collections.title, "Reading list"))).limit(1);
  return collection!;
}

export async function GET(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const collectionId = new URL(request.url).searchParams.get("collectionId");
    if (!collectionId) return Response.json({ error: "collectionId is required" }, { status: 400 });
    const collection = await ownCollection(current.db, current.user.id, collectionId);
    if (!collection) return Response.json({ error: "Saved collection was not found" }, { status: 404 });
    const items = await current.db.select({ abstract: publications.abstract, createdAt: collectionItems.createdAt, id: publications.id, publicationId: collectionItems.publicationId, status: publications.verificationStatus, title: publications.title, type: publications.type }).from(collectionItems).innerJoin(publications, eq(publications.id, collectionItems.publicationId)).where(and(eq(collectionItems.collectionId, collection.id), eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"]))).orderBy(desc(collectionItems.createdAt));
    return Response.json({ collection: { description: collection.description, id: collection.id, kind: collection.kind, title: collection.title }, items }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load saved work" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const input = await request.json() as { collectionId?: unknown; publicationId?: unknown };
    if (typeof input.publicationId !== "string" || input.publicationId.length < 8) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const [publication] = await current.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"]))).limit(1);
    if (!publication) return Response.json({ error: "Only currently public, eligible work can be saved" }, { status: 404 });
    const collection = typeof input.collectionId === "string" ? await ownCollection(current.db, current.user.id, input.collectionId) : await readingList(current.db, current.user.id);
    if (!collection) return Response.json({ error: "Saved collection was not found" }, { status: 404 });
    await current.db.insert(collectionItems).values({ collectionId: collection.id, createdAt: new Date().toISOString(), id: crypto.randomUUID(), publicationId: publication.id }).onConflictDoNothing({ target: [collectionItems.collectionId, collectionItems.publicationId] });
    return Response.json({ collectionId: collection.id, publicationId: publication.id, saved: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save work" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const collectionId = new URL(request.url).searchParams.get("collectionId");
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!collectionId || !publicationId) return Response.json({ error: "collectionId and publicationId are required" }, { status: 400 });
    const collection = await ownCollection(current.db, current.user.id, collectionId);
    if (!collection) return Response.json({ error: "Saved collection was not found" }, { status: 404 });
    await current.db.delete(collectionItems).where(and(eq(collectionItems.collectionId, collection.id), eq(collectionItems.publicationId, publicationId)));
    return Response.json({ collectionId: collection.id, publicationId, removed: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to remove saved work" }, { status: 500 });
  }
}
