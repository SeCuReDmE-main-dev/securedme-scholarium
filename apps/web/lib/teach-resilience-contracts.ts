import type { Gate5AdapterId } from "./teach-gate5-contracts";

export type ActivePrivateAdapter = Exclude<Gate5AdapterId, "tenebris">;
export type CircuitState = "closed" | "open" | "half_open";

export const gate5FailurePolicies: Record<ActivePrivateAdapter, {
  coreLearningContinues: true;
  degradedBehavior: string;
  maxRetries: number;
  retryableCodes: readonly string[];
}> = {
  synthia: {
    coreLearningContinues: true,
    degradedBehavior: "Keep the source in preparation without admitting a new classification.",
    maxRetries: 2,
    retryableCodes: ["timeout", "unavailable", "rate_limited"],
  },
  "memory-lake": {
    coreLearningContinues: true,
    degradedBehavior: "Keep the trace in the durable outbox and expose retrieval as delayed.",
    maxRetries: 4,
    retryableCodes: ["timeout", "unavailable", "locked"],
  },
  hipporag: {
    coreLearningContinues: true,
    degradedBehavior: "Return retrieval unavailable without generating an unsupported answer.",
    maxRetries: 3,
    retryableCodes: ["timeout", "unavailable", "rate_limited"],
  },
  "fnp-qnn": {
    coreLearningContinues: true,
    degradedBehavior: "Omit the experimental FNP-QNN/FfeD signal and preserve the ordinary learning path.",
    maxRetries: 2,
    retryableCodes: ["timeout", "unavailable", "plugin_busy"],
  },
  "quantech-vid": {
    coreLearningContinues: true,
    degradedBehavior: "Keep the media draft unpublished and return the next eligible retry time.",
    maxRetries: 3,
    retryableCodes: ["timeout", "unavailable", "provider_capacity"],
  },
};

export function gate5RetryDecision(input: {
  attempt: number;
  errorCode: string;
  nowMs?: number;
  target: ActivePrivateAdapter;
}) {
  if (!Number.isInteger(input.attempt) || input.attempt < 1) throw new Error("Retry attempt must be a positive integer.");
  const policy = gate5FailurePolicies[input.target];
  const retryable = policy.retryableCodes.includes(input.errorCode);
  if (!retryable || input.attempt > policy.maxRetries) {
    return {
      action: "degrade" as const,
      coreLearningContinues: true as const,
      reason: retryable ? "retry_budget_exhausted" as const : "non_retryable_failure" as const,
      behavior: policy.degradedBehavior,
    };
  }
  const delayMs = Math.min(30_000, 1_000 * (2 ** (input.attempt - 1)));
  return {
    action: "retry" as const,
    attempt: input.attempt,
    delayMs,
    nextAttemptAt: new Date((input.nowMs ?? Date.now()) + delayMs).toISOString(),
  };
}

export class Gate5CircuitBreaker {
  private readonly cooldownMs: number;
  private failureCount = 0;
  private openedAtMs: number | null = null;
  private stateValue: CircuitState = "closed";
  private readonly threshold: number;

  constructor(threshold = 3, cooldownMs = 30_000) {
    if (!Number.isInteger(threshold) || threshold < 1) throw new Error("Circuit threshold must be a positive integer.");
    if (!Number.isFinite(cooldownMs) || cooldownMs < 1) throw new Error("Circuit cooldown must be positive.");
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }

  static restore(snapshot: { cooldownMs: number; failureCount: number; openedAtMs: number | null; state: CircuitState; threshold: number }) {
    const breaker = new Gate5CircuitBreaker(snapshot.threshold, snapshot.cooldownMs);
    breaker.failureCount = snapshot.failureCount;
    breaker.openedAtMs = snapshot.openedAtMs;
    breaker.stateValue = snapshot.state;
    return breaker;
  }

  state(nowMs = Date.now()): CircuitState {
    if (this.stateValue === "open" && this.openedAtMs !== null && nowMs - this.openedAtMs >= this.cooldownMs) {
      this.stateValue = "half_open";
    }
    return this.stateValue;
  }

  admit(nowMs = Date.now()) {
    const state = this.state(nowMs);
    return state === "closed" || state === "half_open";
  }

  recordFailure(nowMs = Date.now()) {
    this.failureCount += 1;
    if (this.failureCount >= this.threshold || this.stateValue === "half_open") {
      this.stateValue = "open";
      this.openedAtMs = nowMs;
    }
    return this.stateValue;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.openedAtMs = null;
    this.stateValue = "closed";
  }

  snapshot() {
    return { cooldownMs: this.cooldownMs, failureCount: this.failureCount, openedAtMs: this.openedAtMs, state: this.stateValue, threshold: this.threshold };
  }
}

type QueueJob = {
  attempts: number;
  dueAtMs: number;
  expiresAtMs: number;
  id: string;
  idempotencyKey: string;
  status: "pending" | "completed" | "degraded";
  target: ActivePrivateAdapter;
};

export class Gate5QueueModel {
  private jobs = new Map<string, QueueJob>();
  private idempotency = new Map<string, string>();

  static restore(snapshot: QueueJob[]) {
    const queue = new Gate5QueueModel();
    for (const job of snapshot) {
      queue.jobs.set(job.id, structuredClone(job));
      queue.idempotency.set(job.idempotencyKey, job.id);
    }
    return queue;
  }

  enqueue(input: { expiresAtMs: number; id: string; idempotencyKey: string; target: ActivePrivateAdapter }, nowMs = Date.now()) {
    if (input.expiresAtMs <= nowMs) throw new Error("Queue jobs must expire in the future.");
    const existingId = this.idempotency.get(input.idempotencyKey);
    if (existingId) return { created: false, id: existingId } as const;
    const job: QueueJob = { ...input, attempts: 0, dueAtMs: nowMs, status: "pending" };
    this.jobs.set(job.id, job);
    this.idempotency.set(job.idempotencyKey, job.id);
    return { created: true, id: job.id } as const;
  }

  claim(target: ActivePrivateAdapter, nowMs = Date.now(), limit = 20) {
    const boundedLimit = Math.max(1, Math.min(20, Math.floor(limit)));
    return [...this.jobs.values()]
      .filter((job) => job.target === target && job.status === "pending" && job.dueAtMs <= nowMs && job.expiresAtMs > nowMs)
      .sort((left, right) => left.dueAtMs - right.dueAtMs || left.id.localeCompare(right.id))
      .slice(0, boundedLimit)
      .map((job) => structuredClone(job));
  }

  complete(id: string) {
    const job = this.jobs.get(id);
    if (!job || job.status !== "pending") return false;
    job.status = "completed";
    return true;
  }

  fail(id: string, errorCode: string, nowMs = Date.now()) {
    const job = this.jobs.get(id);
    if (!job || job.status !== "pending") throw new Error("Only pending jobs can fail.");
    job.attempts += 1;
    const decision = gate5RetryDecision({ attempt: job.attempts, errorCode, nowMs, target: job.target });
    if (decision.action === "retry") job.dueAtMs = Date.parse(decision.nextAttemptAt);
    else job.status = "degraded";
    return decision;
  }

  snapshot() {
    return [...this.jobs.values()].map((job) => structuredClone(job));
  }
}

export function evaluateGate5Load(multiplier: 1 | 10 | 100, input: { baselineJobs?: number; batchSize?: number; batchesPerWindow?: number } = {}) {
  const baselineJobs = input.baselineJobs ?? 20;
  const batchSize = input.batchSize ?? 20;
  const batchesPerWindow = input.batchesPerWindow ?? 10;
  const jobs = baselineJobs * multiplier;
  const windowCapacity = batchSize * batchesPerWindow;
  const backlog = Math.max(0, jobs - windowCapacity);
  return {
    multiplier,
    jobs,
    batchSize,
    batchesRequired: Math.ceil(jobs / batchSize),
    windowCapacity,
    backlog,
    state: backlog === 0 ? "within_window" as const : "backpressure_required" as const,
  };
}

export function firstGate5LoadBreakpoint() {
  return ([1, 10, 100] as const).map((multiplier) => evaluateGate5Load(multiplier)).find((result) => result.backlog > 0) ?? null;
}
