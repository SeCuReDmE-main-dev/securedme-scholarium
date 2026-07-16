export const gate5AdapterRegistry = {
  synthia: {
    capability: "classification_trace",
    requestSchema: "synthia.education-classification-request.v1",
    state: "registered",
    transport: "private_worker_outbox",
  },
  "memory-lake": {
    capability: "index_records",
    requestSchema: "scholarium.memory-lake-index-request.v1",
    state: "registered",
    transport: "private_worker_outbox",
  },
  hipporag: {
    capability: "retrieve_dpr",
    requestSchema: "synthia.hipporag-retrieval.v1",
    state: "registered_retrieval_only",
    transport: "private_worker_outbox",
  },
  "fnp-qnn": {
    capability: "evaluate_pseudonymous_carrier",
    requestSchema: "scholarium.fnp-qnn-signal-request.v1",
    state: "registered_pseudonymous_only",
    transport: "private_worker_outbox",
  },
  "quantech-vid": {
    capability: "render_confirmed_manifest",
    requestSchema: "scholarium.quantech-media-job.v1",
    state: "registered",
    transport: "private_worker_outbox",
  },
  tenebris: {
    capability: "ephemeral_processing",
    requestSchema: "scholarium.ephemeral-processing-request.v1",
    state: "research_gated",
    transport: "private_worker_outbox",
  },
} as const;

export type Gate5AdapterId = keyof typeof gate5AdapterRegistry;
export type Gate5Envelope = Awaited<ReturnType<typeof createGate5Envelope>>;

const activeAdapterIds = ["synthia", "memory-lake", "hipporag", "fnp-qnn", "quantech-vid"] as const;
const forbiddenIdentityKeys = /(^|_)(email|name|student|learner_id|user_id|phone|address|username|account|raw_text|transcript|audio|video|voice|biometric)(_|$)/iu;
const digestPattern = /^sha256:[a-f0-9]{64}$/u;
const pseudonymPattern = /^(tenant|subject)_[a-f0-9]{32}$/u;
const stableIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,179}$/u;

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

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(value: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexBytes(value: string) {
  return Uint8Array.from(value.match(/.{2}/gu) ?? [], (pair) => Number.parseInt(pair, 16));
}

async function hmacKey(secret: string, usages: KeyUsage[]) {
  if (secret.length < 32) throw new Error("Gate5 requires a dedicated secret of at least 32 characters.");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { hash: "SHA-256", name: "HMAC" }, false, usages);
}

async function hmacHex(value: string, secret: string) {
  const bytes = await crypto.subtle.sign("HMAC", await hmacKey(secret, ["sign"]), new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function stableId(value: unknown, label: string) {
  if (typeof value !== "string" || !stableIdPattern.test(value)) throw new Error(`${label} must be an opaque stable identifier.`);
  return value;
}

function boundedPurpose(value: unknown) {
  const purpose = typeof value === "string" ? value.trim().slice(0, 240) : "";
  if (!purpose) throw new Error("Gate5 requires a bounded purpose.");
  return purpose;
}

function assertFinitePayload(value: unknown, path = "payload", depth = 0): void {
  if (depth > 8) throw new Error("Gate5 payload nesting exceeds the contract limit.");
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
  if (typeof value === "string" && value.length > 2_000) throw new Error(`${path} contains an oversized string.`);
  if (Array.isArray(value)) {
    if (value.length > 128) throw new Error(`${path} contains too many items.`);
    value.forEach((item, index) => assertFinitePayload(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 64) throw new Error(`${path} contains too many fields.`);
    for (const [key, item] of entries) {
      if (forbiddenIdentityKeys.test(key)) throw new Error(`${path}.${key} is forbidden in a pseudonymous Gate5 packet.`);
      assertFinitePayload(item, `${path}.${key}`, depth + 1);
    }
  }
}

function assertDigest(value: unknown, label: string) {
  if (typeof value !== "string" || !digestPattern.test(value)) throw new Error(`${label} must be a SHA-256 content digest.`);
  return value;
}

function assertUnit(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${label} must be finite and in [0, 1].`);
  return value;
}

function validateTargetPayload(target: Gate5AdapterId, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Gate5 payload must be an object.");
  const payload = value as Record<string, unknown>;
  assertFinitePayload(payload);
  if (new TextEncoder().encode(canonicalJson(payload)).length > 32_768) throw new Error("Gate5 payload exceeds 32 KiB.");

  if (target === "fnp-qnn") {
    const carrier = payload.carrier as Record<string, unknown> | undefined;
    if (!carrier) throw new Error("FNP-QNN requests require a bounded carrier.");
    if (carrier.hierarchy !== "I -> I_system^S -> D_f -> dF -> i_fractal") throw new Error("FNP-QNN hierarchy must remain explicit and intact.");
    if (typeof carrier.D_f !== "number" || !Number.isFinite(carrier.D_f) || carrier.D_f < 0) throw new Error("D_f must be a finite non-negative carrier value.");
    assertUnit(carrier.D_f_hat, "D_f_hat");
    assertUnit(carrier.dF, "dF");
    if (carrier.i_fractal_candidate !== null && carrier.i_fractal_candidate !== undefined) assertUnit(carrier.i_fractal_candidate, "i_fractal_candidate");
    assertDigest(payload.configurationDigest, "FNP-QNN configurationDigest");
    if (payload.pluginPolicySchema !== "fnp-qnn.ffed-plugin-policy.v1") throw new Error("FNP-QNN requests require the versioned five-plugin policy.");
  }
  if (target === "hipporag") {
    if (payload.method !== "retrieve_dpr") throw new Error("HippoRAG is retrieval-only; only retrieve_dpr is allowed.");
    assertDigest(payload.queryDigest, "HippoRAG queryDigest");
  }
  if (target === "synthia" && payload.authority !== "traceability_support") throw new Error("Synthia authority must remain traceability_support.");
  if (target === "memory-lake" && payload.method !== "index_records") throw new Error("MemoryLake Gate5 calls are limited to index_records.");
  if (target === "quantech-vid") assertDigest(payload.manifestDigest, "QuaNTecH manifestDigest");
  if (target === "tenebris" && payload.mode !== "ephemeral_receipt_only") throw new Error("Tenebris accepts only ephemeral receipt operations in this research gate.");
  return structuredClone(payload);
}

export async function deriveGate5Pseudonym(kind: "tenant" | "subject", sourceId: string, secret: string) {
  const digest = await hmacHex(`scholarium-gate5:${kind}:v1:${sourceId}`, secret);
  return `${kind}_${digest.slice(0, 32)}`;
}

export async function createGate5Envelope(input: {
  consentReceiptId: string;
  expiresAt?: Date;
  idempotencyKey: string;
  issuedAt?: Date;
  nonce?: string;
  payload: unknown;
  purpose: string;
  requestId: string;
  secret: string;
  subjectId: string;
  target: Gate5AdapterId;
  tenantId: string;
}) {
  if (!(input.target in gate5AdapterRegistry)) throw new Error("Unknown Gate5 adapter target.");
  if (input.target === "tenebris" && gate5AdapterRegistry.tenebris.state !== "research_gated") throw new Error("Invalid Tenebris registry state.");
  const issuedAt = input.issuedAt ?? new Date();
  const expiresAt = input.expiresAt ?? new Date(issuedAt.getTime() + 5 * 60_000);
  if (expiresAt.getTime() <= issuedAt.getTime() || expiresAt.getTime() - issuedAt.getTime() > 15 * 60_000) throw new Error("Gate5 envelopes must expire within 15 minutes.");
  const unsigned = {
    schema: "scholarium.gate5-adapter-envelope.v1",
    registryVersion: "scholarium.gate5-adapter-registry.v1",
    requestId: stableId(input.requestId, "Request id"),
    idempotencyKey: stableId(input.idempotencyKey, "Idempotency key"),
    nonce: stableId(input.nonce ?? crypto.randomUUID(), "Nonce"),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    purpose: boundedPurpose(input.purpose),
    consentReceiptId: stableId(input.consentReceiptId, "Consent receipt id"),
    tenantPseudonym: await deriveGate5Pseudonym("tenant", input.tenantId, input.secret),
    subjectPseudonym: await deriveGate5Pseudonym("subject", input.subjectId, input.secret),
    target: input.target,
    adapter: gate5AdapterRegistry[input.target],
    payload: validateTargetPayload(input.target, input.payload),
    privacy: {
      rawIdentityIncluded: false,
      crossTenantLookupAllowed: false,
      externalAdapterReceivesUserId: false,
    },
  } as const;
  const requestDigest = `sha256:${await sha256Hex(canonicalJson(unsigned))}`;
  const signature = `hmac-sha256:${await hmacHex(canonicalJson({ ...unsigned, requestDigest }), input.secret)}`;
  return { ...unsigned, requestDigest, signature };
}

export async function verifyGate5Envelope(envelope: Gate5Envelope, secret: string, now = new Date()) {
  try {
    if (envelope.schema !== "scholarium.gate5-adapter-envelope.v1" || !(envelope.target in gate5AdapterRegistry)) return { valid: false, reason: "schema_or_target" } as const;
    if (!pseudonymPattern.test(envelope.tenantPseudonym) || !pseudonymPattern.test(envelope.subjectPseudonym)) return { valid: false, reason: "pseudonym" } as const;
    const issuedAt = Date.parse(envelope.issuedAt);
    const expiresAt = Date.parse(envelope.expiresAt);
    if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= now.getTime() || expiresAt <= issuedAt || expiresAt - issuedAt > 15 * 60_000) return { valid: false, reason: "expired_or_lifetime" } as const;
    validateTargetPayload(envelope.target, envelope.payload);
    const { signature, requestDigest, ...unsigned } = envelope;
    const expectedDigest = `sha256:${await sha256Hex(canonicalJson(unsigned))}`;
    if (requestDigest !== expectedDigest) return { valid: false, reason: "digest_mismatch" } as const;
    const signatureHex = signature.startsWith("hmac-sha256:") ? signature.slice("hmac-sha256:".length) : "";
    const validSignature = signatureHex.length === 64 && await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, ["verify"]),
      hexBytes(signatureHex),
      new TextEncoder().encode(canonicalJson({ ...unsigned, requestDigest })),
    );
    return validSignature ? { valid: true, reason: "verified" } as const : { valid: false, reason: "signature_mismatch" } as const;
  } catch {
    return { valid: false, reason: "contract_violation" } as const;
  }
}

type ReplayRecord = { expiresAt: string; requestId: string; revoked: boolean };

export class Gate5ReplayLedger {
  private records = new Map<string, ReplayRecord>();
  private revokedRequests = new Set<string>();

  static restore(snapshot: { records: Array<[string, ReplayRecord]>; revokedRequests: string[] }) {
    const ledger = new Gate5ReplayLedger();
    ledger.records = new Map(snapshot.records);
    ledger.revokedRequests = new Set(snapshot.revokedRequests);
    return ledger;
  }

  revoke(requestId: string) {
    this.revokedRequests.add(requestId);
    for (const record of this.records.values()) if (record.requestId === requestId) record.revoked = true;
  }

  snapshot() {
    return { records: [...this.records.entries()], revokedRequests: [...this.revokedRequests] };
  }

  async admit(envelope: Gate5Envelope, secret: string, now = new Date()) {
    const verification = await verifyGate5Envelope(envelope, secret, now);
    if (!verification.valid) return { admitted: false, reason: verification.reason } as const;
    if (this.revokedRequests.has(envelope.requestId)) return { admitted: false, reason: "revoked" } as const;
    const key = `${envelope.target}:${envelope.nonce}`;
    const existing = this.records.get(key);
    if (existing && Date.parse(existing.expiresAt) > now.getTime()) return { admitted: false, reason: existing.revoked ? "revoked" : "replay" } as const;
    this.records.set(key, { expiresAt: envelope.expiresAt, requestId: envelope.requestId, revoked: false });
    return { admitted: true, reason: "accepted" } as const;
  }
}

export function activeGate5Adapters() {
  return activeAdapterIds.map((id) => ({ id, ...gate5AdapterRegistry[id] }));
}

export function gate5ReceiptSigningMessage(input: {
  context: string;
  jobId: string;
  receiptDigest: string;
  requestDigest: string;
  status: "completed" | "failed" | "quarantined";
}) {
  if (!/^[a-z0-9][a-z0-9:._-]{0,119}$/u.test(input.context)) throw new Error("Invalid Gate5 receipt context.");
  stableId(input.jobId, "Gate5 job id");
  assertDigest(input.requestDigest, "Gate5 request digest");
  assertDigest(input.receiptDigest, "Gate5 receipt digest");
  return `scholarium.bc-ed25519-receipt.v1|${input.context}|${input.jobId}|${input.requestDigest}|${input.receiptDigest}|${input.status}`;
}

function base64Bytes(value: string) {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return new Uint8Array();
  }
}

export async function verifyBouncyCastleGate5Receipt(input: {
  context: string;
  jobId: string;
  publicKeyB64: string;
  receiptDigest: string;
  requestDigest: string;
  signatureB64: string;
  status: "completed" | "failed" | "quarantined";
}) {
  const publicKey = base64Bytes(input.publicKeyB64);
  const signature = base64Bytes(input.signatureB64);
  if (publicKey.length !== 32 || signature.length !== 64) return { valid: false, reason: "invalid_key_or_signature_shape" } as const;
  try {
    const message = gate5ReceiptSigningMessage(input);
    const imported = await crypto.subtle.importKey("raw", publicKey, "Ed25519", false, ["verify"]);
    const valid = await crypto.subtle.verify("Ed25519", imported, signature, new TextEncoder().encode(message));
    return {
      valid,
      reason: valid ? "verified" : "signature_mismatch",
      publicKeyFingerprint: `sha256:${await sha256Bytes(publicKey)}`,
    } as const;
  } catch {
    return { valid: false, reason: "verification_error" } as const;
  }
}
