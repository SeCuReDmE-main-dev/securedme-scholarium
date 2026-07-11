import { getChatGPTUser } from "../app/chatgpt-auth";

export type PlatformIdentity = { displayName: string; email: string; userId: string };

export async function getPlatformIdentity(): Promise<PlatformIdentity | null> {
  const user = await getChatGPTUser();
  if (!user) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.email.trim().toLowerCase()));
  const userId = `siwc_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 40)}`;
  return { displayName: user.displayName, email: user.email.trim().toLowerCase(), userId };
}

export function signInRequired() {
  return Response.json({ error: "Sign in with ChatGPT is required for account-bound actions." }, { status: 401 });
}
