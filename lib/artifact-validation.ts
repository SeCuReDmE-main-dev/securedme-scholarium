export const MAXIMUM_DIRECT_ARTIFACT_BYTES = 25 * 1024 * 1024;
const MAXIMUM_MULTIPART_REQUEST_BYTES = MAXIMUM_DIRECT_ARTIFACT_BYTES + 1024 * 1024;

type ArtifactRule = { mimeTypes: readonly string[]; signature: "pdf" | "text" | "video-mp4" | "video-webm" | "zip" };

const rulesByExtension: Record<string, ArtifactRule> = {
  ".csv": { mimeTypes: ["application/csv", "text/csv", "text/plain"], signature: "text" },
  ".docx": { mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], signature: "zip" },
  ".epub": { mimeTypes: ["application/epub+zip", "application/zip"], signature: "zip" },
  ".md": { mimeTypes: ["text/markdown", "text/plain"], signature: "text" },
  ".mov": { mimeTypes: ["video/quicktime"], signature: "video-mp4" },
  ".mp4": { mimeTypes: ["video/mp4"], signature: "video-mp4" },
  ".odp": { mimeTypes: ["application/vnd.oasis.opendocument.presentation"], signature: "zip" },
  ".ods": { mimeTypes: ["application/vnd.oasis.opendocument.spreadsheet"], signature: "zip" },
  ".odt": { mimeTypes: ["application/vnd.oasis.opendocument.text"], signature: "zip" },
  ".pdf": { mimeTypes: ["application/pdf"], signature: "pdf" },
  ".ppt": { mimeTypes: ["application/vnd.ms-powerpoint"], signature: "zip" },
  ".pptx": { mimeTypes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], signature: "zip" },
  ".txt": { mimeTypes: ["text/plain"], signature: "text" },
  ".webm": { mimeTypes: ["video/webm"], signature: "video-webm" },
  ".xls": { mimeTypes: ["application/vnd.ms-excel"], signature: "zip" },
  ".xlsx": { mimeTypes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], signature: "zip" },
  ".zip": { mimeTypes: ["application/zip"], signature: "zip" },
};

const activeTextMarker = /<\/?(?:script|iframe|object|embed|svg|html|body)\b|<!doctype|<\?xml/i;

export type ArtifactValidation =
  | { ok: true; safeName: string }
  | { error: string; ok: false; status: 400 | 413 | 415 };

export function requestExceedsArtifactLimit(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  return Number.isFinite(contentLength) && contentLength > MAXIMUM_MULTIPART_REQUEST_BYTES;
}

function extensionOf(name: string) {
  const normalized = name.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index > 0 ? normalized.slice(index) : "";
}

function startsWith(bytes: Uint8Array, values: number[]) {
  return values.every((value, index) => bytes[index] === value);
}

function hasMp4FileType(bytes: Uint8Array) {
  return bytes.length >= 8 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
}

function hasZipSignature(bytes: Uint8Array) {
  return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) || startsWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
}

async function hasExpectedSignature(file: File, kind: ArtifactRule["signature"]) {
  const sample = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (kind === "pdf") return startsWith(sample, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (kind === "zip") return hasZipSignature(sample);
  if (kind === "video-mp4") return hasMp4FileType(sample);
  if (kind === "video-webm") return startsWith(sample, [0x1a, 0x45, 0xdf, 0xa3]);

  if (sample.includes(0)) return false;
  const text = new TextDecoder("utf-8", { fatal: false }).decode(sample);
  return !activeTextMarker.test(text);
}

/**
 * Validate the declared type, filename, byte limit, and a small content
 * signature before an artifact reaches R2. This is a pre-storage safety gate;
 * malware scanning and deep document inspection remain asynchronous gates.
 */
export async function validateArtifactFile(file: File): Promise<ArtifactValidation> {
  if (!file.name || file.name.length > 180) return { error: "A valid artifact filename is required", ok: false, status: 400 };
  if (file.size === 0) return { error: "Empty files cannot be published as artifacts", ok: false, status: 400 };
  if (file.size > MAXIMUM_DIRECT_ARTIFACT_BYTES) return { error: "This upload is too large for direct processing. Use the resumable media path.", ok: false, status: 413 };

  const extension = extensionOf(file.name);
  const rule = rulesByExtension[extension];
  if (!rule || !rule.mimeTypes.includes(file.type)) return { error: "This file type is not accepted", ok: false, status: 415 };
  if (!(await hasExpectedSignature(file, rule.signature))) return { error: "The file content does not match its declared artifact type", ok: false, status: 415 };

  return { ok: true, safeName: file.name.replace(/[^a-zA-Z0-9._-]/g, "_") };
}
