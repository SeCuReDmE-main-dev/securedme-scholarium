import { eq, inArray, or } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  artifacts,
  algoquestLearningEvents,
  archiveManifests,
  authorIdentifiers,
  collectionItems,
  collections,
  citationAlerts,
  externalIdentities,
  fundingCampaigns,
  integrationConnections,
  growthStories,
  learningAttempts,
  learningReminders,
  profilePreferences,
  profileSections,
  providerConsents,
  publicationComments,
  publicationRelationships,
  publicationReactions,
  publications,
  publicationTopics,
  publicationVersions,
  projectStarterRequests,
  quantechRenderRequests,
  rankingPreferences,
  readerPreferences,
  repositoryLinks,
  roleAssignments,
  scientificDepositRequests,
  searchAlerts,
  strengthObservations,
  teachAssistantExchanges,
  teachAssistantGraphRecords,
  teachCheckpoints,
  teachInterventionPreferences,
  teachCircleMemberships,
  teachCircles,
  teachGate5Jobs,
  teachExceptionalAccessApprovals,
  teachExceptionalAccessAuditEvents,
  teachExceptionalAccessRequests,
  teachMediaRequests,
  teachMediaPublicationConfirmations,
  teachProjectEntries,
  teachProjectThreads,
  teachPurposeConsents,
  teachRecognitions,
  teachRecaps,
  teachWeeklyObjectives,
  topicFollows,
  topics,
  userBoundaries,
  users,
  webauthHandoffRequests,
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
    const [roles, preferences, sections, readerPreferenceRows, ranking, followedTopics, identities, authorIds, connections, consentRows, handoffRows, searchAlertRows, citationAlertRows, comments, reactions, boundaries, versions, files, archiveRows, fundingRows, depositRows, projectStarterRows, publicationTopicRows, savedCollections, sourceLinks, sourceRelationships, quantechRequests] = await Promise.all([
      db.select().from(roleAssignments).where(eq(roleAssignments.userId, account.id)),
      db.select().from(profilePreferences).where(eq(profilePreferences.userId, account.id)),
      db.select().from(profileSections).where(eq(profileSections.userId, account.id)),
      db.select().from(readerPreferences).where(eq(readerPreferences.userId, account.id)),
      db.select().from(rankingPreferences).where(eq(rankingPreferences.userId, account.id)),
      db.select({ label: topics.label, slug: topics.slug }).from(topicFollows).innerJoin(topics, eq(topicFollows.topicId, topics.id)).where(eq(topicFollows.userId, account.id)),
      db.select({ createdAt: externalIdentities.createdAt, displayName: externalIdentities.displayName, profileUrl: externalIdentities.profileUrl, provider: externalIdentities.provider, verifiedAt: externalIdentities.verifiedAt }).from(externalIdentities).where(eq(externalIdentities.userId, account.id)),
      db.select({ canonicalUrl: authorIdentifiers.canonicalUrl, identifier: authorIdentifiers.identifier, scheme: authorIdentifiers.scheme, status: authorIdentifiers.status, updatedAt: authorIdentifiers.updatedAt }).from(authorIdentifiers).where(eq(authorIdentifiers.userId, account.id)),
      db.select({ expiresAt: integrationConnections.expiresAt, provider: integrationConnections.provider, scopes: integrationConnections.scopes, status: integrationConnections.status, updatedAt: integrationConnections.updatedAt }).from(integrationConnections).where(eq(integrationConnections.userId, account.id)),
      db.select({ grantedAt: providerConsents.grantedAt, provider: providerConsents.provider, revokedAt: providerConsents.revokedAt, scopes: providerConsents.scopes, status: providerConsents.status, updatedAt: providerConsents.updatedAt }).from(providerConsents).where(eq(providerConsents.userId, account.id)),
      db.select({ contextKind: webauthHandoffRequests.contextKind, contextReference: webauthHandoffRequests.contextReference, createdAt: webauthHandoffRequests.createdAt, provider: webauthHandoffRequests.provider, purpose: webauthHandoffRequests.purpose, status: webauthHandoffRequests.status }).from(webauthHandoffRequests).where(eq(webauthHandoffRequests.userId, account.id)),
      db.select().from(searchAlerts).where(eq(searchAlerts.userId, account.id)),
      db.select().from(citationAlerts).where(eq(citationAlerts.userId, account.id)),
      db.select().from(publicationComments).where(eq(publicationComments.authorId, account.id)),
      db.select().from(publicationReactions).where(eq(publicationReactions.userId, account.id)),
      db.select({ createdAt: userBoundaries.createdAt, kind: userBoundaries.kind, targetUserId: userBoundaries.targetUserId }).from(userBoundaries).where(eq(userBoundaries.userId, account.id)),
      publicationIds.length ? db.select().from(publicationVersions).where(inArray(publicationVersions.publicationId, publicationIds)) : Promise.resolve([]),
      publicationIds.length ? db.select({ archiveStatus: artifacts.archiveStatus, byteSize: artifacts.byteSize, contentType: artifacts.contentType, createdAt: artifacts.createdAt, publicationId: artifacts.publicationId, sha256: artifacts.sha256 }).from(artifacts).where(inArray(artifacts.publicationId, publicationIds)) : Promise.resolve([]),
      db.select().from(archiveManifests).where(eq(archiveManifests.userId, account.id)),
      db.select().from(fundingCampaigns).where(eq(fundingCampaigns.userId, account.id)),
      db.select().from(scientificDepositRequests).where(eq(scientificDepositRequests.userId, account.id)),
      db.select().from(projectStarterRequests).where(eq(projectStarterRequests.userId, account.id)),
      publicationIds.length ? db.select({ publicationId: publicationTopics.publicationId, topic: topics.slug }).from(publicationTopics).innerJoin(topics, eq(publicationTopics.topicId, topics.id)).where(inArray(publicationTopics.publicationId, publicationIds)) : Promise.resolve([]),
      db.select().from(collections).where(eq(collections.userId, account.id)),
      publicationIds.length ? db.select({ canonicalUrl: repositoryLinks.canonicalUrl, createdAt: repositoryLinks.createdAt, provider: repositoryLinks.provider, publicationId: repositoryLinks.publicationId, repositoryPath: repositoryLinks.repositoryPath }).from(repositoryLinks).where(inArray(repositoryLinks.publicationId, publicationIds)) : Promise.resolve([]),
      publicationIds.length ? db.select().from(publicationRelationships).where(inArray(publicationRelationships.publicationId, publicationIds)) : Promise.resolve([]),
      db.select({
        aspect: quantechRenderRequests.aspect,
        createdAt: quantechRenderRequests.createdAt,
        entitlementStatus: quantechRenderRequests.entitlementStatus,
        handoffUrl: quantechRenderRequests.handoffUrl,
        id: quantechRenderRequests.id,
        provider: quantechRenderRequests.provider,
        qualityPreset: quantechRenderRequests.qualityPreset,
        reviewMode: quantechRenderRequests.reviewMode,
        scriptDigest: quantechRenderRequests.scriptDigest,
        sourceUrlCount: quantechRenderRequests.sourceUrlCount,
        status: quantechRenderRequests.status,
      }).from(quantechRenderRequests).where(eq(quantechRenderRequests.userId, account.id)),
    ]);
    const collectionIds = savedCollections.map((collection) => collection.id);
    const savedCollectionItems = collectionIds.length ? await db.select().from(collectionItems).where(inArray(collectionItems.collectionId, collectionIds)) : [];
    const ownedProjectRows = await db.select().from(teachProjectThreads).where(eq(teachProjectThreads.ownerUserId, account.id));
    const ownedProjectIds = ownedProjectRows.map((project) => project.id);
    const [teachAttemptRows, teachReminderRows, teachCheckpointRows, strengthRows, algoquestRows, assistantGraphRows, assistantExchangeRows, weeklyObjectiveRows, interventionPreferenceRows, growthRows, teachMediaRows, teachMediaPublicationRows, teachGate5Rows, teachConsentRows, projectEntryRows, circleRows, circleMembershipRows, recognitionRows, recapRows] = await Promise.all([
      db.select().from(learningAttempts).where(eq(learningAttempts.userId, account.id)),
      db.select().from(learningReminders).where(eq(learningReminders.userId, account.id)),
      db.select().from(teachCheckpoints).where(eq(teachCheckpoints.userId, account.id)),
      db.select().from(strengthObservations).where(eq(strengthObservations.userId, account.id)),
      db.select().from(algoquestLearningEvents).where(eq(algoquestLearningEvents.userId, account.id)),
      db.select().from(teachAssistantGraphRecords).where(eq(teachAssistantGraphRecords.userId, account.id)),
      db.select({
        consentReceiptId: teachAssistantExchanges.consentReceiptId,
        courseId: teachAssistantExchanges.courseId,
        createdAt: teachAssistantExchanges.createdAt,
        expiresAt: teachAssistantExchanges.expiresAt,
        id: teachAssistantExchanges.id,
        projection: teachAssistantExchanges.projection,
        purpose: teachAssistantExchanges.purpose,
        receivedAt: teachAssistantExchanges.receivedAt,
        recipientRole: teachAssistantExchanges.recipientRole,
        senderRole: teachAssistantExchanges.senderRole,
        status: teachAssistantExchanges.status,
      }).from(teachAssistantExchanges).where(or(eq(teachAssistantExchanges.senderUserId, account.id), eq(teachAssistantExchanges.recipientUserId, account.id))),
      db.select().from(teachWeeklyObjectives).where(eq(teachWeeklyObjectives.userId, account.id)),
      db.select().from(teachInterventionPreferences).where(eq(teachInterventionPreferences.userId, account.id)),
      db.select().from(growthStories).where(eq(growthStories.userId, account.id)),
      db.select().from(teachMediaRequests).where(eq(teachMediaRequests.userId, account.id)),
      db.select().from(teachMediaPublicationConfirmations).where(eq(teachMediaPublicationConfirmations.userId, account.id)),
      db.select().from(teachGate5Jobs).where(eq(teachGate5Jobs.userId, account.id)),
      db.select().from(teachPurposeConsents).where(eq(teachPurposeConsents.userId, account.id)),
      ownedProjectIds.length ? db.select({ createdAt: teachProjectEntries.createdAt, id: teachProjectEntries.id, kind: teachProjectEntries.kind, label: teachProjectEntries.label, occurredAt: teachProjectEntries.occurredAt, projectId: teachProjectEntries.projectId, reference: teachProjectEntries.reference, reflection: teachProjectEntries.reflection, status: teachProjectEntries.status }).from(teachProjectEntries).where(inArray(teachProjectEntries.projectId, ownedProjectIds)) : Promise.resolve([]),
      db.select().from(teachCircles).where(eq(teachCircles.ownerUserId, account.id)),
      db.select().from(teachCircleMemberships).where(eq(teachCircleMemberships.userId, account.id)),
      db.select({ category: teachRecognitions.category, circleId: teachRecognitions.circleId, context: teachRecognitions.context, createdAt: teachRecognitions.createdAt, evidenceRef: teachRecognitions.evidenceRef, id: teachRecognitions.id, reviewedAt: teachRecognitions.reviewedAt, statement: teachRecognitions.statement, status: teachRecognitions.status }).from(teachRecognitions).where(or(eq(teachRecognitions.issuerUserId, account.id), eq(teachRecognitions.recipientUserId, account.id))),
      db.select().from(teachRecaps).where(eq(teachRecaps.userId, account.id)),
    ]);
    const exceptionalAccessRows = await db.select().from(teachExceptionalAccessRequests).where(or(
      eq(teachExceptionalAccessRequests.requesterUserId, account.id),
      eq(teachExceptionalAccessRequests.subjectUserId, account.id),
    ));
    const exceptionalAccessIds = exceptionalAccessRows.map((row) => row.id);
    const exceptionalAccessApprovalRows = exceptionalAccessIds.length ? await db.select({
      createdAt: teachExceptionalAccessApprovals.createdAt,
      decision: teachExceptionalAccessApprovals.decision,
      id: teachExceptionalAccessApprovals.id,
      rationale: teachExceptionalAccessApprovals.rationale,
      requestId: teachExceptionalAccessApprovals.requestId,
    }).from(teachExceptionalAccessApprovals).where(or(
      inArray(teachExceptionalAccessApprovals.requestId, exceptionalAccessIds),
      eq(teachExceptionalAccessApprovals.approverUserId, account.id),
    )) : [];
    const exceptionalAccessAuditRows = exceptionalAccessIds.length ? await db.select({
      createdAt: teachExceptionalAccessAuditEvents.createdAt,
      eventDigest: teachExceptionalAccessAuditEvents.eventDigest,
      eventType: teachExceptionalAccessAuditEvents.eventType,
      requestId: teachExceptionalAccessAuditEvents.requestId,
    }).from(teachExceptionalAccessAuditEvents).where(inArray(teachExceptionalAccessAuditEvents.requestId, exceptionalAccessIds)) : [];

    const result = {
      exportedAt: new Date().toISOString(),
      format: "securedme-scholarium-account-export/v1",
      account,
      identity: { email: identity.email, provider: identity.provider },
      roles,
      preferences: preferences[0] ?? null,
      profileSections: sections,
      readerPreferences: readerPreferenceRows[0] ?? null,
      rankingPreference: ranking[0] ?? null,
      followedTopics,
      externalIdentities: identities,
      authorIdentifiers: authorIds,
      integrations: connections,
      providerConsents: consentRows,
      webauthHandoffRequests: handoffRows,
      searchAlerts: searchAlertRows,
      citationAlerts: citationAlertRows,
      publications: ownPublications,
      publicationTopics: publicationTopicRows,
      publicationVersions: versions,
      artifacts: files,
      archiveManifests: archiveRows,
      fundingCampaigns: fundingRows,
      scientificDepositRequests: depositRows,
      projectStarterRequests: projectStarterRows,
      comments,
      reactions,
      boundaries,
      savedCollections,
      savedCollectionItems,
      repositoryLinks: sourceLinks,
      publicationRelationships: sourceRelationships,
      quantechRenderRequests: quantechRequests,
      teach: {
        learningAttempts: teachAttemptRows,
        learningReminders: teachReminderRows,
        checkpoints: teachCheckpointRows,
        strengthObservations: strengthRows,
        algoquestLearningEvents: algoquestRows,
        assistantGraphRecords: assistantGraphRows,
        assistantExchanges: assistantExchangeRows,
        weeklyObjectives: weeklyObjectiveRows,
        interventionPreferences: interventionPreferenceRows[0] ?? null,
        growthStories: growthRows,
        projectThreads: ownedProjectRows,
        projectEntries: projectEntryRows,
        ownedCircles: circleRows,
        circleMemberships: circleMembershipRows,
        recognitions: recognitionRows,
        recaps: recapRows,
        mediaRequests: teachMediaRows,
        mediaPublicationConfirmations: teachMediaPublicationRows,
        gate5Jobs: teachGate5Rows,
        purposeConsents: teachConsentRows,
        exceptionalAccessRequests: exceptionalAccessRows,
        exceptionalAccessApprovals: exceptionalAccessApprovalRows,
        exceptionalAccessAuditEvents: exceptionalAccessAuditRows,
      },
      excluded: [
        "provider session cookies and OAuth state",
        "integration token vault references and provider tokens",
        "payment provider and subscription references",
        "identity-document and passkey verification references",
        "other members' private data",
        "binary R2 profile-media files",
        "raw QuaNTecH scripts, media, provider credentials, and render internals",
        "GitHub, GitLab, or SourceForge OAuth tokens and private repository credentials",
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
