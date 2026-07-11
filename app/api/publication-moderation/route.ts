import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { moderationCases, publications } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

/** Authors can inspect their own automated reason codes without exposing private text or other accounts. */
export async function GET(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const db = await getDb();
    const [publication] = await db.select({ id: publications.id, verificationStatus: publications.verificationStatus, visibility: publications.visibility }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.authorId, identity.userId))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
    const cases = await db.select({ createdAt: moderationCases.createdAt, reasonCode: moderationCases.reasonCode, status: moderationCases.status }).from(moderationCases).where(eq(moderationCases.publicationId, publication.id));
    return Response.json({ cases, publication });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load publication moderation" }, { status: 500 });
  }
}
