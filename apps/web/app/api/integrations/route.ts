import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { integrationConnections, users } from "../../../db/schema";
import { getIntegration, integrationCatalog } from "../../../lib/integration-catalog";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type ConnectionInput = { provider?: unknown };

export function GET() {
  return Response.json({ integrations: integrationCatalog });
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as ConnectionInput;
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    if (typeof input.provider !== "string") {
      return Response.json({ error: "provider is required" }, { status: 400 });
    }
    const integration = getIntegration(input.provider);
    if (!integration) return Response.json({ error: "Unsupported integration" }, { status: 400 });

    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "User account was not found" }, { status: 404 });

    const updatedAt = new Date().toISOString();
    await db.insert(integrationConnections).values({
      id: crypto.randomUUID(),
      provider: integration.id,
      scopes: JSON.stringify(integration.scopes),
      status: "pending_consent",
      updatedAt,
      userId: user.id,
    }).onConflictDoUpdate({
      target: [integrationConnections.userId, integrationConnections.provider],
      set: { scopes: JSON.stringify(integration.scopes), status: "pending_consent", tokenVaultRef: null, updatedAt },
    });

    return Response.json({
      connection: { provider: integration.id, status: "pending_consent" },
      nextStep: "Redirect to the provider only after the user explicitly confirms the requested scope.",
    }, { status: 202 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to prepare integration" }, { status: 500 });
  }
}
