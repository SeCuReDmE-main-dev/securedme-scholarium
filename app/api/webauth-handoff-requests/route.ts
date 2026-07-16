import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { providerConsents, users, webauthHandoffRequests } from "../../../db/schema";
import { isOfficialWebAuthProvider } from "../../../lib/provider-capabilities";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type HandoffInput = { contextKind?: unknown; contextReference?: unknown; provider?: unknown; purpose?: unknown };

function shortText(value: unknown, field: string, maximum: number, optional = false) {
  if (value === undefined && optional) return null;
  if (typeof value !== "string" || !value.trim() || value.trim().length > maximum) throw new Error(`${field} is required and must be at most ${maximum} characters`);
  return value.trim();
}

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const requests = await current.db.select({ contextKind: webauthHandoffRequests.contextKind, contextReference: webauthHandoffRequests.contextReference, createdAt: webauthHandoffRequests.createdAt, id: webauthHandoffRequests.id, provider: webauthHandoffRequests.provider, purpose: webauthHandoffRequests.purpose, status: webauthHandoffRequests.status, updatedAt: webauthHandoffRequests.updatedAt }).from(webauthHandoffRequests).where(eq(webauthHandoffRequests.userId, current.user.id)).orderBy(desc(webauthHandoffRequests.createdAt)).limit(50);
    return Response.json({ requests, boundary: "Requests are records of user-approved provider handoffs. They contain no raw prompt, provider token, or provider session." }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load WebAuth handoff requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as HandoffInput;
    if (typeof input.provider !== "string" || !isOfficialWebAuthProvider(input.provider)) return Response.json({ error: "Only the official Codex / OpenAI and Antigravity / Gemini WebAuth routes are available" }, { status: 400 });
    const purpose = shortText(input.purpose, "purpose", 240);
    const contextKind = shortText(input.contextKind ?? "none", "contextKind", 64);
    const contextReference = shortText(input.contextReference, "contextReference", 240, true);
    const [consent] = await current.db.select({ id: providerConsents.id }).from(providerConsents).where(and(eq(providerConsents.userId, current.user.id), eq(providerConsents.provider, input.provider), eq(providerConsents.status, "granted"))).limit(1);
    if (!consent) return Response.json({ error: "Record explicit provider consent before preparing a WebAuth handoff" }, { status: 409 });
    const now = new Date().toISOString();
    const record = { contextKind, contextReference, createdAt: now, id: crypto.randomUUID(), provider: input.provider, purpose, status: "provider_auth_required", updatedAt: now, userId: current.user.id };
    await current.db.insert(webauthHandoffRequests).values(record);
    return Response.json({
      request: { ...record, userId: undefined },
      nextStep: "Continue in the provider-owned WebAuth surface. Scholarium does not receive or store the provider credential.",
    }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare WebAuth handoff";
    return Response.json({ error: message }, { status: /required|official/.test(message) ? 400 : 500 });
  }
}
