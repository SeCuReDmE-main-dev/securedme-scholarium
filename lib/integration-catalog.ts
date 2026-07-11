export const integrationCatalog = [
  {
    id: "orcid",
    name: "ORCID",
    purpose: "Verify a researcher identifier and read public record metadata.",
    scopes: ["/authenticate", "openid"],
    writesExternalRecord: false,
  },
  {
    id: "github",
    name: "GitHub",
    purpose: "Import or start an attributed project using user-selected repositories.",
    scopes: ["metadata:read", "contents:read", "contents:write"],
    writesExternalRecord: true,
  },
  {
    id: "zenodo",
    name: "Zenodo",
    purpose: "Prepare a user-confirmed research deposit and DOI workflow.",
    scopes: ["deposit:write", "deposit:actions"],
    writesExternalRecord: true,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    purpose: "Archive inactive heavy artifacts to the user-controlled Drive folder.",
    scopes: ["drive.file"],
    writesExternalRecord: true,
  },
  {
    id: "quanthor",
    name: "QuaNthoR",
    purpose: "Prepare a formalization plan and send an author-approved Mizar draft to a separately verified proof workflow.",
    scopes: [],
    writesExternalRecord: false,
  },
  {
    id: "synthia",
    name: "Synthia",
    purpose: "Offer bounded writing, reflection, and media-planning support with human review.",
    scopes: [],
    writesExternalRecord: false,
  },
  {
    id: "securedme_blog",
    name: "SecuredMe Blog",
    purpose: "Prepare a user-confirmed profile or publication feature; no article is created without final approval.",
    scopes: ["blog.draft:create"],
    writesExternalRecord: true,
  },
  {
    id: "codex_openai",
    name: "Codex / OpenAI",
    purpose: "Use the provider’s own WebAuth session for an optional classroom review handoff; Scholarium never receives a raw provider token.",
    scopes: ["provider.web_auth"],
    writesExternalRecord: false,
  },
  {
    id: "antigravity_gemini",
    name: "Antigravity / Gemini",
    purpose: "Use the provider’s own WebAuth session for an optional classroom review handoff; Scholarium never receives a raw provider token.",
    scopes: ["provider.web_auth"],
    writesExternalRecord: false,
  },
  {
    id: "life_science_research",
    name: "Life-science research",
    purpose: "Prepare an official-source lookup request for a protocol or publication; results remain citations to review, not scientific or clinical advice.",
    scopes: ["official_source_lookup"],
    writesExternalRecord: false,
  },
  {
    id: "privacy_monitor",
    name: "Privacy monitor",
    purpose: "Keep optional activity insights on the device. Datadog is reserved for platform reliability metadata and never receives publication text, profile content, or per-user containers.",
    scopes: ["device_local_only"],
    writesExternalRecord: false,
  },
] as const;

export type IntegrationId = (typeof integrationCatalog)[number]["id"];

export function getIntegration(id: string) {
  return integrationCatalog.find((integration) => integration.id === id);
}
