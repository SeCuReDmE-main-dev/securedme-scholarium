import { cookies } from "next/headers";
import { safeRelativeReturnPath } from "../app/chatgpt-auth";

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_COOKIE = "__Host-scholarium-google-oauth";
const SESSION_COOKIE = "__Host-scholarium-google-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type GoogleOAuthConfig = { clientId: string; clientSecret: string; redirectUri: string; sessionSecret: string };
type GoogleAuthorizationState = { expiresAt: number; returnTo: string; state: string; verifier: string };
export type OAuthProvider = "google" | "github" | "paypal";
export type ProviderSession = { displayName: string; email: string; expiresAt: number; provider: OAuthProvider; subject: string };
type GoogleTokenResponse = { access_token?: string; error?: string };
type GoogleUserInfo = { email?: string; email_verified?: boolean; name?: string; sub?: string };

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function bytesFromBase64Url(value: string) {
  const padded = `${value.replaceAll("-", "+").replaceAll("_", "/")}${"=".repeat((4 - value.length % 4) % 4)}`;
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomBase64Url(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function getRuntimeValue(name: string) {
  const { env } = await import("cloudflare:workers");
  const value = (env as unknown as Record<string, unknown>)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig | null> {
  const [clientId, clientSecret, redirectUri, sessionSecret] = await Promise.all([
    getRuntimeValue("GOOGLE_OAUTH_CLIENT_ID"),
    getRuntimeValue("GOOGLE_OAUTH_CLIENT_SECRET"),
    getRuntimeValue("GOOGLE_OAUTH_REDIRECT_URI"),
    getRuntimeValue("SCHOLARIUM_SESSION_SECRET"),
  ]);
  if (!clientId || !clientSecret || !redirectUri || !sessionSecret) return null;
  return { clientId, clientSecret, redirectUri, sessionSecret };
}

export async function getScholariumSessionSecret() { return getRuntimeValue("SCHOLARIUM_SESSION_SECRET"); }

export function secureCookie(value: string, maxAge: number, path = "/") {
  return `${value}; Path=${path}; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

async function encryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function sealOAuthValue(value: unknown, secret: string) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const cipher = await crypto.subtle.encrypt({ iv, name: "AES-GCM" }, await encryptionKey(secret), new TextEncoder().encode(JSON.stringify(value)));
  return `${base64Url(iv)}.${base64Url(new Uint8Array(cipher))}`;
}

export async function unsealOAuthValue<T>(value: string, secret: string): Promise<T | null> {
  const [encodedIv, encodedCipher] = value.split(".");
  if (!encodedIv || !encodedCipher) return null;
  try {
    const plaintext = await crypto.subtle.decrypt({ iv: bytesFromBase64Url(encodedIv), name: "AES-GCM" }, await encryptionKey(secret), bytesFromBase64Url(encodedCipher));
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch { return null; }
}

export async function googleStartResponse(request: Request) {
  const config = await getGoogleOAuthConfig();
  if (!config) return Response.redirect(new URL("/app?auth_error=google_not_configured", request.url), 302);
  const requestUrl = new URL(request.url);
  const state = randomBase64Url();
  const verifier = randomBase64Url(48);
  const challenge = base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const stateValue: GoogleAuthorizationState = { expiresAt: Date.now() + 10 * 60_000, returnTo: safeRelativeReturnPath(requestUrl.searchParams.get("return_to") ?? "/app"), state, verifier };
  const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({ client_id: config.clientId, code_challenge: challenge, code_challenge_method: "S256", redirect_uri: config.redirectUri, response_type: "code", scope: "openid email profile", state }).toString();
  const response = Response.redirect(authorizationUrl, 302);
  response.headers.append("Set-Cookie", secureCookie(`${OAUTH_COOKIE}=${await sealOAuthValue(stateValue, config.sessionSecret)}`, 600));
  return response;
}

export async function googleCallbackResponse(request: Request) {
  const config = await getGoogleOAuthConfig();
  const requestUrl = new URL(request.url);
  if (!config) return Response.redirect(new URL("/app?auth_error=google_not_configured", request.url), 302);
  const savedState = (await cookies()).get(OAUTH_COOKIE)?.value;
  const authorizationState = savedState ? await unsealOAuthValue<GoogleAuthorizationState>(savedState, config.sessionSecret) : null;
  const returnedState = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const clearAuthCookie = secureCookie(`${OAUTH_COOKIE}=`, 0);
  if (!authorizationState || authorizationState.expiresAt < Date.now() || !returnedState || returnedState !== authorizationState.state || !code) {
    const response = Response.redirect(new URL("/app?auth_error=google_state_invalid", request.url), 302);
    response.headers.append("Set-Cookie", clearAuthCookie);
    return response;
  }
  const tokenBody = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, code_verifier: authorizationState.verifier, grant_type: "authorization_code", redirect_uri: config.redirectUri });
  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, { body: tokenBody, headers: { "content-type": "application/x-www-form-urlencoded" }, method: "POST" });
  const token = await tokenResponse.json() as GoogleTokenResponse;
  if (!tokenResponse.ok || !token.access_token) {
    const response = Response.redirect(new URL("/app?auth_error=google_exchange_failed", request.url), 302);
    response.headers.append("Set-Cookie", clearAuthCookie);
    return response;
  }
  const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, { headers: { authorization: `Bearer ${token.access_token}` } });
  const userInfo = await userInfoResponse.json() as GoogleUserInfo;
  if (!userInfoResponse.ok || !userInfo.sub || !userInfo.email || userInfo.email_verified !== true) {
    const response = Response.redirect(new URL("/app?auth_error=google_identity_unverified", request.url), 302);
    response.headers.append("Set-Cookie", clearAuthCookie);
    return response;
  }
  const session: ProviderSession = { displayName: userInfo.name?.trim() || userInfo.email, email: userInfo.email.toLowerCase(), expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000, provider: "google", subject: userInfo.sub };
  const response = Response.redirect(new URL(authorizationState.returnTo, request.url), 302);
  response.headers.append("Set-Cookie", clearAuthCookie);
  response.headers.append("Set-Cookie", await createProviderSessionCookie(session, config.sessionSecret));
  return response;
}

export async function createProviderSessionCookie(session: ProviderSession, secret: string) {
  return secureCookie(`${SESSION_COOKIE}=${await sealOAuthValue(session, secret)}`, SESSION_MAX_AGE_SECONDS);
}

export async function getProviderSession(): Promise<ProviderSession | null> {
  const sessionSecret = await getScholariumSessionSecret();
  if (!sessionSecret) return null;
  const encodedSession = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = encodedSession ? await unsealOAuthValue<ProviderSession>(encodedSession, sessionSecret) : null;
  if (!session || session.expiresAt < Date.now() || !session.subject || !session.email || !["google", "github", "paypal"].includes(session.provider)) return null;
  return session;
}

export function googleSignInPath(returnTo = "/app") { return `/api/auth/google/start?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
export function googleSignOutPath(returnTo = "/") { return `/api/auth/google/signout?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
export function clearProviderSessionCookie() { return secureCookie(`${SESSION_COOKIE}=`, 0); }
