import { assertDecisionReceipt, type AttemptEnvelope, type DecisionReceipt } from "./teach-engine-contracts";

let circuitOpenUntil = 0;
let consecutiveFailures = 0;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(value: ArrayBuffer) {
  const bytes = await crypto.subtle.digest("SHA-256", value);
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type EphemeralAudioObservation = {
  request_id: string;
  observation_id: string;
  status: "observed" | "abstain" | "rejected" | "purge_failed";
  can_change_mastery: false;
  purge_receipt: { input_retained: false; raw_features_retained: false; receipt_digest: string };
};

export async function requestEphemeralAudioObservation(payload: ArrayBuffer, contentType: string): Promise<EphemeralAudioObservation> {
  const normalizedContentType = contentType.split(";", 1)[0].toLowerCase();
  if (normalizedContentType !== "audio/wav" && normalizedContentType !== "audio/x-wav") throw new Error("Teach audio observer accepts WAV only.");
  if (payload.byteLength > 2_000_000) throw new Error("Teach audio payload exceeds the pre-alpha limit.");
  const { env } = await import("cloudflare:workers");
  const engineUrl = String(env.SCHOLARIUM_TEACH_ENGINE_URL ?? "").replace(/\/$/u, "");
  const secret = String(env.SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET ?? "");
  if (!engineUrl || !secret) throw new Error("Teach engine is not configured.");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const observationId = crypto.randomUUID();
  const path = "/internal/v1/audio-observations";
  const bodyDigest = await sha256Bytes(payload);
  const signature = `hmac-sha256:${await hmac(secret, `v1\nPOST\n${path}\n${timestamp}\n${nonce}\n${bodyDigest}`)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(`${engineUrl}${path}`, {
      method: "POST",
      body: payload,
      headers: {
        "content-type": normalizedContentType,
        "x-teach-timestamp": timestamp,
        "x-teach-nonce": nonce,
        "x-teach-signature": signature,
        "x-teach-request-id": requestId,
        "x-teach-observation-id": observationId,
        "x-teach-observation-purpose": "audio_quality",
        "x-teach-audio-consent": "granted",
        "x-teach-subject-kind": "consenting_adult",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Teach audio observer rejected the request (${response.status}).`);
    const value = await response.json() as EphemeralAudioObservation;
    if (value.can_change_mastery !== false || value.purge_receipt?.input_retained !== false || value.purge_receipt?.raw_features_retained !== false) throw new Error("Teach audio observer returned an unsafe contract.");
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestEngineDecision(input: AttemptEnvelope): Promise<DecisionReceipt> {
  if (Date.now() < circuitOpenUntil) throw new Error("Teach engine circuit is open.");
  const { env } = await import("cloudflare:workers");
  const engineUrl = String(env.SCHOLARIUM_TEACH_ENGINE_URL ?? "").replace(/\/$/u, "");
  const secret = String(env.SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET ?? "");
  if (!engineUrl || !secret) throw new Error("Teach engine is not configured.");
  const body = canonical(input);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const path = "/internal/v1/decisions";
  const signature = `hmac-sha256:${await hmac(secret, `v1\nPOST\n${path}\n${timestamp}\n${nonce}\n${await sha256(body)}`)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  try {
    const response = await fetch(`${engineUrl}${path}`, {
      method: "POST",
      body,
      headers: { "content-type": "application/json", "x-teach-timestamp": timestamp, "x-teach-nonce": nonce, "x-teach-signature": signature },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Teach engine rejected the decision request (${response.status}).`);
    const value: unknown = await response.json();
    assertDecisionReceipt(value);
    consecutiveFailures = 0;
    return value;
  } catch (error) {
    consecutiveFailures += 1;
    if (consecutiveFailures >= 3) circuitOpenUntil = Date.now() + 30_000;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
