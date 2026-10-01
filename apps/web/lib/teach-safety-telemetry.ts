// Bounded OTLP/HTTP JSON counters. Case management remains in the product DB.
// No SDK auto-instrumentation, personal attributes or external credentials.
export type SchoolSafetyTelemetryConfig = {
  casesEnabled: boolean;
  enabled: boolean;
  endpoint: string | null;
  environment: "development" | "test" | "prealpha" | "production";
};
export type SchoolSafetyTechnicalMetric = {
  schema: "scholarium.school-safety-technical-metric.v1";
  operation: "create" | "transition" | "appeal";
  environment: SchoolSafetyTelemetryConfig["environment"];
};

async function runtimeValue(name: string) {
  try {
    const { env } = await import("cloudflare:workers");
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" ? value.trim() : null;
  } catch { return null; }
}

export function localMetricsEndpoint(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!['127.0.0.1', '[::1]'].includes(url.hostname)
      || !['http:', 'https:'].includes(url.protocol) || url.port !== '4318'
      || url.pathname !== '/v1/metrics' || url.username || url.password || url.search || url.hash) return null;
    return url.href;
  } catch { return null; }
}

export async function schoolSafetyRuntimeConfig(): Promise<SchoolSafetyTelemetryConfig> {
  const [cases, enabled, endpoint, environment] = await Promise.all([
    runtimeValue("SCHOLARIUM_SAFETY_CASES_ENABLED"),
    runtimeValue("SCHOLARIUM_OTEL_ENABLED"),
    runtimeValue("SCHOLARIUM_OTEL_METRICS_ENDPOINT"),
    runtimeValue("SCHOLARIUM_ENVIRONMENT"),
  ]);
  return { casesEnabled: cases === "true", enabled: enabled === "true", endpoint: localMetricsEndpoint(endpoint),
    environment: ['development', 'test', 'prealpha', 'production'].includes(environment ?? '')
      ? environment as SchoolSafetyTelemetryConfig['environment'] : 'prealpha' };
}

export async function assertSchoolSafetyCasesEnabled() {
  const config = await schoolSafetyRuntimeConfig();
  if (!config.casesEnabled) throw new Error("SCHOOL_SAFETY_CASES_DISABLED");
  return config;
}

export function schoolSafetyTechnicalMetric(operation: string, environment: string): SchoolSafetyTechnicalMetric {
  if (!['create', 'transition', 'appeal'].includes(operation)) throw new Error('OTEL_METRIC_INVALID');
  return { schema: "scholarium.school-safety-technical-metric.v1", operation: operation as SchoolSafetyTechnicalMetric['operation'],
    environment: ['development', 'test', 'prealpha', 'production'].includes(environment)
      ? environment as SchoolSafetyTelemetryConfig['environment'] : 'prealpha' };
}

export function validSchoolSafetyMetric(value: unknown): value is SchoolSafetyTechnicalMetric {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 3 && record.schema === 'scholarium.school-safety-technical-metric.v1'
    && ['create', 'transition', 'appeal'].includes(String(record.operation))
    && ['development', 'test', 'prealpha', 'production'].includes(String(record.environment));
}

export function schoolSafetyOtlpBody(payload: SchoolSafetyTechnicalMetric, now = Date.now()) {
  if (!validSchoolSafetyMetric(payload)) throw new Error('OTEL_METRIC_INVALID');
  const timeUnixNano = String(BigInt(now) * BigInt(1_000_000));
  return { resourceMetrics: [{ resource: { attributes: [
    { key: 'service.name', value: { stringValue: 'securedme-scholarium' } },
    { key: 'deployment.environment.name', value: { stringValue: payload.environment } },
  ] }, scopeMetrics: [{ scope: { name: 'securedme.school-safety', version: '1.0.0' }, metrics: [{
    name: 'securedme.school_safety.operations', description: 'Technical operations; no case or learner attributes.', unit: '{operation}',
    sum: { aggregationTemporality: 1, isMonotonic: true, dataPoints: [{
      attributes: [{ key: 'operation', value: { stringValue: payload.operation } }],
      startTimeUnixNano: String(BigInt(timeUnixNano) - BigInt(1)), timeUnixNano, asInt: '1',
    }] },
  }] }] }] };
}

export async function deliverSchoolSafetyMetric(config: SchoolSafetyTelemetryConfig, payload: SchoolSafetyTechnicalMetric, transport: typeof fetch = fetch) {
  if (!config.enabled) return { status: 'disabled' as const };
  const endpoint = localMetricsEndpoint(config.endpoint);
  if (!endpoint) throw new Error('OTEL_LOCAL_ENDPOINT_REQUIRED');
  const response = await transport(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(schoolSafetyOtlpBody(payload)), redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(2_000) });
  if (!response.ok) throw new Error(`OTEL_HTTP_${response.status}`);
  // OTLP partial success is not a full delivery. Bound the diagnostic read and
  // expose an opaque code only, never collector error text.
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > 8_192) throw new Error('OTEL_RESPONSE_INVALID');
  const result = text ? JSON.parse(text) as { partialSuccess?: { rejectedDataPoints?: string | number } } : {};
  if (Number(result.partialSuccess?.rejectedDataPoints ?? 0) > 0) throw new Error('OTEL_PARTIAL_SUCCESS');
  return { status: 'sent' as const };
}
