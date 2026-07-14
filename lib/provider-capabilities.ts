import { getIntegration } from "./integration-catalog";

/**
 * Provider capabilities are declarative product contracts, not stored tokens
 * or an assertion that a third-party connection is currently active.
 */
export const providerCapabilities = [
  {
    id: "codex_openai",
    label: "Codex / OpenAI",
    capabilityClass: "provider_web_auth",
    capabilities: ["review_handoff", "writing_assistance"],
    requiresExplicitConsent: true,
    supportsExternalWrite: false,
    authorityBoundary: "Provider output is review support. It does not certify research, authorship, safety, or scientific truth.",
  },
  {
    id: "antigravity_gemini",
    label: "Antigravity / Gemini",
    capabilityClass: "provider_web_auth",
    capabilities: ["review_handoff", "writing_assistance"],
    requiresExplicitConsent: true,
    supportsExternalWrite: false,
    authorityBoundary: "Provider output is review support. It does not certify research, authorship, safety, or scientific truth.",
  },
  {
    id: "google_drive",
    label: "Google Drive",
    capabilityClass: "delegated_connection",
    capabilities: ["user_selected_file_access", "archive_export"],
    requiresExplicitConsent: true,
    supportsExternalWrite: true,
    authorityBoundary: "Only files selected through a provider-approved flow may be used. Scholarium does not infer access from Google sign-in.",
  },
  {
    id: "youtube",
    label: "YouTube",
    capabilityClass: "delegated_connection",
    capabilities: ["channel_reference", "export_preparation", "webhook_trace"],
    requiresExplicitConsent: true,
    supportsExternalWrite: true,
    authorityBoundary: "Scholarium stores links and minimal delivery traces, not a copied video library.",
  },
  {
    id: "github",
    label: "GitHub",
    capabilityClass: "delegated_connection",
    capabilities: ["repository_attribution", "private_project_preparation"],
    requiresExplicitConsent: true,
    supportsExternalWrite: true,
    authorityBoundary: "Maintainer repositories are never written by Scholarium. A private project still requires provider approval.",
  },
] as const;

export type ProviderCapabilityId = (typeof providerCapabilities)[number]["id"];

export function getProviderCapability(provider: string) {
  const capability = providerCapabilities.find((item) => item.id === provider);
  if (!capability) return null;
  const integration = getIntegration(provider);
  return { ...capability, scopes: integration?.scopes ?? [] };
}

export function isOfficialWebAuthProvider(provider: string): provider is "codex_openai" | "antigravity_gemini" {
  return provider === "codex_openai" || provider === "antigravity_gemini";
}
