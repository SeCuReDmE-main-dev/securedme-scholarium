import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicProfiles, roleAssignments, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  try {
    const db = await getDb();
    const [account] = await db.select({ displayName: users.displayName, id: users.id, primaryRole: users.primaryRole }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!account) return Response.json({ account: null });
    await db.insert(publicProfiles).values({ publicId: crypto.randomUUID(), userId: account.id }).onConflictDoNothing();
    const [profile] = await db.select({ publicId: publicProfiles.publicId }).from(publicProfiles).where(eq(publicProfiles.userId, account.id)).limit(1);
    const [role] = await db.select({ ageBand: roleAssignments.ageBand }).from(roleAssignments).where(eq(roleAssignments.userId, account.id)).limit(1);
    return Response.json({ account: { ...account, ageBand: role?.ageBand ?? "unknown", email: identity.email, publicProfileId: profile?.publicId ?? null } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load account" }, { status: 500 });
  }
}
