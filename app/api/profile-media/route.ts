import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, publicProfiles, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getMediaStore } from "../../../lib/media-store";
import { ProfileMediaKind, validateProfileMedia } from "../../../lib/profile-media-validation";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

function objectKeyFor(userId: string, kind: ProfileMediaKind, extension: string) {
  return `profiles/${userId}/${kind}/${crypto.randomUUID()}.${extension}`;
}

async function accountId() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const kind = requestUrl.searchParams.get("kind");
    if (kind !== "avatar" && kind !== "banner") return Response.json({ error: "A valid profile media kind is required" }, { status: 400 });
    const db = await getDb();
    const publicProfileId = requestUrl.searchParams.get("publicProfileId");
    const userId = publicProfileId ? null : await accountId();
    if (!publicProfileId && !userId) return signInRequired();
    const [preferences] = publicProfileId
      ? await db.select({ avatarObjectKey: profilePreferences.avatarObjectKey, bannerObjectKey: profilePreferences.bannerObjectKey, profileVisibility: profilePreferences.profileVisibility, userId: publicProfiles.userId }).from(publicProfiles).innerJoin(profilePreferences, eq(profilePreferences.userId, publicProfiles.userId)).where(eq(publicProfiles.publicId, publicProfileId)).limit(1)
      : await db.select({ avatarObjectKey: profilePreferences.avatarObjectKey, bannerObjectKey: profilePreferences.bannerObjectKey, profileVisibility: profilePreferences.profileVisibility, userId: profilePreferences.userId }).from(profilePreferences).where(eq(profilePreferences.userId, userId!)).limit(1);
    if (publicProfileId && (preferences?.profileVisibility !== "public" || !preferences?.userId || !(await accountAudience(db, preferences.userId)).capabilities.canPublishPublicly)) return Response.json({ error: "Public profile media was not found" }, { status: 404 });
    const objectKey = kind === "avatar" ? preferences?.avatarObjectKey : preferences?.bannerObjectKey;
    if (!objectKey) return Response.json({ error: "Profile media was not found" }, { status: 404 });
    const object = await (await getMediaStore()).get(objectKey);
    if (!object) return Response.json({ error: "Profile media was not found" }, { status: 404 });
    return new Response(object.body, { headers: { "cache-control": publicProfileId ? "public, max-age=300" : "private, no-store", "content-type": object.httpMetadata?.contentType ?? "application/octet-stream", "x-content-type-options": "nosniff" } });
  } catch (error) {
    console.error("Profile media read failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to load profile media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await accountId();
    if (!userId) return signInRequired();
    const formData = await request.formData();
    const validation = await validateProfileMedia(typeof formData.get("kind") === "string" ? formData.get("kind") as string : null, formData.get("file"));
    if (!validation.ok) return Response.json({ error: validation.error }, { status: validation.status });
    if (!validation.kind) return Response.json({ error: "A valid profile media kind is required" }, { status: 400 });
    const file = formData.get("file") as File;
    const objectKey = objectKeyFor(userId, validation.kind, validation.extension);
    await (await getMediaStore()).put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: validation.contentType } });
    const db = await getDb();
    const updatedAt = new Date().toISOString();
    const values = validation.kind === "avatar" ? { avatarObjectKey: objectKey, updatedAt } : { bannerObjectKey: objectKey, updatedAt };
    await db.insert(profilePreferences).values({ userId, ...values }).onConflictDoUpdate({ target: profilePreferences.userId, set: values });
    return Response.json({ media: { kind: validation.kind, updatedAt } }, { status: 201 });
  } catch (error) {
    console.error("Profile media upload failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to save profile media" }, { status: 500 });
  }
}
