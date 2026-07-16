const digestPattern = /^sha256:[a-f0-9]{64}$/u;
const forbiddenGeometryKeys = /kdf|aad|key|secret|vault|password|cookie|token|cipher|credential/iu;
const allowedLocationKeys = new Set(["schema", "basisId", "algorithmVersion", "dimension", "normalization", "sourceNodeIds", "vector", "norm", "projectionDigest", "uncertainty", "authority"]);

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function assertStrictLocation(location: Record<string, unknown>) {
  for (const key of Object.keys(location)) {
    if (forbiddenGeometryKeys.test(key)) throw new Error(`Geometry cannot receive cryptographic material: ${key}.`);
    if (!allowedLocationKeys.has(key)) throw new Error(`Unknown Hilbert-location field: ${key}.`);
  }
  if (location.schema !== "scholarium.hilbert-location.v1") throw new Error("A versioned Hilbert location is required.");
  if (!Array.isArray(location.vector) || !location.vector.length || location.vector.length > 20_000) throw new Error("Hilbert vector length is outside the structural-address contract.");
  if (location.vector.some((value) => typeof value !== "number" || !Number.isFinite(value))) throw new Error("Hilbert vectors must contain finite numbers only.");
  if (location.dimension !== location.vector.length) throw new Error("Hilbert vector dimension mismatch.");
  if (typeof location.projectionDigest !== "string" || !digestPattern.test(location.projectionDigest)) throw new Error("Hilbert projection digest is invalid.");
  if (!Array.isArray(location.sourceNodeIds) || location.sourceNodeIds.some((value) => typeof value !== "string")) throw new Error("Hilbert source ordering is required.");
}

export async function computeQuasicrystalStructuralAddress(input: {
  ephemeralReceiptDigest?: string;
  hilbertLocation: Record<string, unknown>;
}) {
  assertStrictLocation(input.hilbertLocation);
  if (input.ephemeralReceiptDigest !== undefined && !digestPattern.test(input.ephemeralReceiptDigest)) throw new Error("Only a valid ephemeral receipt digest may bind to a structural address.");
  const vector = input.hilbertLocation.vector as number[];
  const latticeScale = 1_000_000;
  const parallel: number[] = [];
  const internal: number[] = [];
  for (let axis = 0; axis < 5; axis += 1) {
    let real = 0;
    let imaginary = 0;
    vector.forEach((value, index) => {
      const angle = (2 * Math.PI * axis * (index % 5)) / 5;
      real += value * Math.cos(angle);
      imaginary += value * Math.sin(angle);
    });
    const normalization = Math.sqrt(vector.length);
    parallel.push(Math.round((real / normalization) * latticeScale));
    internal.push(Math.round((imaginary / normalization) * latticeScale));
  }
  const acceptanceRadius = Math.round(Math.sqrt(internal.reduce((sum, value) => sum + value * value, 0)));
  const structural = {
    schema: "scholarium.quasicrystal-structural-address.v1",
    algorithmVersion: "fivefold-cut-project-locator.v1",
    basisId: input.hilbertLocation.basisId,
    sourceProjectionDigest: input.hilbertLocation.projectionDigest,
    sourceOrderingDigest: `sha256:${await sha256Hex(canonicalJson(input.hilbertLocation.sourceNodeIds))}`,
    latticeCoordinates: parallel,
    internalWindowCoordinates: internal,
    acceptanceRadius,
    cell: `qc5:${parallel.join(":")}:${acceptanceRadius}`,
    ephemeralReceiptDigest: input.ephemeralReceiptDigest ?? null,
    authority: "deterministic_structural_locator_only",
    cryptographicUse: "forbidden",
    prohibitedBindings: ["KDF", "AAD", "key material", "vault material", "authentication secret"],
  } as const;
  return {
    ...structural,
    projectionFingerprint: `sha256:${await sha256Hex(canonicalJson(structural))}`,
  };
}

export function validateEphemeralReceiptForMemoryAdmission(receipt: Record<string, unknown>) {
  const allowedKeys = new Set(["schema", "requestId", "policyVersion", "openedAt", "completedAt", "expiresAt", "destruction", "auditDigest", "status"]);
  for (const key of Object.keys(receipt)) {
    if (forbiddenGeometryKeys.test(key) || /audio|video|voice|transcript|feature|student|email|name/iu.test(key)) throw new Error(`Ephemeral receipt contains forbidden content: ${key}.`);
    if (!allowedKeys.has(key)) throw new Error(`Unknown ephemeral receipt field: ${key}.`);
  }
  if (receipt.schema !== "scholarium.ephemeral-processing-receipt.v1") throw new Error("Unsupported ephemeral receipt schema.");
  if (receipt.status !== "complete") return { admitted: false, reason: "destruction_not_complete" } as const;
  if (typeof receipt.auditDigest !== "string" || !digestPattern.test(receipt.auditDigest)) return { admitted: false, reason: "invalid_audit_digest" } as const;
  const destruction = receipt.destruction as Record<string, unknown> | undefined;
  if (!destruction || destruction.temporaryFilesPurged !== true || destruction.memoryCleared !== true || destruction.keyRevoked !== true) return { admitted: false, reason: "incomplete_purge" } as const;
  if (!Array.isArray(destruction.residualArtifacts) || destruction.residualArtifacts.length !== 0) return { admitted: false, reason: "residual_artifacts" } as const;
  for (const key of ["workerDestructionDigest", "keyRevocationDigest"]) {
    if (typeof destruction[key] !== "string" || !digestPattern.test(destruction[key] as string)) return { admitted: false, reason: `invalid_${key}` } as const;
  }
  return { admitted: true, reason: "bounded_receipt_only", receiptDigest: receipt.auditDigest } as const;
}
