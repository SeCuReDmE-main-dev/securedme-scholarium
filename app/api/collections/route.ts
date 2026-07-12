import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { collectionItems, collections, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return { response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { response: Response.json({ error: "Create a Scholarium account before using saved collections" }, { status: 404 }) };
  return { db, user };
}

function collectionInput(value: unknown, maximum: number, required = true) {
  if (value === undefined || value === null) return required ? null : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximum) return null;
  return normalized || null;
}

export async function GET() {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const ownCollections = await current.db.select().from(collections).where(eq(collections.userId, current.user.id));
    const ids = ownCollections.map((collection) => collection.id);
    const items = ids.length ? await current.db.select({ collectionId: collectionItems.collectionId }).from(collectionItems).where(inArray(collectionItems.collectionId, ids)) : [];
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.collectionId, (counts.get(item.collectionId) ?? 0) + 1);
    return Response.json({ collections: ownCollections.map((collection) => ({ ...collection, itemCount: counts.get(collection.id) ?? 0 })) }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load saved collections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const input = await request.json() as { description?: unknown; title?: unknown };
    const title = collectionInput(input.title, 80);
    const description = collectionInput(input.description, 480, false);
    if (!title) return Response.json({ error: "A collection title of up to 80 characters is required" }, { status: 400 });
    const now = new Date().toISOString();
    const collection = { createdAt: now, description, id: crypto.randomUUID(), kind: "collection", title, updatedAt: now, userId: current.user.id, visibility: "private" };
    await current.db.insert(collections).values(collection);
    return Response.json({ collection: { ...collection, itemCount: 0 } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create saved collection";
    return Response.json({ error: /UNIQUE constraint failed/.test(message) ? "You already have a collection with that title" : message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const collectionId = new URL(request.url).searchParams.get("collectionId");
    if (!collectionId) return Response.json({ error: "collectionId is required" }, { status: 400 });
    const [collection] = await current.db.select({ id: collections.id }).from(collections).where(and(eq(collections.id, collectionId), eq(collections.userId, current.user.id))).limit(1);
    if (!collection) return Response.json({ error: "Saved collection was not found" }, { status: 404 });
    await current.db.batch([current.db.delete(collectionItems).where(eq(collectionItems.collectionId, collection.id)), current.db.delete(collections).where(eq(collections.id, collection.id))]);
    return Response.json({ collectionId: collection.id, removed: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to remove saved collection" }, { status: 500 });
  }
}
