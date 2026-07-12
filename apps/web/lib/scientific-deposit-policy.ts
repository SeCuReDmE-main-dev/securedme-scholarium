const supportedDepositProviders = new Set(["zenodo"]);
const supportedLicenses = new Set(["cc-by-4.0", "cc0-1.0", "mit", "gpl-3.0", "all-rights-reserved"]);

export const scientificDepositPolicy = {
  provider: "zenodo",
  status: "draft_only_until_oauth_and_confirmation",
  stores: ["provider", "publication link", "title", "license", "metadata summary", "status"],
  excludes: ["Zenodo OAuth token", "repository password", "file bytes", "reserved DOI", "published DOI claim"],
  confirmation: "A DOI reservation or repository publication must require authenticated provider consent plus a separate irreversible confirmation.",
  preservation: "Scholarium preserves selected metadata, license, coauthor notes, and source relationships so the author can review before any external deposit.",
  boundary: "This contract prepares a deposit request only. It does not call Zenodo, reserve a DOI, publish a record, or assert legal ownership.",
} as const;

export function normalizeDepositProvider(value: unknown) {
  return typeof value === "string" && supportedDepositProviders.has(value) ? value : "zenodo";
}

export function normalizeDepositTitle(value: unknown) {
  const title = String(value ?? "").trim().slice(0, 180);
  return title.length >= 6 ? title : null;
}

export function normalizeDepositLicense(value: unknown) {
  const license = String(value ?? "cc-by-4.0").trim().toLowerCase();
  return supportedLicenses.has(license) ? license : "cc-by-4.0";
}

export function normalizeDepositMetadata(input: { coauthors?: unknown; doiNote?: unknown; references?: unknown }) {
  return JSON.stringify({
    coauthors: String(input.coauthors ?? "").trim().slice(0, 1_000),
    doiNote: String(input.doiNote ?? "").trim().slice(0, 1_000),
    references: String(input.references ?? "").trim().slice(0, 2_000),
  });
}
