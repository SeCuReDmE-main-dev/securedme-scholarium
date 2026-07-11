import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { profileVerifications, subscriptions, users } from "../../../db/schema";
import { canActivateVerifiedContributor, VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, VERIFIED_CONTRIBUTOR_MONTHLY_LABEL } from "../../../lib/verified-subscription";

type SubscriptionInput = { userId?: unknown };

export function GET() {
  return Response.json({ plan: "verified_contributor", monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, priceLabel: VERIFIED_CONTRIBUTOR_MONTHLY_LABEL, rankingEffect: "none" });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as SubscriptionInput;
    if (typeof input.userId !== "string" || !input.userId.trim()) return Response.json({ error: "userId is required" }, { status: 400 });
    const db = await getDb();
    const userId = input.userId.trim();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });
    const [verification] = await db.select().from(profileVerifications).where(and(eq(profileVerifications.userId, userId), isNotNull(profileVerifications.passkeyVerifiedAt))).limit(1);
    if (!verification || !canActivateVerifiedContributor({ documentStatus: verification.status, passkeyVerifiedAt: verification.passkeyVerifiedAt })) {
      return Response.json({ error: "Document verification and a verified passkey are required before this contribution plan can be activated." }, { status: 403 });
    }
    const now = new Date().toISOString();
    await db.insert(subscriptions).values({ id: crypto.randomUUID(), monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, status: "payment_setup_required", updatedAt: now, userId }).onConflictDoUpdate({
      target: [subscriptions.userId, subscriptions.plan],
      set: { monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, status: "payment_setup_required", updatedAt: now },
    });
    return Response.json({ plan: "verified_contributor", monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, status: "payment_setup_required" }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to prepare subscription" }, { status: 500 });
  }
}
