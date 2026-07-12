import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { rankingPreferences, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type RankingInput = { diversityWeight?: unknown; freshnessWeight?: unknown; relevanceWeight?: unknown };

function boundedWeight(value: unknown, field: string) {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) {
    throw new Error(`${field} must be an integer between 0 and 100`);
  }
  return value as number;
}

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();

  try {
    const db = await getDb();
    const [preference] = await db.select().from(rankingPreferences).where(eq(rankingPreferences.userId, identity.userId)).limit(1);
    return Response.json({ preference: preference ?? null });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load ranking preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const input = (await request.json()) as RankingInput;
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const userId = identity.userId;
    const relevanceWeight = boundedWeight(input.relevanceWeight, "relevanceWeight");
    const freshnessWeight = boundedWeight(input.freshnessWeight, "freshnessWeight");
    const diversityWeight = boundedWeight(input.diversityWeight, "diversityWeight");
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });

    const updatedAt = new Date().toISOString();
    await db.insert(rankingPreferences).values({
      diversityWeight,
      freshnessWeight,
      relevanceWeight,
      updatedAt,
      userId,
    }).onConflictDoUpdate({
      target: rankingPreferences.userId,
      set: { diversityWeight, freshnessWeight, relevanceWeight, updatedAt },
    });

    return Response.json({ preference: { diversityWeight, freshnessWeight, relevanceWeight, updatedAt, userId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save ranking preferences";
    return Response.json({ error: message }, { status: /between 0 and 100/.test(message) ? 400 : 500 });
  }
}
