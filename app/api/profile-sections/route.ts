import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, profileSections, publicProfiles, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

const kinds = new Set(["biography", "affiliation", "teaching", "service", "project"]);
type SectionInput = { body?: unknown; displayOrder?: unknown; id?: unknown; sectionKind?: unknown; title?: unknown; visibility?: unknown };

function textField(value: unknown, field: string, maximum: number, required = true) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || (required && !value.trim()) || value.length > maximum) throw new Error(`${field} must be at most ${maximum} characters${required ? " and cannot be empty" : ""}`);
  return value.trim();
}

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET(request: Request) {
  try {
    const publicProfileId = new URL(request.url).searchParams.get("publicProfileId");
    if (publicProfileId) {
      const db = await getDb();
      const [profile] = await db.select({ userId: publicProfiles.userId }).from(publicProfiles).innerJoin(profilePreferences, eq(profilePreferences.userId, publicProfiles.userId)).where(and(eq(publicProfiles.publicId, publicProfileId), eq(profilePreferences.profileVisibility, "public"))).limit(1);
      if (!profile || !(await accountAudience(db, profile.userId)).capabilities.canPublishPublicly) return Response.json({ error: "Public profile was not found" }, { status: 404 });
      const sections = await db.select({ body: profileSections.body, displayOrder: profileSections.displayOrder, id: profileSections.id, sectionKind: profileSections.sectionKind, title: profileSections.title }).from(profileSections).where(and(eq(profileSections.userId, profile.userId), eq(profileSections.visibility, "public"))).orderBy(asc(profileSections.displayOrder), asc(profileSections.createdAt));
      return Response.json({ sections }, { headers: { "cache-control": "public, max-age=60" } });
    }
    const current = await account();
    if (!current) return signInRequired();
    const sections = await current.db.select().from(profileSections).where(eq(profileSections.userId, current.user.id)).orderBy(asc(profileSections.displayOrder), asc(profileSections.createdAt));
    return Response.json({ sections }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load profile sections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as SectionInput;
    const sectionKind = textField(input.sectionKind, "sectionKind", 32);
    if (!kinds.has(sectionKind!)) return Response.json({ error: "Unsupported sectionKind" }, { status: 400 });
    const title = textField(input.title, "title", 140)!;
    const body = textField(input.body ?? "", "body", 8_000)!;
    const visibility = input.visibility === "public" ? "public" : input.visibility === "private" || input.visibility === undefined ? "private" : null;
    if (!visibility) return Response.json({ error: "visibility must be public or private" }, { status: 400 });
    const displayOrder = typeof input.displayOrder === "number" && Number.isInteger(input.displayOrder) && input.displayOrder >= 0 && input.displayOrder <= 999 ? input.displayOrder : 0;
    const now = new Date().toISOString();
    const section = { body, createdAt: now, displayOrder, id: crypto.randomUUID(), sectionKind, title, updatedAt: now, userId: current.user.id, visibility };
    await current.db.insert(profileSections).values(section);
    return Response.json({ section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create profile section";
    return Response.json({ error: message }, { status: /must be|sectionKind/.test(message) ? 400 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as SectionInput;
    const id = textField(input.id, "id", 64)!;
    const title = textField(input.title, "title", 140)!;
    const body = textField(input.body ?? "", "body", 8_000)!;
    const visibility = input.visibility === "public" || input.visibility === "private" ? input.visibility : null;
    if (!visibility) return Response.json({ error: "visibility must be public or private" }, { status: 400 });
    const displayOrder = typeof input.displayOrder === "number" && Number.isInteger(input.displayOrder) && input.displayOrder >= 0 && input.displayOrder <= 999 ? input.displayOrder : 0;
    const result = await current.db.update(profileSections).set({ body, displayOrder, title, updatedAt: new Date().toISOString(), visibility }).where(and(eq(profileSections.id, id), eq(profileSections.userId, current.user.id))).returning({ id: profileSections.id });
    if (!result[0]) return Response.json({ error: "Profile section was not found" }, { status: 404 });
    return Response.json({ updated: true, id });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update profile section" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    await current.db.delete(profileSections).where(and(eq(profileSections.id, id), eq(profileSections.userId, current.user.id)));
    return Response.json({ deleted: true, id });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete profile section" }, { status: 500 });
  }
}
