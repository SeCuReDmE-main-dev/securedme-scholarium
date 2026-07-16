import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { teachMediaPublicationConfirmations, teachMediaRequests } from "../../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { mediaPublicationConfirmationContract } from "../../../../../lib/teach-media-contracts";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const contract = mediaPublicationConfirmationContract(await request.json());
    if (!contract.userConfirmed) return Response.json({ error: "External publication requires a separate explicit confirmation." }, { status: 400 });
    const db = await getDb();
    const [mediaRequest] = await db.select({ id: teachMediaRequests.id }).from(teachMediaRequests).where(and(
      eq(teachMediaRequests.id, contract.requestId),
      eq(teachMediaRequests.userId, identity.userId),
    )).limit(1);
    if (!mediaRequest) return Response.json({ error: "The media request was not found for this account." }, { status: 404 });
    const confirmation = {
      id: crypto.randomUUID(),
      userId: identity.userId,
      mediaRequestId: mediaRequest.id,
      destination: contract.destination,
      artifactDigest: contract.artifactDigest,
      status: contract.status,
      confirmedAt: new Date().toISOString(),
    };
    await db.insert(teachMediaPublicationConfirmations).values(confirmation).onConflictDoNothing();
    return Response.json({ confirmation: { ...contract, confirmationId: confirmation.id }, published: false }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to confirm media publication." }, { status: 400 });
  }
}
