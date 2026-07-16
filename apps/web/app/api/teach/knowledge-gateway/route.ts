import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachPurposeConsents } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { computeKnowledgeGatewayReceipt, type KnowledgeGraphDelta } from "../../../../lib/teach-knowledge-gateway";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as Record<string, unknown>;
    const consentReceiptId = typeof input.consentReceiptId === "string" ? input.consentReceiptId : "";
    const [consent] = await (await getDb()).select().from(teachPurposeConsents).where(and(
      eq(teachPurposeConsents.id, consentReceiptId), eq(teachPurposeConsents.userId, identity.userId), eq(teachPurposeConsents.status, "granted"),
    )).limit(1);
    if (!consent || (consent.expiresAt && Date.parse(consent.expiresAt) <= Date.now())) return Response.json({ error: "An active owned Teach consent receipt is required." }, { status: 403 });
    const tenantDigest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`teach:${identity.userId}`));
    const tenantPseudonym = `tenant_${[...new Uint8Array(tenantDigest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24)}`;
    const receipt = await computeKnowledgeGatewayReceipt({
      pluginId: String(input.pluginId ?? ""), requestId: String(input.requestId ?? ""), idempotencyKey: String(input.idempotencyKey ?? ""),
      purpose: String(input.purpose ?? ""), consentReceiptId, tenantPseudonym, graphDelta: input.graphDelta as KnowledgeGraphDelta,
    });
    return Response.json({ receipt }, { status: 202, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "A valid central gateway envelope is required." }, { status: 400 });
  }
}
