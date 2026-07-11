export const localInsightContract = {
  default: "off",
  storage: "device_local_only",
  allowedSignals: ["formalization_guides_created", "publication_drafts_started"],
  excludedSignals: ["publication_text", "file_contents", "profile_fields", "contacts", "location", "provider_tokens"],
  datadogBoundary: "Datadog may receive platform-level reliability metadata only. It never receives a per-user container, publication content, or personal behavior record.",
} as const;
