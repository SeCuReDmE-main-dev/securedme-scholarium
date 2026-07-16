import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { growthStories, publications, publicationVersions } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { createProvenanceReceipt } from "../../../lib/provenance";
import { publicationSafetyDecision } from "../../../lib/publication-safety";
import { growthCapsuleContract } from "../../../lib/teach-social-contracts";
import { teachSchemaVersions } from "../../../lib/teach-contracts";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const stories = await (await getDb()).select().from(growthStories).where(eq(growthStories.userId, identity.userId)).orderBy(desc(growthStories.createdAt)).limit(50);
  return Response.json({ stories }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = await request.json() as Record<string, unknown>;
  const capsule = growthCapsuleContract({ ...input, serverVerifiedEvidence: false });
  if (!capsule.draftValid) return Response.json({ error: "domain, title, and reflection are required." }, { status: 400 });
  const db = await getDb();
  const audience = await accountAudience(db, identity.userId);
  const safety = publicationSafetyDecision({ title: capsule.title, abstract: `${capsule.context}\n${capsule.reflection}\n${capsule.reframe.publishedExpression}` });
  const requestedVisibility = capsule.visibility;
  const canPublish = requestedVisibility === "public" && capsule.publicReady && audience.capabilities.canPublishPublicly && safety.action !== "quarantine";
  const visibility = canPublish ? "public" : requestedVisibility === "circle" ? "circle" : "private";
  const now = new Date().toISOString();
  const storyId = crypto.randomUUID();
  const publicationId = canPublish ? crypto.randomUUID() : null;
  const story = {
    id: storyId,
    userId: identity.userId,
    publicationId,
    domain: capsule.domain,
    title: capsule.title,
    context: capsule.context,
    reflection: capsule.reflection,
    originalExpression: capsule.reframe.originalExpression,
    suggestedReframe: capsule.reframe.suggestedReframe,
    reframeChoice: capsule.reframe.reframeChoice,
    evidenceRef: capsule.evidenceRef,
    evidenceKind: capsule.evidenceKind,
    evidenceStatus: capsule.evidenceStatus,
    visibility,
    createdAt: now,
    updatedAt: now,
  };
  const operations = [db.insert(growthStories).values(story)];
  let provenanceReceipt = null;
  if (publicationId) {
    const abstract = [capsule.context, capsule.reflection, capsule.reframe.publishedExpression].filter(Boolean).join("\n\n");
    provenanceReceipt = await createProvenanceReceipt({ authorId: identity.userId, publicationId, title: capsule.title, abstract, type: "growth_story", version: 1 });
    operations.unshift(
      db.insert(publications).values({ id: publicationId, authorId: identity.userId, type: "growth_story", title: capsule.title, abstract, visibility: "public", verificationStatus: "processing", createdAt: now, publishedAt: now }),
      db.insert(publicationVersions).values({ id: crypto.randomUUID(), publicationId, version: 1, title: capsule.title, abstract, contentHash: provenanceReceipt.contentHash, provenanceReceipt: JSON.stringify(provenanceReceipt), createdAt: now }),
    );
  }
  await db.batch(operations as [typeof operations[number], ...typeof operations[number][]]);
  return Response.json({
    story,
    capsule,
    schema: teachSchemaVersions.growthStory,
    publication: publicationId ? { id: publicationId, type: "growth_story", visibility: "public" } : null,
    provenanceReceipt,
    visibilityAdjusted: visibility !== requestedVisibility,
    visibilityAdjustmentReason: requestedVisibility === "public" && !canPublish ? safety.action === "quarantine" ? safety.reasonCode : !capsule.publicReady ? "evidence_or_integrity_review_required" : "account_audience_not_public" : null,
  }, { status: 201 });
}
