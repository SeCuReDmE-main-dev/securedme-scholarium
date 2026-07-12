import { getChatGPTUser } from "../app/chatgpt-auth";
import { getProviderSession } from "./google-oauth";

export type PlatformIdentity = { displayName: string; email: string; provider: "chatgpt" | "google" | "github" | "paypal"; userId: string };

async function stableProviderUserId(provider: PlatformIdentity["provider"], subject: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${provider}:${subject}`));
  return `oauth_${provider}_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
}

export async function getPlatformIdentity(): Promise<PlatformIdentity | null> {
  const user = await getChatGPTUser();
  if (user) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.email.trim().toLowerCase()));
    const userId = `siwc_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
    return { displayName: user.displayName, email: user.email.trim().toLowerCase(), provider: "chatgpt", userId };
  }

  const providerSession = await getProviderSession();
  if (!providerSession) return null;
  // A provider + subject is the account key. Matching email addresses are never auto-merged.
  return {
    displayName: providerSession.displayName,
    email: providerSession.email.trim().toLowerCase(),
    provider: providerSession.provider,
    userId: await stableProviderUserId(providerSession.provider, providerSession.subject),
  };
}

export function signInRequired() {
  return Response.json({ error: "Sign in with a supported identity provider is required for account-bound actions." }, { status: 401 });
}
