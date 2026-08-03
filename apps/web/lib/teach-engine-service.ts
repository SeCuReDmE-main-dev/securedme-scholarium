import { and, eq } from "drizzle-orm";
import { teachEngineAttempts, teachEngineOutbox, teachEngineReceipts, teachEngineSessions } from "../db/schema";
import { initialCheckpoint, syllabicEngine, type AttemptEnvelope, type CheckpointProjection } from "./teach-engine-contracts";
import { requestEngineDecision } from "./teach-engine-client";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

async function digest(value: unknown) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stableJson(value)));
  return `sha256:${[...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function openEngineSession(db: ScholariumDb, userId: string) {
  const [existing] = await db.select().from(teachEngineSessions).where(and(eq(teachEngineSessions.userId, userId), eq(teachEngineSessions.blockId, syllabicEngine.blockId), eq(teachEngineSessions.blockVersion, syllabicEngine.blockVersion))).limit(1);
  if (existing) return { ...existing, checkpoint: JSON.parse(existing.checkpointJson) as CheckpointProjection };
  const id = crypto.randomUUID();
  const checkpoint = initialCheckpoint(id);
  const checkpointJson = stableJson(checkpoint);
  const checkpointDigest = await digest(checkpoint);
  await db.insert(teachEngineSessions).values({ id, userId, blockId: syllabicEngine.blockId, blockVersion: syllabicEngine.blockVersion, blockDigest: syllabicEngine.blockDigest, policyDigest: syllabicEngine.policyDigest, checkpointJson, checkpointDigest });
  return { id, userId, checkpoint, checkpointDigest, blockId: syllabicEngine.blockId, blockVersion: syllabicEngine.blockVersion };
}

export async function submitEngineAttempt(db: ScholariumDb, userId: string, raw: Record<string, unknown>) {
  const session = await openEngineSession(db, userId);
  const idempotencyKey = typeof raw.idempotencyKey === "string" ? raw.idempotencyKey.slice(0, 180) : "";
  if (!idempotencyKey) throw new Error("An idempotency key is required.");
  const boundedInput = {
    nodeId: session.checkpoint.current_node_id,
    answer: typeof raw.answer === "string" ? raw.answer.slice(0, 600) : "",
    assistance: ["none", "hint", "first_segment", "segmented", "full_model"].includes(String(raw.assistance)) ? raw.assistance as AttemptEnvelope["assistance"] : "full_model",
    recallDelaySeconds: Number.isInteger(raw.recallDelaySeconds) ? Math.max(0, Math.min(31_536_000, Number(raw.recallDelaySeconds))) : 0,
    recompositionDemonstrated: raw.recompositionDemonstrated === true,
    transferDemonstrated: raw.transferDemonstrated === true,
    readingMasteryDemonstrated: raw.readingMasteryDemonstrated === true,
    responseTimeMs: Number.isInteger(raw.responseTimeMs) ? Math.max(0, Math.min(3_600_000, Number(raw.responseTimeMs))) : 0,
    checkpointDigest: session.checkpointDigest,
  };
  const requestDigest = await digest(boundedInput);
  const [duplicate] = await db.select().from(teachEngineAttempts).where(and(eq(teachEngineAttempts.sessionId, session.id), eq(teachEngineAttempts.idempotencyKey, idempotencyKey))).limit(1);
  if (duplicate) {
    if (duplicate.requestDigest !== requestDigest) throw new Error("Idempotency key reused with different content.");
    const [stored] = await db.select().from(teachEngineReceipts).where(eq(teachEngineReceipts.attemptId, duplicate.id)).limit(1);
    if (!stored) throw new Error("Idempotent attempt receipt is unavailable.");
    return { receipt: JSON.parse(stored.receiptJson), replayed: true };
  }
  const checkpoint = session.checkpoint;
  const envelope: AttemptEnvelope = {
    schema_id: "scholarium.teach.attempt.v1",
    request_id: crypto.randomUUID(), idempotency_key: idempotencyKey,
    node_id: boundedInput.nodeId,
    answer: boundedInput.answer,
    assistance: boundedInput.assistance,
    occurred_at: new Date().toISOString(),
    recall_delay_seconds: boundedInput.recallDelaySeconds,
    recomposition_demonstrated: boundedInput.recompositionDemonstrated,
    transfer_demonstrated: boundedInput.transferDemonstrated,
    reading_mastery_demonstrated: boundedInput.readingMasteryDemonstrated,
    response_time_ms: boundedInput.responseTimeMs,
    checkpoint,
  };
  const receipt = await requestEngineDecision(envelope);
  if (receipt.previous_checkpoint_digest !== session.checkpointDigest) throw new Error("Engine receipt does not extend the canonical D1 checkpoint.");
  const attemptId = crypto.randomUUID();
  const receiptId = crypto.randomUUID();
  const nextCheckpointJson = stableJson(receipt.next_checkpoint);
  const nextCheckpointDigest = await digest(receipt.next_checkpoint);
  const receiptJson = stableJson(receipt);
  const now = new Date().toISOString();
  const telemetry = { event_type: "decision", block_id: syllabicEngine.blockId, block_version: syllabicEngine.blockVersion, decision_digest: receipt.decision_digest, contains_identity: false, contains_raw_answer: false, contains_audio: false };
  try {
    await db.batch([
    // The D1 trigger rejects the complete batch if another writer advanced the
    // checkpoint after this request was evaluated by Python.
    db.insert(teachEngineAttempts).values({ id: attemptId, sessionId: session.id, userId, idempotencyKey, requestDigest, expectedCheckpointDigest: session.checkpointDigest, nodeId: envelope.node_id, receiptId }),
    db.insert(teachEngineReceipts).values({ id: receiptId, sessionId: session.id, attemptId, receiptJson, receiptDigest: receipt.decision_digest, previousCheckpointDigest: receipt.previous_checkpoint_digest, nextCheckpointDigest }),
    db.update(teachEngineSessions).set({ checkpointJson: nextCheckpointJson, checkpointDigest: nextCheckpointDigest, updatedAt: now }).where(and(eq(teachEngineSessions.id, session.id), eq(teachEngineSessions.checkpointDigest, session.checkpointDigest))),
    db.insert(teachEngineOutbox).values({ id: crypto.randomUUID(), sessionId: session.id, eventType: "decision", payloadJson: stableJson(telemetry), payloadDigest: await digest(telemetry), destination: "timescale" }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to commit canonical progression.";
    if (message.includes("teach_engine_checkpoint_conflict")) throw new Error("Teach engine checkpoint conflict. Refresh the lesson before retrying.");
    throw error;
  }
  return { receipt, replayed: false };
}

export async function readEngineProgress(db: ScholariumDb, userId: string) {
  const session = await openEngineSession(db, userId);
  return { sessionId: session.id, checkpoint: session.checkpoint, canonicalAuthority: "D1", packPinned: `${syllabicEngine.blockId}@${syllabicEngine.blockVersion}` };
}
