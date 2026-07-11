import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { paymentReceipts, subscriptions, users } from "../../../../../db/schema";
import { capturePayPalOrder, paypalCheckoutConfig } from "../../../../../lib/paypal-checkout";
import { VERIFIED_CONTRIBUTOR_MONTHLY_CENTS } from "../../../../../lib/verified-subscription";
import { getPlatformIdentity } from "../../../../../lib/platform-identity";

export async function GET(request: Request) {
  const success = new URL("/app?payment=completed", request.url); const failed = new URL("/app?payment=failed", request.url);
  try {
    const identity = await getPlatformIdentity(); if (!identity) return Response.redirect(failed, 302);
    const orderId = new URL(request.url).searchParams.get("token"); if (!orderId || !/^[A-Z0-9]{8,36}$/u.test(orderId)) return Response.redirect(failed, 302);
    const db = await getDb(); const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1); if (!user) return Response.redirect(failed, 302);
    const [receipt] = await db.select().from(paymentReceipts).where(and(eq(paymentReceipts.userId, user.id), eq(paymentReceipts.provider, "paypal"), eq(paymentReceipts.providerOrderId, orderId))).limit(1); if (!receipt) return Response.redirect(failed, 302);
    const config = await paypalCheckoutConfig(); if (!config) return Response.redirect(failed, 302);
    const captured = await capturePayPalOrder(config, orderId); const now = new Date().toISOString();
    await db.batch([
      db.update(paymentReceipts).set({ providerCaptureId: captured.captureId, status: "completed", updatedAt: now }).where(eq(paymentReceipts.id, receipt.id)),
      db.insert(subscriptions).values({ id: crypto.randomUUID(), userId: user.id, monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, paymentProvider: "paypal", providerSubscriptionRef: captured.captureId, status: "active", createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: [subscriptions.userId, subscriptions.plan], set: { monthlyCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, paymentProvider: "paypal", providerSubscriptionRef: captured.captureId, status: "active", updatedAt: now } }),
    ]);
    return Response.redirect(success, 302);
  } catch { return Response.redirect(failed, 302); }
}
