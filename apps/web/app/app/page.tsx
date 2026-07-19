import type { Metadata } from "next";
import { chatGPTSignInPath, chatGPTSignOutPath } from "../chatgpt-auth";
import { ScholariumClient } from "../scholarium-client";
import { githubSignInPath } from "../../lib/github-oauth";
import { googleSignInPath } from "../../lib/google-oauth";
import { paypalSignInPath } from "../../lib/paypal-oauth";
import { getPlatformIdentity } from "../../lib/platform-identity";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scholarium — Turn knowledge into traceable evidence",
  description: "A scientific and educational workspace for publishing work with context, attribution, provenance, and human review.",
  alternates: {
    canonical: "/app",
    languages: { "fr-CA": "/app?lang=fr-CA", "en-CA": "/app?lang=en-CA", es: "/app?lang=es", "x-default": "/app" },
  },
};

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
