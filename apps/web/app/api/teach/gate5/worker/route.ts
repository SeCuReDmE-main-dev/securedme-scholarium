import { and, asc, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { teachGate5Jobs } from "../../../../../db/schema";
import { gate5AdapterRegistry, verifyBouncyCastleGate5Receipt, type Gate5AdapterId } from "../../../../../lib/teach-gate5-contracts";

async function expectedWorkerToken() {
  const { env } = await import("cloudflare:workers");
  const value = env.SCHOLARIUM_GATE5_WORKER_TOKEN as string | undefined;
  return typeof value === "string" && value.length >= 32 ? value : null;
}

async function receiptPublicKey() {
  const { env } = await import("cloudflare:workers");
  const value = env.SCHOLARIUM_BC_ED25519_PUBLIC_KEY_B64 as string | undefined;
  return typeof value === "string" && value.length >= 40 ? value : null;
}

async function sameSecret(left: string, right: string) {
  const encode = (value: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const [leftDigest, rightDigest] = await Promise.all([encode(left), encode(right)]);
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

async function authorized(request: Request) {
  const expected = await expectedWorkerToken();
  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  return Boolean(expected && supplied && await sameSecret(supplied, expected));
}

export async function GET(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Private Gate5 worker authentication required." }, { status: 401 });
  const target = new URL(request.url).searchParams.get("target") as Gate5AdapterId | null;
  if (!target || !(target in gate5AdapterRegistry)) return Response.json({ error: "A registered adapter target is required." }, { status: 400 });
  const rows = await (await getDb()).select({
    envelope: teachGate5Jobs.envelope,
    id: teachGate5Jobs.id,
    requestDigest: teachGate5Jobs.requestDigest,
  }).from(teachGate5Jobs).where(and(
    eq(teachGate5Jobs.target, target), eq(teachGate5Jobs.status, "pending"), gt(teachGate5Jobs.expiresAt, new Date().toISOString()),
  )).orderBy(asc(teachGate5Jobs.createdAt)).limit(20);
  return Response.json({
    schema: "scholarium.gate5-worker-batch.v1",
    target,
    jobs: rows.map((row) => ({ id: row.id, requestDigest: row.requestDigest, envelope: JSON.parse(row.envelope) })),
  }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!await authorized(request)) return Response.json({ error: "Private Gate5 worker authentication required." }, { status: 401 });
  const input = await request.json() as Record<string, unknown>;
  const id = typeof input.jobId === "string" ? input.jobId : "";
  const status = input.status === "completed" || input.status === "failed" || input.status === "quarantined" ? input.status : null;
  const receiptDigest = typeof input.receiptDigest === "string" && /^sha256:[a-f0-9]{64}$/u.test(input.receiptDigest) ? input.receiptDigest : "";
  const signatureB64 = typeof input.signatureB64 === "string" ? input.signatureB64 : "";
  if (!id || !status || !receiptDigest || !signatureB64) return Response.json({ error: "A job, terminal status, receipt digest, and signature are required." }, { status: 400 });
  const db = await getDb();
  const [job] = await db.select({ id: teachGate5Jobs.id, requestDigest: teachGate5Jobs.requestDigest, status: teachGate5Jobs.status, target: teachGate5Jobs.target }).from(teachGate5Jobs).where(eq(teachGate5Jobs.id, id)).limit(1);
  if (!job) return Response.json({ error: "Unknown Gate5 job." }, { status: 404 });
  if (job.status !== "pending") return Response.json({ error: "Gate5 job already has a terminal receipt." }, { status: 409 });
  const publicKeyB64 = await receiptPublicKey();
  if (!publicKeyB64) return Response.json({ error: "The transitional Bouncy Castle receipt verifier is not configured." }, { status: 503 });
  const verification = await verifyBouncyCastleGate5Receipt({
    context: `gate5:${job.target}`,
    jobId: job.id,
    publicKeyB64,
    receiptDigest,
    requestDigest: job.requestDigest,
    signatureB64,
    status,
  });
  if (!verification.valid) return Response.json({ error: "The Gate5 terminal receipt signature is invalid.", reason: verification.reason }, { status: 400 });
  const updated = await db.update(teachGate5Jobs).set({
    status,
    receiptDigest,
    receiptSignature: signatureB64,
    receiptKeyFingerprint: verification.publicKeyFingerprint,
    completedAt: new Date().toISOString(),
  }).where(and(eq(teachGate5Jobs.id, id), eq(teachGate5Jobs.status, "pending"))).returning({ id: teachGate5Jobs.id });
  if (!updated.length) return Response.json({ error: "Gate5 job was completed concurrently." }, { status: 409 });
  return Response.json({ receipt: {
    schema: "scholarium.gate5-worker-receipt.v1", jobId: id, status, receiptDigest,
    signature: { algorithm: "Ed25519", provider: "BouncyCastle.Cryptography/2.6.2", publicKeyFingerprint: verification.publicKeyFingerprint, verified: true },
  } }, { headers: { "cache-control": "private, no-store" } });
}
