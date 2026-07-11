import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { ScholariumClient } from "../scholarium-client";
import { githubSignInPath } from "../../lib/github-oauth";
import { googleSignInPath } from "../../lib/google-oauth";
import { paypalSignInPath } from "../../lib/paypal-oauth";
import { getPlatformIdentity } from "../../lib/platform-identity";

export const dynamic = "force-dynamic";

export default async function ScholariumApp() {
  const identity = await getPlatformIdentity();
  return <ScholariumClient session={{
    displayName: identity?.displayName ?? null,
    provider: identity?.provider ?? null,
    signInPath: chatGPTSignInPath("/app"),
    googleSignInPath: googleSignInPath("/app"),
    githubSignInPath: githubSignInPath("/app"),
    paypalSignInPath: paypalSignInPath("/app"),
    signOutPath: identity?.provider === "chatgpt" ? chatGPTSignOutPath("/app") : "/api/auth/signout?return_to=%2Fapp",
  }} />;
}
