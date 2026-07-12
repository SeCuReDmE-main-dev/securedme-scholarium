import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { paymentReceipts, profileVerifications, users } from "../../../../../db/schema";
import { createVerifiedContributorOrder, paypalCheckoutConfig, paypalCheckoutPublicConfig } from "../../../../../lib/paypal-checkout";
import { canActivateVerifiedContributor, VERIFIED_CONTRIBUTOR_MONTHLY_CENTS } from "../../../../../lib/verified-subscription";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

export async function GET() { return Response.json(paypalCheckoutPublicConfig(await paypalCheckoutConfig()), { headers: { "cache-control": "no-store" } }); }

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity(); if (!identity) return signInRequired();
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "Create your Scholarium profile before starting checkout." }, { status: 404 });
    const [verification] = await db.select().from(profileVerifications).where(and(eq(profileVerifications.userId, user.id), isNotNull(profileVerifications.passkeyVerifiedAt))).limit(1);
    if (!verification || !canActivateVerifiedContributor({ documentStatus: verification.status, passkeyVerifiedAt: verification.passkeyVerifiedAt })) return Response.json({ error: "Document verification and a verified passkey are required before checkout." }, { status: 403 });
    const config = await paypalCheckoutConfig(); if (!config) return Response.json({ error: "PayPal checkout is not configured." }, { status: 503 });
    const base = new URL(request.url); const returnUrl = new URL("/api/v1/payments/paypal/return", base); const cancelUrl = new URL("/app?payment=cancelled", base);
    const order = await createVerifiedContributorOrder(config, returnUrl.toString(), cancelUrl.toString()); const now = new Date().toISOString();
    await db.insert(paymentReceipts).values({ id: crypto.randomUUID(), userId: user.id, provider: "paypal", providerOrderId: order.orderId, amountCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, currency: "USD", status: "approved_pending_capture", createdAt: now, updatedAt: now });
    return Response.json({ approveUrl: order.approveUrl, orderId: order.orderId }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create PayPal order" }, { status: 502 }); }
}
