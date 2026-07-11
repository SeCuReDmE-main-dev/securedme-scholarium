import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, users } from "../../../db/schema";
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
    const userId = await accountId();
    if (!userId) return signInRequired();
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "avatar" && kind !== "banner") return Response.json({ error: "A valid profile media kind is required" }, { status: 400 });
    const db = await getDb();
    const [preferences] = await db.select({ avatarObjectKey: profilePreferences.avatarObjectKey, bannerObjectKey: profilePreferences.bannerObjectKey }).from(profilePreferences).where(eq(profilePreferences.userId, userId)).limit(1);
    const objectKey = kind === "avatar" ? preferences?.avatarObjectKey : preferences?.bannerObjectKey;
    if (!objectKey) return Response.json({ error: "Profile media was not found" }, { status: 404 });
    const object = await (await getMediaStore()).get(objectKey);
    if (!object) return Response.json({ error: "Profile media was not found" }, { status: 404 });
    return new Response(object.body, { headers: { "cache-control": "private, no-store", "content-type": object.httpMetadata?.contentType ?? "application/octet-stream", "x-content-type-options": "nosniff" } });
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
