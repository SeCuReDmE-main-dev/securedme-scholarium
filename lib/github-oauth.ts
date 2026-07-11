import { cookies } from "next/headers";
import { safeRelativeReturnPath } from "../app/chatgpt-auth";
import { createProviderSessionCookie, getScholariumSessionSecret, sealOAuthValue, secureCookie, unsealOAuthValue } from "./google-oauth";

const AUTHORIZATION_ENDPOINT = "https://github.com/login/oauth/authorize";
const TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token";
const USER_ENDPOINT = "https://api.github.com/user";
const EMAILS_ENDPOINT = "https://api.github.com/user/emails";
const OAUTH_COOKIE = "__Host-scholarium-github-oauth";
type GitHubConfig = { clientId: string; clientSecret: string; redirectUri: string; sessionSecret: string };
type State = { expiresAt: number; returnTo: string; state: string };
type Token = { access_token?: string };
type GitHubUser = { email?: string | null; id?: number; login?: string; name?: string | null };
type GitHubEmail = { email?: string; primary?: boolean; verified?: boolean };

function randomState() { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, ""); }
async function value(name: string) { const { env } = await import("cloudflare:workers"); const result = (env as unknown as Record<string, unknown>)[name]; return typeof result === "string" && result.trim() ? result.trim() : null; }
async function config(): Promise<GitHubConfig | null> { const [clientId, clientSecret, redirectUri, sessionSecret] = await Promise.all([value("GITHUB_OAUTH_CLIENT_ID"), value("GITHUB_OAUTH_CLIENT_SECRET"), value("GITHUB_OAUTH_REDIRECT_URI"), getScholariumSessionSecret()]); return clientId && clientSecret && redirectUri && sessionSecret ? { clientId, clientSecret, redirectUri, sessionSecret } : null; }

export async function githubStartResponse(request: Request) {
  const settings = await config();
  if (!settings) return Response.redirect(new URL("/app?auth_error=github_not_configured", request.url), 302);
  const requestUrl = new URL(request.url);
  const state = randomState();
  const saved: State = { expiresAt: Date.now() + 10 * 60_000, returnTo: safeRelativeReturnPath(requestUrl.searchParams.get("return_to") ?? "/app"), state };
  const authorizationUrl = new URL(AUTHORIZATION_ENDPOINT);
  authorizationUrl.search = new URLSearchParams({ client_id: settings.clientId, redirect_uri: settings.redirectUri, scope: "read:user user:email", state }).toString();
  const response = Response.redirect(authorizationUrl, 302);
  response.headers.append("Set-Cookie", secureCookie(`${OAUTH_COOKIE}=${await sealOAuthValue(saved, settings.sessionSecret)}`, 600));
  return response;
}

export async function githubCallbackResponse(request: Request) {
  const settings = await config();
  if (!settings) return Response.redirect(new URL("/app?auth_error=github_not_configured", request.url), 302);
  const requestUrl = new URL(request.url);
  const encodedState = (await cookies()).get(OAUTH_COOKIE)?.value;
  const saved = encodedState ? await unsealOAuthValue<State>(encodedState, settings.sessionSecret) : null;
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const clear = secureCookie(`${OAUTH_COOKIE}=`, 0);
  if (!saved || saved.expiresAt < Date.now() || !state || saved.state !== state || !code) { const response = Response.redirect(new URL("/app?auth_error=github_state_invalid", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const tokenResponse = await fetch(TOKEN_ENDPOINT, { body: new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: settings.redirectUri }), headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" }, method: "POST" });
  const token = await tokenResponse.json() as Token;
  if (!tokenResponse.ok || !token.access_token) { const response = Response.redirect(new URL("/app?auth_error=github_exchange_failed", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const headers = { accept: "application/vnd.github+json", authorization: `Bearer ${token.access_token}`, "x-github-api-version": "2022-11-28" };
  const [userResponse, emailsResponse] = await Promise.all([fetch(USER_ENDPOINT, { headers }), fetch(EMAILS_ENDPOINT, { headers })]);
  const user = await userResponse.json() as GitHubUser;
  const emails = await emailsResponse.json() as GitHubEmail[];
  const email = user.email ?? emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;
  if (!userResponse.ok || !emailsResponse.ok || !user.id || !email) { const response = Response.redirect(new URL("/app?auth_error=github_email_unverified", request.url), 302); response.headers.append("Set-Cookie", clear); return response; }
  const response = Response.redirect(new URL(saved.returnTo, request.url), 302);
  response.headers.append("Set-Cookie", clear);
  response.headers.append("Set-Cookie", await createProviderSessionCookie({ displayName: user.name?.trim() || user.login || email, email: email.toLowerCase(), expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, provider: "github", subject: String(user.id) }, settings.sessionSecret));
  return response;
}

export function githubSignInPath(returnTo = "/app") { return `/api/auth/github/start?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`; }
