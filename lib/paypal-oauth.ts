import { cookies } from "next/headers";
import { safeRelativeReturnPath } from "../app/chatgpt-auth";
import { createProviderSessionCookie, getScholariumSessionSecret, secureCookie } from "./google-oauth";

const OAUTH_COOKIE = "__Host-scholarium-paypal-oauth";
type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  mode: "live" | "sandbox";
  redirectUri: string;
  sessionSecret: string;
};
type State = { expiresAt: number; returnTo: string; state: string };
type Token = { access_token?: string };
type PayPalProfile = { email?: string; name?: string; payer_id?: string; user_id?: string };

function randomState() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

async function runtimeValue(name: string) {
  const { env } = await import("cloudflare:workers");
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getPayPalConfig(): Promise<PayPalConfig | null> {
  const [clientId, clientSecret, redirectUri, sessionSecret, requestedMode] = await Promise.all([
    runtimeValue("PAYPAL_LOGIN_CLIENT_ID"),
    runtimeValue("PAYPAL_LOGIN_CLIENT_SECRET"),
    runtimeValue("PAYPAL_LOGIN_REDIRECT_URI"),
    getScholariumSessionSecret(),
    runtimeValue("PAYPAL_LOGIN_MODE"),
  ]);
  const mode = requestedMode === "live" || requestedMode === "sandbox" ? requestedMode : null;
  return clientId && clientSecret && redirectUri && sessionSecret && mode ? { clientId, clientSecret, mode, redirectUri, sessionSecret } : null;
}

function paypalWebBase(settings: PayPalConfig) {
  return settings.mode === "live" ? "https://www.paypal.com" : "https://www.sandbox.paypal.com";
}

function paypalApiBase(settings: PayPalConfig) {
  return settings.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function paypalRedirect(settings: PayPalConfig, path: string) {
  return `${paypalWebBase(settings)}${path}`;
}

function paypalApi(settings: PayPalConfig, path: string) {
  return `${paypalApiBase(settings)}${path}`;
}

/**
 * Use an explicit Location response for an external OAuth handoff. It avoids
 * worker-runtime differences around URL-object redirects while preserving the
 * secure, host-only cookie that binds the callback to this browser session.
 */
function externalRedirect(url: URL, cookie: string) {
  const headers = new Headers({ Location: url.toString() });
  headers.append("Set-Cookie", cookie);
  return new Response(null, { headers, status: 302 });
}

/**
 * The PayPal authorization transaction contains only a random CSRF nonce,
 * expiry, and a server-sanitized relative return path. Keeping it in a
 * __Host-, HttpOnly, SameSite=Lax cookie binds the callback to the initiating
 * browser without putting any access token or identity data in the cookie.
 * The authenticated provider session remains encrypted separately.
 */
function encodeState(state: State) {
  return btoa(JSON.stringify(state)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeState(value: string): State | null {
  try {
    const padded = `${value.replaceAll("-", "+").replaceAll("_", "/")}${"=".repeat((4 - value.length % 4) % 4)}`;
    const parsed = JSON.parse(atob(padded)) as Partial<State>;
    return typeof parsed.state === "string" && typeof parsed.returnTo === "string" && typeof parsed.expiresAt === "number" ? {
      expiresAt: parsed.expiresAt,
      returnTo: safeRelativeReturnPath(parsed.returnTo),
      state: parsed.state,
    } : null;
  } catch {
    return null;
  }
}

export async function paypalStartResponse(request: Request) {
  const settings = await getPayPalConfig();
  if (!settings) return Response.redirect(new URL("/app?auth_error=paypal_not_configured", request.url), 302);
  const requestUrl = new URL(request.url);
  const state = randomState();
  const saved: State = { expiresAt: Date.now() + 10 * 60_000, returnTo: safeRelativeReturnPath(requestUrl.searchParams.get("return_to") ?? "/app"), state };
  const authorizationUrl = new URL(paypalRedirect(settings, "/connect"));
  authorizationUrl.search = new URLSearchParams({ client_id: settings.clientId, flowEntry: "static", redirect_uri: settings.redirectUri, response_type: "code", scope: "openid profile email", state }).toString();
  const stateCookie = secureCookie(`${OAUTH_COOKIE}=${encodeState(saved)}`, 600);
  return externalRedirect(authorizationUrl, stateCookie);
}

export async function paypalCallbackResponse(request: Request) {
  const settings = await getPayPalConfig();
  if (!settings) return Response.redirect(new URL("/app?auth_error=paypal_not_configured", request.url), 302);
  const requestUrl = new URL(request.url);
  const encodedState = (await cookies()).get(OAUTH_COOKIE)?.value;
  const saved = encodedState ? decodeState(encodedState) : null;
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const clear = secureCookie(`${OAUTH_COOKIE}=`, 0);
  if (!saved || saved.expiresAt < Date.now() || !state || saved.state !== state || !code) { const response = Response.redirect(new URL("/app?auth_error=paypal_state_invalid", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const authorization = `Basic ${btoa(`${settings.clientId}:${settings.clientSecret}`)}`;
  const tokenResponse = await fetch(paypalApi(settings, "/v1/oauth2/token"), { body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: settings.redirectUri }), headers: { authorization, "content-type": "application/x-www-form-urlencoded" }, method: "POST" });
  const token = await tokenResponse.json() as Token;
  if (!tokenResponse.ok || !token.access_token) { const response = Response.redirect(new URL("/app?auth_error=paypal_exchange_failed", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const profileResponse = await fetch(`${paypalApi(settings, "/v1/identity/oauth2/userinfo")}?schema=paypalv1.1`, { headers: { authorization: `Bearer ${token.access_token}` } });
  const profile = await profileResponse.json() as PayPalProfile;
  const subject = profile.user_id ?? profile.payer_id;
  if (!profileResponse.ok || !subject || !profile.email) { const response = Response.redirect(new URL("/app?auth_error=paypal_identity_unverified", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const response = Response.redirect(new URL(saved.returnTo, request.url), 302);
  response.headers.append("Set-Cookie", clear);
  response.headers.append("Set-Cookie", await createProviderSessionCookie({ displayName: profile.name?.trim() || profile.email, email: profile.email.toLowerCase(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, provider: "paypal", subject }, settings.sessionSecret));
  return response;
}

export function paypalSignInPath(returnTo = "/app") { return `/api/auth/paypal/start?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
