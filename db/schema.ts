import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  primaryRole: text("primary_role").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("users_email_idx").on(table.email)]);

/** Opaque public handle: provider identity values are never exposed in feeds. */
export const publicProfiles = sqliteTable("public_profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  publicId: text("public_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("public_profiles_public_id_idx").on(table.publicId)]);

export const userFollows = sqliteTable("user_follows", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetUserId: text("target_user_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("user_follows_user_idx").on(table.userId),
  index("user_follows_target_idx").on(table.targetUserId),
  uniqueIndex("user_follows_unique_idx").on(table.userId, table.targetUserId),
]);

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const roleAssignments = sqliteTable("role_assignments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  organizationId: text("organization_id").references(() => organizations.id),
  role: text("role").notNull(),
  ageBand: text("age_band").notNull().default("unknown"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("role_assignments_user_idx").on(table.userId), index("role_assignments_org_idx").on(table.organizationId)]);

export const guardianConsents = sqliteTable("guardian_consents", {
  id: text("id").primaryKey(),
  minorUserId: text("minor_user_id").notNull().references(() => users.id),
  guardianUserId: text("guardian_user_id").notNull().references(() => users.id),
  scope: text("scope").notNull(),
  status: text("status").notNull().default("pending"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  revokedAt: text("revoked_at"),
}, (table) => [index("guardian_consents_minor_idx").on(table.minorUserId), index("guardian_consents_guardian_idx").on(table.guardianUserId)]);

export const externalIdentities = sqliteTable("external_identities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  displayName: text("display_name"),
  profileUrl: text("profile_url"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("external_identities_user_idx").on(table.userId), uniqueIndex("external_identities_provider_subject_idx").on(table.provider, table.externalId)]);

/** A claimed identifier is private until its provider-authenticated workflow exists. */
export const authorIdentifiers = sqliteTable("author_identifiers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  scheme: text("scheme").notNull(),
  identifier: text("identifier").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  status: text("status").notNull().default("claimed"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("author_identifiers_user_idx").on(table.userId),
  uniqueIndex("author_identifiers_user_scheme_idx").on(table.userId, table.scheme),
]);

export const integrationConnections = sqliteTable("integration_connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("disconnected"),
  scopes: text("scopes").notNull().default("[]"),
  tokenVaultRef: text("token_vault_ref"),
  expiresAt: text("expires_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("integration_connections_user_idx").on(table.userId), uniqueIndex("integration_connections_provider_idx").on(table.userId, table.provider)]);

/**
 * A migration is an owner-confirmed import plan, never a copied provider
 * session. Source URLs and item metadata remain private to the account owner.
 */
export const academiaMigrations = sqliteTable("academia_migrations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sourceProfileUrl: text("source_profile_url").notNull(),
  ownershipConfirmedAt: text("ownership_confirmed_at").notNull(),
  state: text("state").notNull().default("review"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("academia_migrations_user_idx").on(table.userId)]);

/** Items are reviewed independently so an import never silently changes reach. */
export const academiaMigrationItems = sqliteTable("academia_migration_items", {
  id: text("id").primaryKey(),
  migrationId: text("migration_id").notNull().references(() => academiaMigrations.id),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull().default(""),
  type: text("type").notNull().default("research_article"),
  topicSlugs: text("topic_slugs").notNull().default("[]"),
  selected: integer("selected", { mode: "boolean" }).notNull().default(true),
  visibility: text("visibility").notNull().default("private"),
  status: text("status").notNull().default("pending"),
  importedPublicationId: text("imported_publication_id").references(() => publications.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("academia_migration_items_migration_idx").on(table.migrationId), uniqueIndex("academia_migration_items_source_idx").on(table.migrationId, table.sourceUrl)]);
export const profilePreferences = sqliteTable("profile_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  avatarObjectKey: text("avatar_object_key"),
  bannerObjectKey: text("banner_object_key"),
  colorScheme: text("color_scheme").notNull().default("scholarium-dark"),
  accentColor: text("accent_color").notNull().default("#2157ee"),
  badgeVisibility: text("badge_visibility").notNull().default("public"),
  profileVisibility: text("profile_visibility").notNull().default("private"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const profileVerifications = sqliteTable("profile_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("unverified"),
  documentProvider: text("document_provider"),
  documentSessionRef: text("document_session_ref"),
  passkeyVerifiedAt: text("passkey_verified_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("profile_verifications_user_idx").on(table.userId), uniqueIndex("profile_verifications_user_unique_idx").on(table.userId)]);

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull().default("verified_contributor"),
  monthlyCents: integer("monthly_cents").notNull().default(99),
  status: text("status").notNull().default("inactive"),
  paymentProvider: text("payment_provider"),
  providerSubscriptionRef: text("provider_subscription_ref"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("subscriptions_user_idx").on(table.userId), uniqueIndex("subscriptions_user_plan_idx").on(table.userId, table.plan)]);

/** Minimal payment ledger: no card, wallet, or raw provider payload is retained. */
export const paymentReceipts = sqliteTable("payment_receipts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerOrderId: text("provider_order_id").notNull(),
  providerCaptureId: text("provider_capture_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("created"),
  providerEventId: text("provider_event_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("payment_receipts_user_idx").on(table.userId),
  uniqueIndex("payment_receipts_provider_order_idx").on(table.provider, table.providerOrderId),
  uniqueIndex("payment_receipts_provider_event_idx").on(table.provider, table.providerEventId),
]);

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  label: text("label").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("topics_slug_idx").on(table.slug)]);

export const publications = sqliteTable("publications", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  visibility: text("visibility").notNull().default("public"),
  verificationStatus: text("verification_status").notNull().default("processing"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text("published_at"),
}, (table) => [index("publications_author_idx").on(table.authorId), index("publications_status_idx").on(table.verificationStatus)]);

export const publicationTopics = sqliteTable("publication_topics", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  topicId: text("topic_id").notNull().references(() => topics.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("publication_topics_publication_idx").on(table.publicationId), index("publication_topics_topic_idx").on(table.topicId), uniqueIndex("publication_topics_unique_idx").on(table.publicationId, table.topicId)]);

export const topicFollows = sqliteTable("topic_follows", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  topicId: text("topic_id").notNull().references(() => topics.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("topic_follows_user_idx").on(table.userId), index("topic_follows_topic_idx").on(table.topicId), uniqueIndex("topic_follows_unique_idx").on(table.userId, table.topicId)]);

export const publicationReactions = sqliteTable("publication_reactions", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  userId: text("user_id").notNull().references(() => users.id),
  kind: text("kind").notNull().default("insightful"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("publication_reactions_publication_idx").on(table.publicationId),
  index("publication_reactions_user_idx").on(table.userId),
  uniqueIndex("publication_reactions_unique_idx").on(table.publicationId, table.userId),
]);

export const publicationComments = sqliteTable("publication_comments", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  authorId: text("author_id").notNull().references(() => users.id),
  parentCommentId: text("parent_comment_id").references(() => publicationComments.id),
  body: text("body").notNull(),
  status: text("status").notNull().default("visible"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("publication_comments_publication_idx").on(table.publicationId),
  index("publication_comments_author_idx").on(table.authorId),
  index("publication_comments_parent_idx").on(table.parentCommentId),
]);

export const interactionReports = sqliteTable("interaction_reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  commentId: text("comment_id").references(() => publicationComments.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("interaction_reports_reporter_idx").on(table.reporterId),
  index("interaction_reports_publication_idx").on(table.publicationId),
  index("interaction_reports_comment_idx").on(table.commentId),
]);

export const userBoundaries = sqliteTable("user_boundaries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  targetUserId: text("target_user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("user_boundaries_user_idx").on(table.userId),
  index("user_boundaries_target_idx").on(table.targetUserId),
  uniqueIndex("user_boundaries_unique_idx").on(table.userId, table.targetUserId, table.kind),
]);

export const publicationVersions = sqliteTable("publication_versions", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  version: integer("version").notNull(),
  title: text("title").notNull().default(""),
  abstract: text("abstract").notNull().default(""),
  contentHash: text("content_hash").notNull(),
  provenanceReceipt: text("provenance_receipt").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("publication_versions_unique_idx").on(table.publicationId, table.version)]);

/**
 * Automated decisions retain a reason code, not a copied sensitive excerpt.
 * A moderation decision is reviewable and never a claim about scientific truth.
 */
export const moderationCases = sqliteTable("moderation_cases", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  source: text("source").notNull(),
  reasonCode: text("reason_code").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
}, (table) => [
  index("moderation_cases_publication_idx").on(table.publicationId),
  index("moderation_cases_status_idx").on(table.status),
]);

export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  sha256: text("sha256").notNull(),
  archiveStatus: text("archive_status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("artifacts_publication_idx").on(table.publicationId),
  uniqueIndex("artifacts_object_key_idx").on(table.objectKey),
  uniqueIndex("artifacts_publication_sha256_idx").on(table.publicationId, table.sha256),
]);

export const rankingPreferences = sqliteTable("ranking_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  relevanceWeight: integer("relevance_weight").notNull().default(78),
  freshnessWeight: integer("freshness_weight").notNull().default(52),
  diversityWeight: integer("diversity_weight").notNull().default(66),
  personalized: integer("personalized", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const feedFeedback = sqliteTable("feed_feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  preference: text("preference").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("feed_feedback_user_idx").on(table.userId),
  index("feed_feedback_publication_idx").on(table.publicationId),
  uniqueIndex("feed_feedback_user_publication_idx").on(table.userId, table.publicationId),
]);

/** Private personal organization; collection contents never enter feed ranking. */
export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  kind: text("kind").notNull().default("collection"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("collections_user_idx").on(table.userId),
  uniqueIndex("collections_user_title_idx").on(table.userId, table.title),
]);

export const collectionItems = sqliteTable("collection_items", {
  id: text("id").primaryKey(),
  collectionId: text("collection_id").notNull().references(() => collections.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("collection_items_collection_idx").on(table.collectionId),
  index("collection_items_publication_idx").on(table.publicationId),
  uniqueIndex("collection_items_unique_idx").on(table.collectionId, table.publicationId),
]);

export const externalMediaLinks = sqliteTable("external_media_links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  provider: text("provider").notNull(),
  externalId: text("external_id").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("external_media_links_publication_idx").on(table.publicationId),
  index("external_media_links_user_idx").on(table.userId),
  uniqueIndex("external_media_links_provider_external_idx").on(table.provider, table.externalId),
]);

/** Canonical source links; code changes and forks remain at the source provider. */
export const repositoryLinks = sqliteTable("repository_links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  provider: text("provider").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  repositoryPath: text("repository_path").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("repository_links_publication_idx").on(table.publicationId),
  index("repository_links_user_idx").on(table.userId),
  uniqueIndex("repository_links_publication_provider_path_idx").on(table.publicationId, table.provider, table.repositoryPath),
]);

/**
 * Minimal delivery trace for provider webhooks. The raw provider payload is
 * deliberately not retained: Scholarium needs the event identity and a
 * tamper-evident hash, not a copied third-party content archive.
 */
export const mediaWebhookEvents = sqliteTable("media_webhook_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  externalEventId: text("external_event_id").notNull(),
  externalSubjectId: text("external_subject_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  deliveryStatus: text("delivery_status").notNull().default("recorded"),
  receivedAt: text("received_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("media_webhook_events_user_idx").on(table.userId),
  index("media_webhook_events_subject_idx").on(table.provider, table.externalSubjectId),
  uniqueIndex("media_webhook_events_delivery_idx").on(table.provider, table.externalEventId, table.payloadHash),
]);
