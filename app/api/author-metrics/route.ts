import { and, eq, inArray, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, publicProfiles, publicationComments, publicationReactions, publications } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";

/** Transparent first-party counts only; no inferred readership or third-party citations. */
export async function GET(request: Request) {
  try {
    const publicId = new URL(request.url).searchParams.get("publicProfileId");
    if (!publicId || !/^[0-9a-f-]{16,64}$/i.test(publicId)) return Response.json({ error: "A valid publicProfileId is required" }, { status: 400 });
    const db = await getDb();
    const [profile] = await db.select({ userId: publicProfiles.userId }).from(publicProfiles).innerJoin(profilePreferences, eq(profilePreferences.userId, publicProfiles.userId)).where(and(eq(publicProfiles.publicId, publicId), eq(profilePreferences.profileVisibility, "public"))).limit(1);
    if (!profile || !(await accountAudience(db, profile.userId)).capabilities.canPublishPublicly) return Response.json({ error: "Public profile was not found" }, { status: 404 });
    const work = await db.select({ id: publications.id, status: publications.verificationStatus }).from(publications).where(and(eq(publications.authorId, profile.userId), eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"])));
    const ids = work.map((publication) => publication.id);
    const [reactions, comments] = ids.length ? await Promise.all([
      db.select({ id: publicationReactions.id }).from(publicationReactions).where(inArray(publicationReactions.publicationId, ids)),
      db.select({ id: publicationComments.id }).from(publicationComments).where(and(inArray(publicationComments.publicationId, ids), eq(publicationComments.status, "visible"))),
    ]) : [[], []] as const;
    return Response.json({
      metrics: { publicComments: comments.length, publicReactions: reactions.length, publicWorks: work.length, verifiedWorks: work.filter((publication) => publication.status === "verified").length },
      excludes: ["passive readership", "off-platform activity", "third-party citation counts", "paid contribution data"],
      source: "Scholarium first-party public records",
    }, { headers: { "cache-control": "public, max-age=60" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load author metrics" }, { status: 500 }); }
}
