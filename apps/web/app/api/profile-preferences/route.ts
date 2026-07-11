import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

const colorSchemes = new Set(["scholarium-dark", "scholarium-light", "midnight-code", "paper-library"]);
type ProfileInput = { accentColor?: unknown; badgeVisibility?: unknown; colorScheme?: unknown; profileVisibility?: unknown };

export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });
    if (profileVisibility === "public" && !(await accountAudience(db, user.id)).capabilities.canPublishPublicly) {
      return Response.json({ error: "A guardian consent or verified school relationship is required before a minor account can make a public profile visible." }, { status: 403 });
    }
    const [preference] = await db.select().from(profilePreferences).where(eq(profilePreferences.userId, user.id)).limit(1);
    return Response.json({ preference: preference ?? null }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load profile preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const input = (await request.json()) as ProfileInput;
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    if (typeof input.colorScheme !== "string") {
      return Response.json({ error: "colorScheme is required" }, { status: 400 });
    }
    if (!colorSchemes.has(input.colorScheme)) return Response.json({ error: "Unsupported color scheme" }, { status: 400 });
    const accentColor = typeof input.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(input.accentColor) ? input.accentColor : "#2157ee";
    const badgeVisibility = input.badgeVisibility === "private" ? "private" : "public";
    const profileVisibility = input.profileVisibility === "public" ? "public" : "private";
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });
    const updatedAt = new Date().toISOString();
    await db.insert(profilePreferences).values({ accentColor, badgeVisibility, colorScheme: input.colorScheme, profileVisibility, updatedAt, userId: user.id }).onConflictDoUpdate({
      target: profilePreferences.userId,
      set: { accentColor, badgeVisibility, colorScheme: input.colorScheme, profileVisibility, updatedAt },
    });
    return Response.json({ preference: { accentColor, badgeVisibility, colorScheme: input.colorScheme, profileVisibility, updatedAt, userId: user.id } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update profile preferences" }, { status: 500 });
  }
}
