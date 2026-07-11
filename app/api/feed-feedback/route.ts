import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { feedFeedback, publications, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

const allowedPreferences = new Set(["favorite", "less_like", "neutral"]);

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return { response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { response: Response.json({ error: "Create a Scholarium account before tuning your feed" }, { status: 404 }) };
  return { db, user };
}

export async function PUT(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const input = await request.json() as { preference?: unknown; publicationId?: unknown };
    if (typeof input.publicationId !== "string" || input.publicationId.length < 8) return Response.json({ error: "publicationId is required" }, { status: 400 });
    if (typeof input.preference !== "string" || !allowedPreferences.has(input.preference)) return Response.json({ error: "Choose favorite, less_like, or neutral" }, { status: 400 });
    const [publication] = await current.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.visibility, "public"))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
    if (input.preference === "neutral") {
      await current.db.delete(feedFeedback).where(and(eq(feedFeedback.userId, current.user.id), eq(feedFeedback.publicationId, publication.id)));
      return Response.json({ preference: "neutral", publicationId: publication.id, removed: true });
    }
    const updatedAt = new Date().toISOString();
    await current.db.insert(feedFeedback).values({ id: crypto.randomUUID(), preference: input.preference, publicationId: publication.id, updatedAt, userId: current.user.id }).onConflictDoUpdate({ target: [feedFeedback.userId, feedFeedback.publicationId], set: { preference: input.preference, updatedAt } });
    return Response.json({ preference: input.preference, publicationId: publication.id, updatedAt });
  } catch (error) {
    console.error("Feed feedback save failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to save your feed preference" }, { status: 500 });
  }
}
