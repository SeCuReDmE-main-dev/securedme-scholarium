import { containsForbiddenField, safeTrace, sanitizeHeroBookState, WEBMCP_SCHEMA, type ToolMode } from "./contracts";

type ToolDescriptor = {
  name: string;
  mode: ToolMode;
  availability: "available" | "planned" | "disabled" | "forbidden";
  unavailableReason?: string;
  inputSchema: Record<string, unknown>;
  handler: { kind: "local" | "http" | "unavailable"; operation?: string; method?: "GET" | "POST"; path?: string };
};

type RuntimeContext = { authenticated: boolean; provider: string | null; heroBookState?: unknown };
type SchemaNode = { type?: string; const?: unknown; enum?: unknown[]; minLength?: number; maxLength?: number; minimum?: number; maximum?: number; maxItems?: number; additionalProperties?: boolean; required?: string[]; properties?: Record<string, SchemaNode>; items?: SchemaNode };

const MAX_RESPONSE_BYTES = 256_000;
const REQUEST_TIMEOUT_MS = 8_000;

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function inputErrors(schema: SchemaNode, value: unknown, path = "input"): string[] {
  const errors: string[] = [];
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path} must match the declared constant`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) errors.push(`${path} is outside the allowed values`);
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [...errors, `${path} must be an object`];
    const record = value as Record<string, unknown>;
    const properties = schema.properties ?? {};
    for (const field of schema.required ?? []) if (!(field in record)) errors.push(`${path}.${field} is required`);
    if (schema.additionalProperties === false) for (const field of Object.keys(record)) if (!(field in properties)) errors.push(`${path}.${field} is not allowed`);
    for (const [field, nested] of Object.entries(record)) if (properties[field]) errors.push(...inputErrors(properties[field], nested, `${path}.${field}`));
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return [...errors, `${path} must be an array`];
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.items) value.forEach((item, index) => errors.push(...inputErrors(schema.items, item, `${path}[${index}]`)));
  } else if (schema.type === "string") {
    if (typeof value !== "string") return [...errors, `${path} must be a string`];
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} is too long`);
  } else if (schema.type === "integer") {
    if (!Number.isInteger(value)) return [...errors, `${path} must be an integer`];
    if (schema.minimum !== undefined && (value as number) < schema.minimum) errors.push(`${path} is below the minimum`);
    if (schema.maximum !== undefined && (value as number) > schema.maximum) errors.push(`${path} is above the maximum`);
  }
  return errors;
}

function envelope(tool: ToolDescriptor, status: string, data: unknown = null, error: { code: string; message: string } | null = null) {
  return {
    schema: WEBMCP_SCHEMA,
    ok: !error,
    status,
    data,
    error,
    receipt: { schema: "securedme.webmcp.receipt.v1", tool: tool.name, mode: tool.mode, stateChanged: false },
    trace: safeTrace(tool.name, tool.mode, status),
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("response_too_large");
  try { return JSON.parse(text) as unknown; } catch { throw new Error("invalid_json_response"); }
}

async function boundedFetch(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, { ...init, credentials: "same-origin", headers: { "accept": "application/json", ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers }, signal: controller.signal });
    const data = await readJson(response);
    if (!response.ok) return { ok: false as const, status: response.status, data };
    return { ok: true as const, status: response.status, data };
  } finally { window.clearTimeout(timer); }
}

function localResult(tool: ToolDescriptor, input: Record<string, unknown>, context: RuntimeContext) {
  switch (tool.handler.operation) {
    case "inspect_companion_context":
      return envelope(tool, "completed", {
        product: "scholarium",
        session: { authenticated: context.authenticated, providerClass: context.provider ? "provider_webauth" : null, identityIncluded: false },
        heroBook: sanitizeHeroBookState(context.heroBookState),
        boundaries: { heroProgressionOwner: "algoquest", externalWriteRequiresApproval: true },
      });
    case "stage_qbit_return":
      return envelope(tool, "staged", {
        status: "staged",
        canonicalStateOwner: "algoquest",
        plan: {
          missionRef: cleanText(input.missionRef, 160), specialist: cleanText(input.specialist, 64),
          returnChannel: cleanText(input.returnChannel, 160), artifactPointer: cleanText(input.artifactPointer, 240) || null,
          expectedRevision: Number.isInteger(input.revision) ? input.revision : null,
          modifiesProgression: false, admitsEvidence: false, nextStep: "Review and submit this pointer in the AlgoQuest-owned return channel.",
        },
      });
    case "stage_publication":
      return envelope(tool, "staged", { proposal: { title: cleanText(input.title, 240), abstract: cleanText(input.abstract, 12_000), type: cleanText(input.type, 64), topicSlugs: Array.isArray(input.topicSlugs) ? input.topicSlugs.map((item) => cleanText(item, 64)).filter(Boolean).slice(0, 12) : [] }, published: false, nextStep: "Review the exact draft in Scholarium before any authenticated submission." });
    case "stage_tool_connection":
      return envelope(tool, "staged", { proposal: { provider: cleanText(input.provider, 64), purpose: cleanText(input.purpose, 240), credentialsIncluded: false, consentRecorded: false }, nextStep: "Review requested scopes in the Scholarium profile connection surface." });
    case "stage_webauth_handoff":
      return envelope(tool, "staged", { proposal: { provider: input.provider, purpose: cleanText(input.purpose, 240), contextKind: cleanText(input.contextKind, 64) || "none", contextReference: cleanText(input.contextReference, 240) || null, rawPromptIncluded: false, credentialsIncluded: false }, nextStep: "Record explicit provider consent in Scholarium, then continue in the provider-owned WebAuth surface." });
    default:
      return envelope(tool, "unavailable", null, { code: "handler_unavailable", message: "No local handler is available for this tool." });
  }
}

export async function executeScholariumTool(tool: ToolDescriptor, rawInput: unknown, context: RuntimeContext) {
  const input = rawInput && typeof rawInput === "object" && !Array.isArray(rawInput) ? rawInput as Record<string, unknown> : {};
  if (containsForbiddenField(input)) return envelope(tool, "rejected", null, { code: "forbidden_field", message: "Secret, identity, raw prompt, answer or audio fields are not accepted." });
  const validationErrors = inputErrors(tool.inputSchema as SchemaNode, input);
  if (validationErrors.length) return envelope(tool, "rejected", { validationErrors: validationErrors.slice(0, 12) }, { code: "invalid_input", message: "The input does not match the closed tool schema." });
  if (tool.availability !== "available" || tool.handler.kind === "unavailable") return envelope(tool, "unavailable", { reason: tool.unavailableReason ?? "Capability is not available." });
  if (tool.handler.kind === "local") return localResult(tool, input, context);
  try {
    let path = tool.handler.path!;
    let init: RequestInit | undefined;
    if (tool.name === "scholarium_search_publications") path += `?q=${encodeURIComponent(cleanText(input.query, 160))}&limit=${Math.min(20, Math.max(1, Number(input.limit) || 10))}`;
    if (tool.name === "scholarium_inspect_publication") path += "?mode=chronological";
    if (tool.name === "scholarium_inspect_provenance") path += `?publicationId=${encodeURIComponent(cleanText(input.publicationId, 160))}&version=${Math.max(1, Number(input.version) || 1)}`;
    if (tool.handler.method === "POST") init = { method: "POST", body: JSON.stringify(input) };
    const result = await boundedFetch(path, init);
    if (!result.ok) return envelope(tool, "failed", result.data, { code: `http_${result.status}`, message: "The Scholarium service returned an explicit error." });
    if (tool.name === "scholarium_inspect_publication") {
      const publications = (result.data as { publications?: Array<{ id?: string }> })?.publications ?? [];
      const publication = publications.find((item) => item.id === input.publicationId) ?? null;
      return publication ? envelope(tool, "completed", { publication }) : envelope(tool, "not_found", null, { code: "not_found", message: "The public publication was not found." });
    }
    return envelope(tool, tool.mode === "STAGE" ? "staged" : "completed", result.data);
  } catch (error) {
    const code = error instanceof DOMException && error.name === "AbortError" ? "timeout" : error instanceof Error ? error.message : "request_failed";
    return envelope(tool, "failed", null, { code, message: "The bounded Scholarium handler failed without claiming success." });
  }
}
