import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicProfiles, userFollows, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function accountIdentity() {
  const identity = await getPlatformIdentity();
  if (!identity) return { identity: null, response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { identity: null, response: Response.json({ error: "Create a Scholarium account before following authors" }, { status: 404 }) };
  return { db, identity, response: null };
}

function publicProfileId(value: unknown) {
  return typeof value === "string" && /^[0-9a-f-]{36}$/iu.test(value) ? value : null;
}

export async function GET() {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const follows = await account.db.select({ displayName: users.displayName, publicProfileId: publicProfiles.publicId }).from(userFollows).innerJoin(publicProfiles, eq(userFollows.targetUserId, publicProfiles.userId)).innerJoin(users, eq(publicProfiles.userId, users.id)).where(eq(userFollows.userId, account.identity.userId)).orderBy(asc(users.displayName));
    return Response.json({ authors: follows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load followed authors" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as { publicProfileId?: unknown };
    const targetPublicProfileId = publicProfileId(input.publicProfileId);
    if (!targetPublicProfileId) return Response.json({ error: "A valid public author identifier is required" }, { status: 400 });
    const [target] = await account.db.select({ userId: publicProfiles.userId }).from(publicProfiles).where(eq(publicProfiles.publicId, targetPublicProfileId)).limit(1);
    if (!target) return Response.json({ error: "Public author was not found" }, { status: 404 });
    if (target.userId === account.identity.userId) return Response.json({ error: "You cannot follow yourself" }, { status: 400 });
    await account.db.insert(userFollows).values({ id: crypto.randomUUID(), targetUserId: target.userId, userId: account.identity.userId }).onConflictDoNothing();
    return Response.json({ following: true, publicProfileId: targetPublicProfileId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to follow author" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const account = await accountIdentity();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as { publicProfileId?: unknown };
    const targetPublicProfileId = publicProfileId(input.publicProfileId);
    if (!targetPublicProfileId) return Response.json({ error: "A valid public author identifier is required" }, { status: 400 });
    const [target] = await account.db.select({ userId: publicProfiles.userId }).from(publicProfiles).where(eq(publicProfiles.publicId, targetPublicProfileId)).limit(1);
    if (!target) return Response.json({ removed: false, publicProfileId: targetPublicProfileId });
    await account.db.delete(userFollows).where(and(eq(userFollows.userId, account.identity.userId), eq(userFollows.targetUserId, target.userId)));
    return Response.json({ removed: true, publicProfileId: targetPublicProfileId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to unfollow author" }, { status: 500 });
  }
}
