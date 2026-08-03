export const syllabicEngine = {
  blockId: "castellano-latam-neutral",
  blockVersion: "1.0.0",
  blockDigest: "sha256:d95b28a584aa13f608eaed1262a7e6d6f24ae573163cf98855a1fe761ff8b26d",
  policyDigest: "sha256:55a5f4181b4fd9e8a6e7a9540e4c1647838ef48c257869546f0d6d70276f8745",
  nodeIds: ["syllable-ma-series", "sound-ma-series", "composition-mama", "reading-mama", "writing-mama"],
} as const;

export const syllabicCards = [
  { nodeId: "syllable-ma-series", kind: "syllable", prompt: "Lee la sílaba indicada", target: "ma", syllables: ["ma", "mi", "mu", "mo", "me"], audioRef: "audio/es-419/ma.v1.wav", pictureAsAnswer: false },
  { nodeId: "sound-ma-series", kind: "sound", prompt: "Escucha y reconoce", target: "ma", syllables: ["ma", "mi", "mu", "mo", "me"], audioRef: "audio/es-419/ma.v1.wav", pictureAsAnswer: false },
  { nodeId: "composition-mama", kind: "composition", prompt: "Combina ma + ma", target: "mama", syllables: ["ma", "ma"], audioRef: null, pictureAsAnswer: false },
  { nodeId: "reading-mama", kind: "reading", prompt: "Lee sin modelo", target: "mama", syllables: ["ma", "ma"], audioRef: "audio/es-419/mama.v1.wav", pictureAsAnswer: false },
  { nodeId: "writing-mama", kind: "writing", prompt: "Escribe la palabra que ya puedes leer", target: "mama", syllables: ["ma", "ma"], audioRef: null, pictureAsAnswer: false },
] as const;

export type MasteryState = "new" | "guided" | "recalled" | "contextualized" | "mastered" | "review";
export type DecisionKind = "advance" | "review" | "hold" | "abstain" | "human_review";

export type NodeProgress = { state: MasteryState; attempts: number; evidence: string[] };
export type CheckpointProjection = {
  schema_id: "scholarium.teach.checkpoint.v1";
  session_id: string;
  block_id: string;
  block_version: string;
  block_digest: string;
  policy_digest: string;
  current_node_id: string;
  sequence: number;
  progress: Record<string, NodeProgress>;
};

export type AttemptEnvelope = {
  schema_id: "scholarium.teach.attempt.v1";
  request_id: string;
  idempotency_key: string;
  node_id: string;
  answer: string;
  assistance: "none" | "hint" | "first_segment" | "segmented" | "full_model";
  occurred_at: string;
  recall_delay_seconds: number;
  recomposition_demonstrated: boolean;
  transfer_demonstrated: boolean;
  reading_mastery_demonstrated: boolean;
  response_time_ms: number;
  checkpoint: CheckpointProjection;
};

export type DecisionReceipt = {
  schema_id: "scholarium.teach.decision-receipt.v1";
  request_id: string;
  idempotency_key: string;
  decision: DecisionKind;
  previous_checkpoint_digest: string;
  attempt_digest: string;
  block_digest: string;
  policy_digest: string;
  evidence: { answer_matches: boolean; evidence: string[]; missing: string[]; assistance: string; diagnostic: false };
  next_checkpoint: CheckpointProjection;
  next_review_at: string | null;
  decision_digest: string;
};

export function initialCheckpoint(sessionId: string): CheckpointProjection {
  return {
    schema_id: "scholarium.teach.checkpoint.v1",
    session_id: sessionId,
    block_id: syllabicEngine.blockId,
    block_version: syllabicEngine.blockVersion,
    block_digest: syllabicEngine.blockDigest,
    policy_digest: syllabicEngine.policyDigest,
    current_node_id: syllabicEngine.nodeIds[0],
    sequence: 0,
    progress: Object.fromEntries(syllabicEngine.nodeIds.map((nodeId) => [nodeId, { state: "new", attempts: 0, evidence: [] }])),
  };
}

export function assertDecisionReceipt(value: unknown): asserts value is DecisionReceipt {
  const receipt = value as Partial<DecisionReceipt> | null;
  if (!receipt || receipt.schema_id !== "scholarium.teach.decision-receipt.v1") throw new Error("Invalid engine receipt schema.");
  if (!receipt.decision_digest?.match(/^sha256:[a-f0-9]{64}$/u)) throw new Error("Invalid engine decision digest.");
  if (receipt.block_digest !== syllabicEngine.blockDigest || receipt.policy_digest !== syllabicEngine.policyDigest) throw new Error("Engine pack digest mismatch.");
  if (!receipt.next_checkpoint || receipt.next_checkpoint.sequence < 0) throw new Error("Invalid engine checkpoint.");
}
