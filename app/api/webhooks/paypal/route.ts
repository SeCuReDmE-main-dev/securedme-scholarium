import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { paymentReceipts, subscriptions } from "../../../../db/schema";
import { paypalCheckoutConfig, verifyPayPalWebhook } from "../../../../lib/paypal-checkout";

const MAXIMUM_WEBHOOK_BYTES = 256_000;
function noStore(response: Response) { const headers = new Headers(response.headers); headers.set("cache-control", "no-store"); return new Response(response.body, { headers, status: response.status, statusText: response.statusText }); }

type PayPalWebhook = { id?: string; event_type?: string; resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } };

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get("content-length") ?? "0"); if (!Number.isFinite(length) || length > MAXIMUM_WEBHOOK_BYTES) return noStore(Response.json({ error: "Webhook payload is too large." }, { status: 413 }));
    const body = await request.text(); if (new TextEncoder().encode(body).byteLength > MAXIMUM_WEBHOOK_BYTES) return noStore(Response.json({ error: "Webhook payload is too large." }, { status: 413 }));
    const event = JSON.parse(body) as PayPalWebhook; const config = await paypalCheckoutConfig();
    if (!config || !(await verifyPayPalWebhook(config, request.headers, event))) return noStore(Response.json({ error: "Webhook signature was not accepted." }, { status: 403 }));
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id; if (!event.id || !orderId) return noStore(Response.json({ received: true, recorded: false }, { status: 202 }));
    const db = await getDb(); const [receipt] = await db.select().from(paymentReceipts).where(and(eq(paymentReceipts.provider, "paypal"), eq(paymentReceipts.providerOrderId, orderId))).limit(1); if (!receipt) return noStore(Response.json({ received: true, recorded: false }, { status: 202 }));
    const now = new Date().toISOString(); const completed = event.event_type === "PAYMENT.CAPTURE.COMPLETED";
    await db.batch([
      db.update(paymentReceipts).set({ providerCaptureId: completed ? event.resource?.id ?? receipt.providerCaptureId : receipt.providerCaptureId, providerEventId: event.id, status: completed ? "completed" : event.event_type === "PAYMENT.CAPTURE.DENIED" ? "denied" : "pending", updatedAt: now }).where(eq(paymentReceipts.id, receipt.id)),
      ...(completed ? [db.update(subscriptions).set({ paymentProvider: "paypal", providerSubscriptionRef: event.resource?.id ?? receipt.providerCaptureId, status: "active", updatedAt: now }).where(and(eq(subscriptions.userId, receipt.userId), eq(subscriptions.plan, "verified_contributor")))] : []),
    ]);
    return noStore(Response.json({ received: true, recorded: true }, { status: 202 }));
  } catch { return noStore(Response.json({ error: "Webhook payload was not accepted." }, { status: 400 })); }
}
