import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { authorIdentifiers, users } from "../../../db/schema";
import { canonicalOrcid } from "../../../lib/orcid";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return { response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { response: Response.json({ error: "Create a Scholarium account before adding an author identifier" }, { status: 404 }) };
  return { db, user };
}

export async function GET() {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const identifiers = await current.db.select({ canonicalUrl: authorIdentifiers.canonicalUrl, identifier: authorIdentifiers.identifier, scheme: authorIdentifiers.scheme, status: authorIdentifiers.status, updatedAt: authorIdentifiers.updatedAt }).from(authorIdentifiers).where(eq(authorIdentifiers.userId, current.user.id));
    return Response.json({ identifiers }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load author identifiers" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    const input = await request.json() as { orcid?: unknown };
    const orcid = canonicalOrcid(input.orcid);
    if (!orcid) return Response.json({ error: "Provide a valid 16-character ORCID iD with its checksum" }, { status: 400 });
    const now = new Date().toISOString();
    await current.db.insert(authorIdentifiers).values({ canonicalUrl: orcid.canonicalUrl, createdAt: now, id: crypto.randomUUID(), identifier: orcid.identifier, scheme: "orcid", status: "claimed", updatedAt: now, userId: current.user.id }).onConflictDoUpdate({ target: [authorIdentifiers.userId, authorIdentifiers.scheme], set: { canonicalUrl: orcid.canonicalUrl, identifier: orcid.identifier, status: "claimed", updatedAt: now } });
    return Response.json({ identifier: { ...orcid, scheme: "orcid", status: "claimed", updatedAt: now }, warning: "This is a self-claimed ORCID iD. It is kept private until an authenticated ORCID OAuth connection is completed." });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save author identifier" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const current = await account();
    if ("response" in current) return current.response;
    await current.db.delete(authorIdentifiers).where(and(eq(authorIdentifiers.userId, current.user.id), eq(authorIdentifiers.scheme, "orcid")));
    return Response.json({ removed: true, scheme: "orcid" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to remove author identifier" }, { status: 500 });
  }
}
