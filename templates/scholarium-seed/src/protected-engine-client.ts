import { CertifiedDiscoveryResponse, ExplicitViewerSignals, SEED_DISCOVERY_CONTRACT, SeedCandidate, isCertifiedDiscoveryResponse } from "./discovery-contract";

type EngineConfiguration = { audience: string; endpoint: string; enginePublicKey: string; requestKey: string; seedId: string };

function utf8(value: string) { return new TextEncoder().encode(value); }

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hmacSha256(message: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", utf8(secret), { hash: "SHA-256", name: "HMAC" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, utf8(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

/** Verify a signed engine claim before displaying the certified-engine mark. */
async function verifyEngineAttestation(response: CertifiedDiscoveryResponse, publicKey: string) {
  try {
    const claim = JSON.parse(new TextDecoder().decode(decodeBase64Url(response.attestation.signedPayload))) as { algorithmVersion?: unknown; contractVersion?: unknown; expiresAt?: unknown; policyDigest?: unknown; resultIds?: unknown };
    if (claim.algorithmVersion !== response.algorithmVersion || claim.contractVersion !== SEED_DISCOVERY_CONTRACT || claim.expiresAt !== response.attestation.expiresAt || claim.policyDigest !== response.attestation.policyDigest || !Array.isArray(claim.resultIds) || claim.resultIds.join("|") !== response.results.map((result) => result.id).join("|")) return false;
    if (Date.parse(response.attestation.expiresAt) <= Date.now()) return false;
    const key = await crypto.subtle.importKey("raw", decodeBase64Url(publicKey), { name: "Ed25519" }, false, ["verify"]);
    return crypto.subtle.verify({ name: "Ed25519" }, key, decodeBase64Url(response.attestation.signature), utf8(response.attestation.signedPayload));
  } catch {
    return false;
  }
}

/** Call from a seed server only: never send its request key to browser code. */
export async function requestCertifiedDiscovery(configuration: EngineConfiguration, candidates: SeedCandidate[], signals: ExplicitViewerSignals): Promise<CertifiedDiscoveryResponse> {
  const body = JSON.stringify({ candidates, contractVersion: SEED_DISCOVERY_CONTRACT, signals });
  const timestamp = new Date().toISOString();
  const signature = await hmacSha256(`${configuration.seedId}.${configuration.audience}.${timestamp}.${body}`, configuration.requestKey);
  const response = await fetch(`${configuration.endpoint.replace(/\/$/u, "")}/v1/discovery`, {
    body,
    headers: { "content-type": "application/json", "x-seed-audience": configuration.audience, "x-seed-id": configuration.seedId, "x-seed-signature": signature, "x-seed-timestamp": timestamp },
    method: "POST",
  });
  if (!response.ok) throw new Error("Certified discovery engine is unavailable; keep chronological discovery active.");
  const payload: unknown = await response.json();
  if (!isCertifiedDiscoveryResponse(payload)) throw new Error("Certified discovery engine returned an invalid contract.");
  if (!(await verifyEngineAttestation(payload, configuration.enginePublicKey))) throw new Error("Certified discovery attestation is invalid or expired; keep chronological discovery active.");
  return payload;
}
