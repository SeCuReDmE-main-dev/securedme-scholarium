const supportedArchiveProviders = new Set(["google_drive", "microsoft_drive", "local_sync", "r2_cold"]);
const supportedActions = new Set(["restore", "resync"]);

export function normalizeArchiveProvider(value: unknown) {
  if (typeof value !== "string") return null;
  const provider = value.trim().toLowerCase();
  return supportedArchiveProviders.has(provider) ? provider : null;
}

export function normalizeArchiveAction(value: unknown) {
  if (typeof value !== "string") return null;
  const action = value.trim().toLowerCase();
  return supportedActions.has(action) ? action : null;
}

export function normalizeArchivePath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (path.length < 3 || path.length > 512) return null;
  if (/token|secret|password|private[_-]?key/i.test(path)) return null;
  return path;
}

export function normalizeObjectCount(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  return Math.max(0, Math.min(value, 10_000));
}

export const archiveManifestPolicy = {
  originalAvailability: "public metadata and provenance stay visible when an original file is unavailable",
  providerBoundary: "Scholarium stores no Drive token, local filesystem credential, or provider refresh secret in the manifest",
  restorationBoundary: "restore and resync are explicit owner requests; they do not delete R2 objects or bypass publication safety",
};
