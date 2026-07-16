import { mediaDailyLimits } from "./teach-contracts.ts";

export const teachMediaSourceKinds = ["lesson", "thread", "project", "growth_story"] as const;
export type TeachMediaSourceKind = (typeof teachMediaSourceKinds)[number];
export type TeachMediaKind = keyof typeof mediaDailyLimits;

type ProviderLimitInput = { dailyCount?: unknown; maximumMinutes?: unknown; source?: unknown };
type SourceInput = {
  context?: unknown;
  evidenceRefs?: unknown;
  kind?: unknown;
  reflection?: unknown;
  ref?: unknown;
  sourceIds?: unknown;
  title?: unknown;
};

export type TeachMediaGenerationInput = {
  durationMinutes?: unknown;
  kind?: unknown;
  providerLimit?: ProviderLimitInput;
  source?: SourceInput;
  userTriggered?: unknown;
};

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function boundedList(value: unknown, maximumItems: number, maximumLength: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => boundedText(item, maximumLength)).filter(Boolean))].slice(0, maximumItems);
}

function boundedPositiveInteger(value: unknown, fallback: number, maximum: number) {
  return Number.isInteger(value) && Number(value) > 0 ? Math.min(maximum, Number(value)) : fallback;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function bytesFromHex(value: string) {
  if (!/^[a-f0-9]+$/u.test(value) || value.length % 2 !== 0) return new Uint8Array();
  return Uint8Array.from(value.match(/.{2}/gu) ?? [], (pair) => Number.parseInt(pair, 16));
}

async function hmacKey(secret: string, usages: KeyUsage[]) {
  if (secret.length < 32) throw new Error("Media manifest signing requires a dedicated secret of at least 32 characters.");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { hash: "SHA-256", name: "HMAC" }, false, usages);
}

async function hmacHex(value: string, secret: string) {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret, ["sign"]), new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function effectiveTeachMediaLimit(kind: TeachMediaKind, input: ProviderLimitInput = {}) {
  const scholarium = mediaDailyLimits[kind];
  const providerCount = boundedPositiveInteger(input.dailyCount, scholarium.dailyCount, scholarium.dailyCount);
  const providerMinutes = boundedPositiveInteger(input.maximumMinutes, scholarium.maximumMinutes, scholarium.maximumMinutes);
  const providerConfirmed = typeof input.source === "string" && input.source.trim().length > 0
    && Number.isInteger(input.dailyCount) && Number.isInteger(input.maximumMinutes);
  return {
    dailyCount: Math.min(scholarium.dailyCount, providerCount),
    maximumMinutes: Math.min(scholarium.maximumMinutes, providerMinutes),
    policy: "minimum_of_scholarium_and_provider",
    source: providerConfirmed ? boundedText(input.source, 120) : "scholarium_conservative_fallback",
    providerConfirmed,
    clientMayIncreaseLimit: false,
  } as const;
}

export async function sourceBoundMediaDraft(input: TeachMediaGenerationInput) {
  const kind: TeachMediaKind = input.kind === "podcast" ? "podcast" : "video";
  const sourceInput = input.source ?? {};
  const sourceKind = teachMediaSourceKinds.includes(sourceInput.kind as TeachMediaSourceKind)
    ? sourceInput.kind as TeachMediaSourceKind
    : null;
  const source = {
    kind: sourceKind,
    ref: boundedText(sourceInput.ref, 300),
    title: boundedText(sourceInput.title, 240),
    context: boundedText(sourceInput.context, 4_000),
    reflection: boundedText(sourceInput.reflection, 2_000),
    evidenceRefs: boundedList(sourceInput.evidenceRefs, 20, 500),
    sourceIds: boundedList(sourceInput.sourceIds, 30, 180),
  };
  const limit = effectiveTeachMediaLimit(kind, input.providerLimit);
  const durationMinutes = boundedPositiveInteger(input.durationMinutes, limit.maximumMinutes, limit.maximumMinutes);
  if (input.userTriggered !== true) throw new Error("Teach media generation requires an explicit user action.");
  if (!source.kind || !source.ref || !source.title || !source.context) throw new Error("A typed lesson, thread, project, or growth-story source with title and context is required.");
  if (!source.evidenceRefs.length || !source.sourceIds.length) throw new Error("At least one evidence reference and one provenance source id are required.");

  const evidenceLines = source.evidenceRefs.map((reference, index) => `Evidence ${index + 1}: ${reference}`);
  const reflection = source.reflection || "No learner reflection was supplied; keep this section open for review.";
  const sections = [
    { id: "opening", purpose: "Name the selected source and its context.", text: `${source.title}. ${source.context}` },
    { id: "evidence", purpose: "Present only the selected proof references.", text: evidenceLines.join(" ") },
    { id: "reflection", purpose: "Keep interpretation separate from evidence.", text: reflection },
    { id: "closing", purpose: "Invite the next learning action without claiming mastery.", text: "Review the evidence, correct anything inaccurate, and choose the next learning action." },
  ];
  const narration = sections.map((section) => section.text).join("\n\n");
  const scriptDigest = await sha256Hex(canonicalJson({ kind, source, sections }));
  return {
    schema: "scholarium.source-bound-media-draft.v1",
    kind,
    durationMinutes,
    limit,
    source,
    script: {
      format: kind === "video" ? "short_evidence_story" : "evidence_podcast",
      sections,
      narration,
      digest: `sha256:${scriptDigest}`,
      sourceBound: true,
      generatedClaimsAllowed: false,
      humanReviewRequired: true,
    },
    status: "ready_for_signed_manifest",
    publicationBoundary: "Rendering and external publication require separate confirmations.",
  } as const;
}

export type SignedMediaJobManifest = Awaited<ReturnType<typeof createSignedMediaJobManifest>>;

export async function createSignedMediaJobManifest(input: {
  draft: Awaited<ReturnType<typeof sourceBoundMediaDraft>>;
  providerProjectManifestPath?: string;
  requestId: string;
  secret: string;
  userId: string;
  now?: Date;
  ttlSeconds?: number;
}) {
  const now = input.now ?? new Date();
  const ttlSeconds = boundedPositiveInteger(input.ttlSeconds, 600, 900);
  if (ttlSeconds < 60) throw new Error("Media job manifests must live for at least 60 seconds.");
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1_000).toISOString();
  const userPseudonym = `sha256:${await sha256Hex(input.userId)}`;
  const unsigned = {
    schema: "scholarium.quantech-media-job.v1",
    jobId: crypto.randomUUID(),
    requestId: boundedText(input.requestId, 180),
    nonce: crypto.randomUUID(),
    issuedAt,
    expiresAt,
    userPseudonym,
    provider: {
      name: "QuaNTecH-ViD",
      endpoint: "http://127.0.0.1:7476",
      projectManifestPath: boundedText(input.providerProjectManifestPath, 1_000) || null,
      loopbackOnly: true,
    },
    media: {
      kind: input.draft.kind,
      durationMinutes: input.draft.durationMinutes,
      source: input.draft.source,
      script: input.draft.script,
    },
    accessPolicy: input.draft.limit,
    confirmations: {
      generationConfirmed: true,
      providerDispatchConfirmed: false,
      externalPublicationConfirmed: false,
    },
  };
  if (!unsigned.requestId) throw new Error("A request id is required before signing a media job manifest.");
  const signature = `hmac-sha256:${await hmacHex(canonicalJson(unsigned), input.secret)}`;
  return { ...unsigned, signature };
}

export async function verifySignedMediaJobManifest(manifest: SignedMediaJobManifest, secret: string, now = new Date()) {
  if (manifest.schema !== "scholarium.quantech-media-job.v1") return { valid: false, reason: "schema_mismatch" } as const;
  if (manifest.provider.endpoint !== "http://127.0.0.1:7476" || !manifest.provider.loopbackOnly) return { valid: false, reason: "provider_not_loopback" } as const;
  const expiresAt = Date.parse(manifest.expiresAt);
  const issuedAt = Date.parse(manifest.issuedAt);
  if (!Number.isFinite(expiresAt) || !Number.isFinite(issuedAt) || expiresAt <= now.getTime() || expiresAt - issuedAt > 900_000) return { valid: false, reason: "expired_or_invalid_lifetime" } as const;
  const { signature, ...unsigned } = manifest;
  const signatureHex = signature.startsWith("hmac-sha256:") ? signature.slice("hmac-sha256:".length) : "";
  const verified = signatureHex.length === 64 && await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret, ["verify"]),
    bytesFromHex(signatureHex),
    new TextEncoder().encode(canonicalJson(unsigned)),
  );
  return verified ? { valid: true, reason: "verified" } as const : { valid: false, reason: "signature_mismatch" } as const;
}

export function mediaPublicationConfirmationContract(input: {
  artifactDigest?: unknown;
  destination?: unknown;
  requestId?: unknown;
  userConfirmed?: unknown;
}) {
  const requestId = boundedText(input.requestId, 180);
  const destination = boundedText(input.destination, 120);
  const artifactDigest = boundedText(input.artifactDigest, 100);
  if (!requestId || !destination || !/^sha256:[a-f0-9]{64}$/u.test(artifactDigest)) throw new Error("Request, destination, and a SHA-256 artifact digest are required.");
  return {
    schema: "scholarium.media-publication-confirmation.v1",
    requestId,
    destination,
    artifactDigest,
    userConfirmed: input.userConfirmed === true,
    status: input.userConfirmed === true ? "confirmed" : "rejected",
    providerDispatchAuthorized: false,
    publicationAuthorized: input.userConfirmed === true,
    boundary: "This receipt authorizes only the named artifact and destination; it does not publish by itself.",
  } as const;
}
