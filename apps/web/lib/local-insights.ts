export const localInsightContract = {
  default: "off",
  storage: "device_local_only",
  allowedSignals: ["formalization_guides_created", "publication_drafts_started"],
  excludedSignals: ["publication_text", "file_contents", "profile_fields", "contacts", "location", "provider_tokens"],
  telemetryBoundary: "Local OpenTelemetry receives bounded platform reliability counters only. Personal containers, publications, cases and learner behaviour stay private.",
} as const;
