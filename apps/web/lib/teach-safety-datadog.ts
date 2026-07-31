import type { SchoolSafetySeverity, SchoolSafetyState } from "./teach-safety-case-contracts";

export type SchoolSafetyDatadogPayload = {
  schema: "scholarium.school-safety-datadog.v1";
  caseId: string;
  tenantRef: string;
  category: string;
  proposedSeverity: SchoolSafetySeverity;
  state: SchoolSafetyState;
  createdAt: string;
  updatedAt: string;
  service: "securedme-scholarium";
  environment: string;
  policyVersion: string;
  normalizedOutcome: string | null;
};

export type SchoolSafetyDatadogConfig = {
  enabled: boolean;
  writeApproved: boolean;
  site: string | null;
  apiKey: string | null;
  appKey: string | null;
  projectId: string | null;
  typeId: string | null;
  environment: string;
};

type DatadogDeliveryInput = {
  externalCaseId?: string | null;
  payload: SchoolSafetyDatadogPayload;
  transport?: typeof fetch;
};

async function runtimeValue(name: string) {
  try {
    const { env } = await import("cloudflare:workers");
    const value = (env as unknown as Record<string, unknown>)[name];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  } catch {
    // Vinext's local production server does not expose Cloudflare bindings.
    // Missing bindings must keep both school-safety and Datadog writes closed.
    return null;
  }
}

export async function schoolSafetyRuntimeConfig(): Promise<SchoolSafetyDatadogConfig & { casesEnabled: boolean }> {
  const [casesEnabled, syncEnabled, writeApproval, site, apiKey, appKey, projectId, typeId, environment] = await Promise.all([
    runtimeValue("SCHOLARIUM_SAFETY_CASES_ENABLED"),
    runtimeValue("DATADOG_CASE_SYNC_ENABLED"),
    runtimeValue("SCHOLARIUM_SAFETY_EXTERNAL_WRITE_APPROVED"),
    runtimeValue("DD_SITE"),
    runtimeValue("DD_API_KEY"),
    runtimeValue("DD_APP_KEY"),
    runtimeValue("DD_CASE_PROJECT_ID"),
    runtimeValue("DD_CASE_TYPE_ID"),
    runtimeValue("DD_ENV"),
  ]);
  return {
    casesEnabled: casesEnabled === "true",
    enabled: syncEnabled === "true",
    writeApproved: writeApproval === "APPLY:DATADOG_CASES",
    site,
    apiKey,
    appKey,
    projectId,
    typeId,
    environment: environment ?? "prealpha",
  };
}

export async function assertSchoolSafetyCasesEnabled() {
  const config = await schoolSafetyRuntimeConfig();
  if (!config.casesEnabled) throw new Error("SCHOOL_SAFETY_CASES_DISABLED");
  return config;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function schoolSafetyDatadogPayload(input: {
  caseId: string;
  organizationId: string;
  category: string;
  proposedSeverity: SchoolSafetySeverity;
  state: SchoolSafetyState;
  createdAt: string;
  updatedAt: string;
  environment?: string;
  policyVersion: string;
  resolutionCode?: string | null;
}): Promise<SchoolSafetyDatadogPayload> {
  return {
    schema: "scholarium.school-safety-datadog.v1",
    caseId: input.caseId,
    tenantRef: `tenant_${(await sha256(input.organizationId)).slice(0, 24)}`,
    category: input.category,
    proposedSeverity: input.proposedSeverity,
    state: input.state,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    service: "securedme-scholarium",
    environment: input.environment ?? "prealpha",
    policyVersion: input.policyVersion,
    normalizedOutcome: input.resolutionCode ?? null,
  };
}

function apiOrigin(site: string) {
  const normalized = site.trim().toLowerCase().replace(/^https?:\/\//u, "").replace(/\/$/u, "");
  return normalized.startsWith("api.") ? `https://${normalized}` : `https://api.${normalized}`;
}

function datadogStatus(state: SchoolSafetyState) {
  if (state === "closed") return "CLOSED";
  if (state === "received" || state === "triaged") return "OPEN";
  return "IN_PROGRESS";
}

function datadogStatusName(state: SchoolSafetyState) {
  if (state === "closed") return "Closed";
  if (state === "received" || state === "triaged") return "Open";
  return "In Progress";
}

function priority(severity: SchoolSafetySeverity) {
  return severity === "urgent" ? "P1" : severity === "high" ? "P2" : "P3";
}

function requireLiveConfig(config: SchoolSafetyDatadogConfig) {
  if (!config.enabled || !config.writeApproved) throw new Error("DATADOG_CASE_SYNC_NOT_APPROVED");
  if (!config.site || !config.apiKey || !config.appKey || !config.projectId || !config.typeId) throw new Error("DATADOG_CASE_CONFIG_INCOMPLETE");
  return {
    origin: apiOrigin(config.site),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "DD-API-KEY": config.apiKey,
      "DD-APPLICATION-KEY": config.appKey,
    },
    projectId: config.projectId,
    typeId: config.typeId,
  };
}

async function checkedJson(response: Response) {
  if (!response.ok) throw new Error(`DATADOG_HTTP_${response.status}`);
  return await response.json().catch(() => ({})) as Record<string, unknown>;
}

function requestOptions(init: RequestInit): RequestInit {
  return { ...init, signal: AbortSignal.timeout(5_000) };
}

async function findExistingCase(
  live: ReturnType<typeof requireLiveConfig>,
  send: typeof fetch,
  title: string,
) {
  const filter = encodeURIComponent(`title:"${title}"`);
  const response = await send(`${live.origin}/api/v2/cases?page%5Bsize%5D=10&filter=${filter}`, requestOptions({
    method: "GET",
    headers: live.headers,
  }));
  const body = await checkedJson(response);
  const resources = Array.isArray(body.data) ? body.data as Array<Record<string, unknown>> : [];
  const exact = resources.find((resource) => {
    const attributes = resource.attributes as Record<string, unknown> | undefined;
    return attributes?.title === title && typeof resource.id === "string";
  });
  return typeof exact?.id === "string" ? exact.id : null;
}

export async function deliverSchoolSafetyDatadogCase(config: SchoolSafetyDatadogConfig, input: DatadogDeliveryInput) {
  const live = requireLiveConfig(config);
  const send = input.transport ?? fetch;
  let externalCaseId = input.externalCaseId ?? null;
  const title = `Scholarium school safety ${input.payload.caseId}`;

  if (!externalCaseId) {
    externalCaseId = await findExistingCase(live, send, title);
  }

  if (!externalCaseId) {
    const response = await send(`${live.origin}/api/v2/cases`, {
      ...requestOptions({}),
      method: "POST",
      headers: live.headers,
      body: JSON.stringify({
        data: {
          attributes: {
            priority: priority(input.payload.proposedSeverity),
            status_name: "Open",
            title,
            type_id: live.typeId,
          },
          relationships: { project: { data: { id: live.projectId, type: "project" } } },
          type: "case",
        },
      }),
    });
    const data = await checkedJson(response);
    const resource = data.data as { id?: unknown } | undefined;
    externalCaseId = typeof resource?.id === "string" ? resource.id : null;
    if (!externalCaseId) throw new Error("DATADOG_CASE_ID_MISSING");
  }

  const statusResponse = await send(`${live.origin}/api/v2/cases/${encodeURIComponent(externalCaseId)}/status`, requestOptions({
    method: "POST",
    headers: live.headers,
    body: JSON.stringify({ data: { attributes: {
      status: datadogStatus(input.payload.state),
      status_name: datadogStatusName(input.payload.state),
    }, type: "case" } }),
  }));
  await checkedJson(statusResponse);

  const attributeResponse = await send(`${live.origin}/api/v2/cases/${encodeURIComponent(externalCaseId)}/attributes`, requestOptions({
    method: "POST",
    headers: live.headers,
    body: JSON.stringify({
      data: {
        attributes: {
          attributes: {
            case_id: [input.payload.caseId],
            category: [input.payload.category],
            env: [input.payload.environment],
            policy_version: [input.payload.policyVersion],
            service: [input.payload.service],
            state: [input.payload.state],
            tenant_ref: [input.payload.tenantRef],
          },
        },
        type: "case",
      },
    }),
  }));
  await checkedJson(attributeResponse);
  return { externalCaseId, status: "sent" as const };
}
