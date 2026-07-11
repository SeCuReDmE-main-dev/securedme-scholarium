import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicationRelationships, publications, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { publicationRelationshipInput } from "../../../lib/publication-relationship";

export async function GET(request: Request) {
  try {
    const publicationId = new URL(request.url).searchParams.get("publicationId"); if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const db = await getDb(); const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1); if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
    const relationships = await db.select({ createdAt: publicationRelationships.createdAt, declaration: publicationRelationships.declaration, relationType: publicationRelationships.relationType, sourceLicense: publicationRelationships.sourceLicense, sourceTitle: publicationRelationships.sourceTitle, sourceUrl: publicationRelationships.sourceUrl }).from(publicationRelationships).where(eq(publicationRelationships.publicationId, publication.id));
    return Response.json({ publicationId, relationships });
  } catch { return Response.json({ error: "Unable to load source relationships" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity(); if (!identity) return signInRequired();
    const input = await request.json() as Record<string, unknown>; if (typeof input.publicationId !== "string") return Response.json({ error: "publicationId is required" }, { status: 400 });
    const relationship = publicationRelationshipInput(input); const db = await getDb(); const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1); if (!user) return Response.json({ error: "Create an account before declaring a source" }, { status: 404 });
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, user.id))).limit(1); if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    await db.insert(publicationRelationships).values({ id: crypto.randomUUID(), userId: user.id, publicationId: publication.id, ...relationship }).onConflictDoNothing();
    return Response.json({ publicationId: publication.id, relationship }, { status: 201 });
  } catch (error) { const message = error instanceof Error ? error.message : "Unable to save source relationship"; return Response.json({ error: message }, { status: /required|valid|HTTPS|supported/.test(message) ? 400 : 500 }); }
}
