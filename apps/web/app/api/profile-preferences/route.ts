import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { profilePreferences, users } from "../../../db/schema";

const colorSchemes = new Set(["scholarium-dark", "scholarium-light", "midnight-code", "paper-library"]);
type ProfileInput = { accentColor?: unknown; badgeVisibility?: unknown; colorScheme?: unknown; userId?: unknown };

export async function PUT(request: Request) {
  try {
    const input = (await request.json()) as ProfileInput;
    if (typeof input.userId !== "string" || !input.userId.trim() || typeof input.colorScheme !== "string") {
      return Response.json({ error: "userId and colorScheme are required" }, { status: 400 });
    }
    if (!colorSchemes.has(input.colorScheme)) return Response.json({ error: "Unsupported color scheme" }, { status: 400 });
    const accentColor = typeof input.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(input.accentColor) ? input.accentColor : "#2157ee";
    const badgeVisibility = input.badgeVisibility === "private" ? "private" : "public";
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId.trim())).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });
    const updatedAt = new Date().toISOString();
    await db.insert(profilePreferences).values({ accentColor, badgeVisibility, colorScheme: input.colorScheme, updatedAt, userId: user.id }).onConflictDoUpdate({
      target: profilePreferences.userId,
      set: { accentColor, badgeVisibility, colorScheme: input.colorScheme, updatedAt },
    });
    return Response.json({ preference: { accentColor, badgeVisibility, colorScheme: input.colorScheme, updatedAt, userId: user.id } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update profile preferences" }, { status: 500 });
  }
}
