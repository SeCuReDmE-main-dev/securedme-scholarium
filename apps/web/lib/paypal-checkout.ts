import { VERIFIED_CONTRIBUTOR_MONTHLY_CENTS } from "./verified-subscription";

type PayPalConfig = { clientId: string; clientSecret: string; mode: "live" | "sandbox"; webhookId: string | null };
type PayPalOrder = { id?: string; links?: Array<{ href?: string; rel?: string }>; status?: string };

async function runtimeValue(name: string) {
  const { env } = await import("cloudflare:workers");
  const value = (env as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function paypalCheckoutConfig() {
  const [checkoutId, checkoutSecret, loginId, loginSecret, modeValue, webhookId] = await Promise.all([
    runtimeValue("PAYPAL_CHECKOUT_CLIENT_ID"), runtimeValue("PAYPAL_CHECKOUT_CLIENT_SECRET"),
    runtimeValue("PAYPAL_LOGIN_CLIENT_ID"), runtimeValue("PAYPAL_LOGIN_CLIENT_SECRET"),
    runtimeValue("PAYPAL_CHECKOUT_MODE"), runtimeValue("PAYPAL_CHECKOUT_WEBHOOK_ID"),
  ]);
  const mode = modeValue === "live" || modeValue === "sandbox" ? modeValue : "sandbox";
  const clientId = checkoutId ?? loginId;
  const clientSecret = checkoutSecret ?? loginSecret;
  return clientId && clientSecret ? { clientId, clientSecret, mode, webhookId } satisfies PayPalConfig : null;
}

function apiBase(config: PayPalConfig) { return config.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"; }

async function accessToken(config: PayPalConfig) {
  const response = await fetch(`${apiBase(config)}/v1/oauth2/token`, { method: "POST", headers: { authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, "content-type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const payload = await response.json() as { access_token?: string };
  if (!response.ok || !payload.access_token) throw new Error("PayPal access token could not be issued");
  return payload.access_token;
}

export async function createVerifiedContributorOrder(config: PayPalConfig, returnUrl: string, cancelUrl: string) {
  const response = await fetch(`${apiBase(config)}/v2/checkout/orders`, {
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken(config)}`, "content-type": "application/json", "paypal-request-id": crypto.randomUUID() },
    body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ reference_id: "verified_contributor", amount: { currency_code: "USD", value: (VERIFIED_CONTRIBUTOR_MONTHLY_CENTS / 100).toFixed(2) }, description: "Scholarium verified contributor — one month" }], payment_source: { paypal: { experience_context: { cancel_url: cancelUrl, return_url: returnUrl, shipping_preference: "NO_SHIPPING" } } } }),
  });
  const order = await response.json() as PayPalOrder;
  const approveUrl = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!response.ok || !order.id || !approveUrl) throw new Error("PayPal did not return an approval link");
  return { approveUrl, orderId: order.id };
}

export async function capturePayPalOrder(config: PayPalConfig, orderId: string) {
  const response = await fetch(`${apiBase(config)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: "POST", headers: { authorization: `Bearer ${await accessToken(config)}`, "content-type": "application/json", "paypal-request-id": crypto.randomUUID() }, body: "{}" });
  const payload = await response.json() as { id?: string; status?: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string; status?: string }> } }> };
  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
  if (!response.ok || payload.status !== "COMPLETED" || !capture?.id || capture.status !== "COMPLETED") throw new Error("PayPal capture was not completed");
  return { captureId: capture.id, orderId: payload.id ?? orderId };
}

export async function verifyPayPalWebhook(config: PayPalConfig, headers: Headers, event: unknown) {
  if (!config.webhookId) return false;
  const body = { auth_algo: headers.get("paypal-auth-algo"), cert_url: headers.get("paypal-cert-url"), transmission_id: headers.get("paypal-transmission-id"), transmission_sig: headers.get("paypal-transmission-sig"), transmission_time: headers.get("paypal-transmission-time"), webhook_event: event, webhook_id: config.webhookId };
  if (Object.values(body).some((value) => value == null || value === "")) return false;
  const response = await fetch(`${apiBase(config)}/v1/notifications/verify-webhook-signature`, { method: "POST", headers: { authorization: `Bearer ${await accessToken(config)}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as { verification_status?: string };
  return response.ok && result.verification_status === "SUCCESS";
}

export function paypalCheckoutPublicConfig(config: PayPalConfig | null) { return { configured: Boolean(config), mode: config?.mode ?? "sandbox", provider: "paypal", priceCents: VERIFIED_CONTRIBUTOR_MONTHLY_CENTS, currency: "USD" }; }
