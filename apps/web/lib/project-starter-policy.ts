import { canonicalRepositoryLink } from "./repository-link";

export const projectStarterPolicy = {
  defaultTargetProvider: "github",
  defaultTargetVisibility: "private",
  requiredFiles: ["LICENSE", "NOTICE", "SCHOLARIUM_PROVENANCE.json"],
  safeguards: [
    "Provider OAuth or GitHub App installation is required before any repository is created.",
    "The source maintainer repository is never written to by Scholarium.",
    "Only license-reviewed source content can be copied by a future worker.",
    "The upstream URL, source provider, and provenance manifest are mandatory.",
  ],
} as const;

export type ProjectStarterInput = {
  publicationId?: unknown;
  sourceRepositoryUrl?: unknown;
  targetRepositoryName?: unknown;
};

export function normalizeProjectStarterInput(input: ProjectStarterInput) {
  const publicationId = typeof input.publicationId === "string" && input.publicationId.length >= 8 ? input.publicationId : null;
  const source = canonicalRepositoryLink(input.sourceRepositoryUrl);
  const targetRepositoryName = typeof input.targetRepositoryName === "string" ? sanitizeRepositoryName(input.targetRepositoryName) : null;
  return { publicationId, source, targetRepositoryName };
}

export function targetNameFromRepositoryPath(repositoryPath: string) {
  return sanitizeRepositoryName(`${repositoryPath.split("/").pop() ?? "scholarium"}-scholarium`) ?? "scholarium-project";
}

function sanitizeRepositoryName(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 80);
  return normalized.length >= 3 && !normalized.includes("..") ? normalized : null;
}
