import { and, desc, eq, notInArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { profilePreferences, profileVerifications, publicProfiles, publications, users } from "../../../../db/schema";
import { accountAudience } from "../../../../lib/account-audience";

/**
 * Public profiles intentionally expose only a chosen public identity, visual
 * preferences, an earned verification state, and already-public work. They
 * never expose provider identity, account email, private media, or settings.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    if (!/^[0-9a-f-]{16,64}$/i.test(publicId)) return Response.json({ error: "A valid public profile identifier is required" }, { status: 400 });
    const db = await getDb();
    const [profile] = await db.select({
      accentColor: profilePreferences.accentColor,
      avatarObjectKey: profilePreferences.avatarObjectKey,
      badgeVisibility: profilePreferences.badgeVisibility,
      bannerObjectKey: profilePreferences.bannerObjectKey,
      colorScheme: profilePreferences.colorScheme,
      displayName: users.displayName,
      primaryRole: users.primaryRole,
      profileVisibility: profilePreferences.profileVisibility,
      publicId: publicProfiles.publicId,
      userId: publicProfiles.userId,
      verificationStatus: profileVerifications.status,
    }).from(publicProfiles)
      .innerJoin(users, eq(users.id, publicProfiles.userId))
      .innerJoin(profilePreferences, eq(profilePreferences.userId, publicProfiles.userId))
      .leftJoin(profileVerifications, eq(profileVerifications.userId, publicProfiles.userId))
      .where(eq(publicProfiles.publicId, publicId))
      .limit(1);
    if (!profile || profile.profileVisibility !== "public" || !(await accountAudience(db, profile.userId)).capabilities.canPublishPublicly) return Response.json({ error: "Public profile was not found" }, { status: 404 });
    const work = await db.select({ abstract: publications.abstract, createdAt: publications.createdAt, id: publications.id, status: publications.verificationStatus, title: publications.title, type: publications.type }).from(publications).where(and(eq(publications.authorId, profile.userId), eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"]))).orderBy(desc(publications.createdAt)).limit(24);
    return Response.json({
      profile: {
        accentColor: profile.accentColor,
        badge: profile.badgeVisibility === "public" && profile.verificationStatus === "verified" ? { label: "Verified profile", visible: true } : { visible: false },
        colorScheme: profile.colorScheme,
        displayName: profile.displayName,
        hasAvatar: Boolean(profile.avatarObjectKey),
        hasBanner: Boolean(profile.bannerObjectKey),
        primaryRole: profile.primaryRole,
        publicId: profile.publicId,
      },
      publications: work,
    }, { headers: { "cache-control": "public, max-age=60" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load public profile" }, { status: 500 });
  }
}
