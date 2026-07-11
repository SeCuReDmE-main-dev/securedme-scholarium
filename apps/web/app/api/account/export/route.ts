import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  artifacts,
  collectionItems,
  collections,
  externalIdentities,
  integrationConnections,
  profilePreferences,
  publicationComments,
  publicationReactions,
  publications,
  publicationTopics,
  publicationVersions,
  rankingPreferences,
  repositoryLinks,
  roleAssignments,
  topicFollows,
  topics,
  userBoundaries,
  users,
} from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";

/**
 * Produce a portable account record without exporting authentication material,
 * payment references, document-verification references, or provider tokens.
 */
export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const db = await getDb();
    const [account] = await db.select().from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!account) return Response.json({ error: "Create a Scholarium account before requesting an export" }, { status: 404 });

    const ownPublications = await db.select().from(publications).where(eq(publications.authorId, account.id));
    const publicationIds = ownPublications.map((publication) => publication.id);
    const [roles, preferences, ranking, followedTopics, identities, connections, comments, reactions, boundaries, versions, files, publicationTopicRows, savedCollections, sourceLinks] = await Promise.all([
      db.select().from(roleAssignments).where(eq(roleAssignments.userId, account.id)),
      db.select().from(profilePreferences).where(eq(profilePreferences.userId, account.id)),
      db.select().from(rankingPreferences).where(eq(rankingPreferences.userId, account.id)),
      db.select({ label: topics.label, slug: topics.slug }).from(topicFollows).innerJoin(topics, eq(topicFollows.topicId, topics.id)).where(eq(topicFollows.userId, account.id)),
      db.select({ createdAt: externalIdentities.createdAt, displayName: externalIdentities.displayName, profileUrl: externalIdentities.profileUrl, provider: externalIdentities.provider, verifiedAt: externalIdentities.verifiedAt }).from(externalIdentities).where(eq(externalIdentities.userId, account.id)),
      db.select({ expiresAt: integrationConnections.expiresAt, provider: integrationConnections.provider, scopes: integrationConnections.scopes, status: integrationConnections.status, updatedAt: integrationConnections.updatedAt }).from(integrationConnections).where(eq(integrationConnections.userId, account.id)),
      db.select().from(publicationComments).where(eq(publicationComments.authorId, account.id)),
      db.select().from(publicationReactions).where(eq(publicationReactions.userId, account.id)),
      db.select({ createdAt: userBoundaries.createdAt, kind: userBoundaries.kind, targetUserId: userBoundaries.targetUserId }).from(userBoundaries).where(eq(userBoundaries.userId, account.id)),
      publicationIds.length ? db.select().from(publicationVersions).where(inArray(publicationVersions.publicationId, publicationIds)) : Promise.resolve([]),
      publicationIds.length ? db.select({ archiveStatus: artifacts.archiveStatus, byteSize: artifacts.byteSize, contentType: artifacts.contentType, createdAt: artifacts.createdAt, publicationId: artifacts.publicationId, sha256: artifacts.sha256 }).from(artifacts).where(inArray(artifacts.publicationId, publicationIds)) : Promise.resolve([]),
      publicationIds.length ? db.select({ publicationId: publicationTopics.publicationId, topic: topics.slug }).from(publicationTopics).innerJoin(topics, eq(publicationTopics.topicId, topics.id)).where(inArray(publicationTopics.publicationId, publicationIds)) : Promise.resolve([]),
      db.select().from(collections).where(eq(collections.userId, account.id)),
      publicationIds.length ? db.select({ canonicalUrl: repositoryLinks.canonicalUrl, createdAt: repositoryLinks.createdAt, provider: repositoryLinks.provider, publicationId: repositoryLinks.publicationId, repositoryPath: repositoryLinks.repositoryPath }).from(repositoryLinks).where(inArray(repositoryLinks.publicationId, publicationIds)) : Promise.resolve([]),
    ]);
    const collectionIds = savedCollections.map((collection) => collection.id);
    const savedCollectionItems = collectionIds.length ? await db.select().from(collectionItems).where(inArray(collectionItems.collectionId, collectionIds)) : [];

    const result = {
      exportedAt: new Date().toISOString(),
      format: "securedme-scholarium-account-export/v1",
      account,
      identity: { email: identity.email, provider: identity.provider },
      roles,
      preferences: preferences[0] ?? null,
      rankingPreference: ranking[0] ?? null,
      followedTopics,
      externalIdentities: identities,
      integrations: connections,
      publications: ownPublications,
      publicationTopics: publicationTopicRows,
      publicationVersions: versions,
      artifacts: files,
      comments,
      reactions,
      boundaries,
      savedCollections,
      savedCollectionItems,
      repositoryLinks: sourceLinks,
      excluded: [
        "provider session cookies and OAuth state",
        "integration token vault references and provider tokens",
        "payment provider and subscription references",
        "identity-document and passkey verification references",
        "other members' private data",
        "binary R2 profile-media files",
      ],
    };
    const filenameDate = result.exportedAt.slice(0, 10);
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": `attachment; filename="scholarium-account-export-${filenameDate}.json"`,
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Account export failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to prepare your account export" }, { status: 500 });
  }
}
