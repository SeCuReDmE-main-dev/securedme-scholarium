import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { topicFollows, topics, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { normalizeTopicSlug, topicLabel } from "../../../lib/topics";

async function accountIdentity() {
  const identity = await getPlatformIdentity();
  if (!identity) return { identity: null, response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { identity: null, response: Response.json({ error: "Create a Scholarium account before following topics" }, { status: 404 }) };
  return { identity, db, response: null };
}

export async function GET() {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const followedTopics = await account.db.select({ label: topics.label, slug: topics.slug }).from(topicFollows).innerJoin(topics, eq(topicFollows.topicId, topics.id)).where(eq(topicFollows.userId, account.identity.userId)).orderBy(asc(topics.label));
    return Response.json({ topics: followedTopics });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load followed topics" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as { topic?: unknown };
    const slug = normalizeTopicSlug(input.topic);
    if (!slug) return Response.json({ error: "Choose a topic using 2 to 48 letters, numbers, or spaces" }, { status: 400 });
    await account.db.insert(topics).values({ id: crypto.randomUUID(), label: topicLabel(slug), slug }).onConflictDoNothing();
    const [topic] = await account.db.select().from(topics).where(eq(topics.slug, slug)).limit(1);
    if (!topic) throw new Error("Topic could not be created");
    await account.db.insert(topicFollows).values({ id: crypto.randomUUID(), topicId: topic.id, userId: account.identity.userId }).onConflictDoNothing();
    return Response.json({ topic: { label: topic.label, slug: topic.slug } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to follow topic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as { topic?: unknown };
    const slug = normalizeTopicSlug(input.topic);
    if (!slug) return Response.json({ error: "A valid topic is required" }, { status: 400 });
    const [topic] = await account.db.select({ id: topics.id }).from(topics).where(eq(topics.slug, slug)).limit(1);
    if (topic) await account.db.delete(topicFollows).where(and(eq(topicFollows.userId, account.identity.userId), eq(topicFollows.topicId, topic.id)));
    return Response.json({ removed: Boolean(topic), slug });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to unfollow topic" }, { status: 500 });
  }
}
