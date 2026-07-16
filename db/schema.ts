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
 * A durable record of the account owner's explicit provider-scope decision.
 * It deliberately stores neither OAuth tokens nor provider session material.
 */
export const providerConsents = sqliteTable("provider_consents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  scopes: text("scopes").notNull().default("[]"),
  consentVersion: text("consent_version").notNull().default("v1"),
  status: text("status").notNull().default("granted"),
  grantedAt: text("granted_at"),
  revokedAt: text("revoked_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("provider_consents_user_idx").on(table.userId),
  uniqueIndex("provider_consents_user_provider_idx").on(table.userId, table.provider),
]);

/**
 * A private, minimal handoff ledger for provider-owned WebAuth workflows.
 * The provider authenticates the user; Scholarium stores no raw prompts,
 * provider tokens, or opaque session identifiers.
 */
export const webauthHandoffRequests = sqliteTable("webauth_handoff_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  purpose: text("purpose").notNull(),
  contextKind: text("context_kind").notNull().default("none"),
  contextReference: text("context_reference"),
  status: text("status").notNull().default("provider_auth_required"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("webauth_handoff_requests_user_idx").on(table.userId),
  index("webauth_handoff_requests_provider_idx").on(table.provider),
  index("webauth_handoff_requests_created_idx").on(table.createdAt),
]);

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

/** Author-controlled CV-style material. Public visibility is opt-in per section. */
export const profileSections = sqliteTable("profile_sections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sectionKind: text("section_kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  visibility: text("visibility").notNull().default("private"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("profile_sections_user_idx").on(table.userId),
  index("profile_sections_user_visibility_idx").on(table.userId, table.visibility),
]);

/** Private alerts are explicit subscriptions, never inferred from passive reading behavior. */
export const searchAlerts = sqliteTable("search_alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  label: text("label").notNull(),
  query: text("query").notNull().default(""),
  topicSlugs: text("topic_slugs").notNull().default("[]"),
  cadence: text("cadence").notNull().default("weekly"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("search_alerts_user_idx").on(table.userId)]);

/** Citation-monitoring preference only; external citation counts remain source-verified work. */
export const citationAlerts = sqliteTable("citation_alerts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("citation_alerts_user_idx").on(table.userId),
  index("citation_alerts_publication_idx").on(table.publicationId),
  uniqueIndex("citation_alerts_user_publication_idx").on(table.userId, table.publicationId),
]);

export const readerPreferences = sqliteTable("reader_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  keyboardFirst: integer("keyboard_first", { mode: "boolean" }).notNull().default(true),
  reducedMotion: integer("reduced_motion", { mode: "boolean" }).notNull().default(false),
  screenReaderOptimized: integer("screen_reader_optimized", { mode: "boolean" }).notNull().default(false),
  notificationChannels: text("notification_channels").notNull().default("[\"in_app\"]"),
  digestCadence: text("digest_cadence").notNull().default("off"),
  topicAlerts: integer("topic_alerts", { mode: "boolean" }).notNull().default(true),
  moderationAlerts: integer("moderation_alerts", { mode: "boolean" }).notNull().default(true),
  interfaceLanguage: text("interface_language").notNull().default("en"),
  showOriginalFirst: integer("show_original_first", { mode: "boolean" }).notNull().default(true),
  allowPublicationTranslation: integer("allow_publication_translation", { mode: "boolean" }).notNull().default(false),
  glossaryTerms: text("glossary_terms").notNull().default("[]"),
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
 * Owner-only private project starter. It prepares a safe Git provider action,
 * but never writes to the source maintainer repository and never copies code
 * until a provider-authenticated export worker is approved.
 */
export const projectStarterRequests = sqliteTable("project_starter_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  sourceProvider: text("source_provider").notNull(),
  sourceRepositoryUrl: text("source_repository_url").notNull(),
  sourceRepositoryPath: text("source_repository_path").notNull(),
  targetProvider: text("target_provider").notNull().default("github"),
  targetVisibility: text("target_visibility").notNull().default("private"),
  targetRepositoryName: text("target_repository_name").notNull(),
  licenseStatus: text("license_status").notNull().default("requires_review"),
  provenanceManifestStatus: text("provenance_manifest_status").notNull().default("required"),
  status: text("status").notNull().default("provider_auth_required"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("project_starter_requests_user_idx").on(table.userId),
  index("project_starter_requests_publication_idx").on(table.publicationId),
  uniqueIndex("project_starter_requests_unique_idx").on(table.userId, table.publicationId, table.sourceProvider, table.sourceRepositoryPath),
]);

/** Author-declared source relationship; it records attribution, not a truth or ownership verdict. */
export const publicationRelationships = sqliteTable("publication_relationships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").notNull().references(() => publications.id),
  relationType: text("relation_type").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceTitle: text("source_title"),
  sourceLicense: text("source_license"),
  declaration: text("declaration").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("publication_relationships_publication_idx").on(table.publicationId),
  index("publication_relationships_user_idx").on(table.userId),
  uniqueIndex("publication_relationships_source_idx").on(table.publicationId, table.relationType, table.sourceUrl),
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

/** Private provider handoff ledger. It stores request metadata, never raw scripts or media. */
export const quantechRenderRequests = sqliteTable("quantech_render_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull().default("QuaNTecH-ViD"),
  status: text("status").notNull().default("prepared"),
  aspect: text("aspect").notNull(),
  qualityPreset: text("quality_preset").notNull(),
  reviewMode: text("review_mode").notNull().default("none"),
  entitlementStatus: text("entitlement_status").notNull(),
  scriptDigest: text("script_digest").notNull(),
  sourceUrlCount: integer("source_url_count").notNull().default(0),
  handoffUrl: text("handoff_url").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("quantech_render_requests_user_idx").on(table.userId),
  index("quantech_render_requests_created_idx").on(table.createdAt),
]);

/** Educational Live planning ledger. It stores schedule and safety state, never stream keys or raw chat. */
export const liveSessions = sqliteTable("live_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  title: text("title").notNull(),
  agenda: text("agenda").notNull().default(""),
  scheduledAt: text("scheduled_at").notNull(),
  audienceMode: text("audience_mode").notNull().default("public_review"),
  moderatorPlan: text("moderator_plan").notNull().default("author_moderated"),
  youthMode: text("youth_mode").notNull().default("restricted_until_consent"),
  status: text("status").notNull().default("planned"),
  replayConsent: integer("replay_consent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("live_sessions_user_idx").on(table.userId),
  index("live_sessions_publication_idx").on(table.publicationId),
  index("live_sessions_scheduled_idx").on(table.scheduledAt),
]);

/** Funding campaign intent. Money is handled by approved payment providers, not retained by Scholarium. */
export const fundingCampaigns = sqliteTable("funding_campaigns", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  title: text("title").notNull(),
  purpose: text("purpose").notNull().default(""),
  goalCents: integer("goal_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  deadlineAt: text("deadline_at"),
  beneficiaryStatus: text("beneficiary_status").notNull().default("verification_required"),
  publicProgress: integer("public_progress", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("funding_campaigns_user_idx").on(table.userId),
  index("funding_campaigns_publication_idx").on(table.publicationId),
  index("funding_campaigns_status_idx").on(table.status),
]);

/** Minimal contribution intent. It is a receipt boundary, not a stored wallet, card, or escrow record. */
export const contributionIntents = sqliteTable("contribution_intents", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull().references(() => fundingCampaigns.id),
  contributorId: text("contributor_id").notNull().references(() => users.id),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("provider_setup_required"),
  anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("contribution_intents_campaign_idx").on(table.campaignId),
  index("contribution_intents_contributor_idx").on(table.contributorId),
]);

/** Private DOI/deposit preparation. It does not reserve a DOI or publish to a repository. */
export const scientificDepositRequests = sqliteTable("scientific_deposit_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  provider: text("provider").notNull().default("zenodo"),
  title: text("title").notNull(),
  license: text("license").notNull().default("cc-by-4.0"),
  metadata: text("metadata").notNull().default("{}"),
  status: text("status").notNull().default("draft"),
  irreversibleConfirmedAt: text("irreversible_confirmed_at"),
  providerDraftRef: text("provider_draft_ref"),
  doi: text("doi"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("scientific_deposit_requests_user_idx").on(table.userId),
  index("scientific_deposit_requests_publication_idx").on(table.publicationId),
  index("scientific_deposit_requests_provider_idx").on(table.provider),
]);

/** Owner-only external archive manifest. It stores status, not provider tokens or copied file bytes. */
export const archiveManifests = sqliteTable("archive_manifests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  provider: text("provider").notNull(),
  providerPath: text("provider_path").notNull(),
  objectCount: integer("object_count").notNull().default(0),
  status: text("status").notNull().default("planned"),
  lastVerifiedAt: text("last_verified_at"),
  restoreRequestedAt: text("restore_requested_at"),
  resyncRequestedAt: text("resync_requested_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("archive_manifests_user_idx").on(table.userId),
  index("archive_manifests_publication_idx").on(table.publicationId),
  uniqueIndex("archive_manifests_provider_path_idx").on(table.userId, table.provider, table.providerPath),
]);

/** Teach remains a domain of the existing Scholarium identity and organization model. */
export const teachCourses = sqliteTable("teach_courses", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").references(() => organizations.id),
  ownerId: text("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  locale: text("locale").notNull().default("fr"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_courses_owner_idx").on(table.ownerId), index("teach_courses_org_idx").on(table.organizationId)]);

export const teachEnrollments = sqliteTable("teach_enrollments", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => teachCourses.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  revokedAt: text("revoked_at"),
}, (table) => [index("teach_enrollments_course_idx").on(table.courseId), index("teach_enrollments_user_idx").on(table.userId), uniqueIndex("teach_enrollments_unique_idx").on(table.courseId, table.userId, table.role)]);

export const teachModules = sqliteTable("teach_modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => teachCourses.id),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_modules_course_idx").on(table.courseId)]);

export const teachLessons = sqliteTable("teach_lessons", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => teachCourses.id),
  moduleId: text("module_id").notNull().references(() => teachModules.id),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_lessons_course_idx").on(table.courseId), index("teach_lessons_module_idx").on(table.moduleId)]);

export const learningObjectives = sqliteTable("learning_objectives", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id").notNull().references(() => teachLessons.id),
  notion: text("notion").notNull(),
  prompt: text("prompt").notNull(),
  targetAnswer: text("target_answer").notNull(),
  translation: text("translation").notNull().default(""),
  phoneticHelp: text("phonetic_help").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("learning_objectives_lesson_idx").on(table.lessonId)]);

export const learningQuestions = sqliteTable("learning_questions", {
  id: text("id").primaryKey(),
  objectiveId: text("objective_id").notNull().references(() => learningObjectives.id),
  prompt: text("prompt").notNull(),
  contextKey: text("context_key").notNull(),
  kind: text("kind").notNull().default("primary"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("learning_questions_objective_idx").on(table.objectiveId)]);

export const learningHints = sqliteTable("learning_hints", {
  id: text("id").primaryKey(),
  objectiveId: text("objective_id").notNull().references(() => learningObjectives.id),
  assistanceLevel: text("assistance_level").notNull(),
  content: text("content").notNull(),
  position: integer("position").notNull().default(0),
  exposesTarget: integer("exposes_target", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("learning_hints_objective_idx").on(table.objectiveId)]);

/** Attempts hold bounded learning evidence, never a hidden emotional or clinical profile. */
export const learningAttempts = sqliteTable("learning_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  objectiveId: text("objective_id").notNull().references(() => learningObjectives.id),
  questionId: text("question_id").notNull().references(() => learningQuestions.id),
  submittedQuestionId: text("submitted_question_id").notNull(),
  answer: text("answer").notNull(),
  assistanceLevel: text("assistance_level").notNull(),
  answerMatches: integer("answer_matches", { mode: "boolean" }).notNull().default(false),
  contextMatched: integer("context_matched", { mode: "boolean" }).notNull().default(false),
  delayedRecall: integer("delayed_recall", { mode: "boolean" }).notNull().default(false),
  restartedWithoutConfusion: integer("restarted_without_confusion", { mode: "boolean" }).notNull().default(false),
  transferDemonstrated: integer("transfer_demonstrated", { mode: "boolean" }).notNull().default(false),
  errorCode: text("error_code").notNull().default("none"),
  confusionCode: text("confusion_code").notNull().default("none"),
  recallDelaySeconds: integer("recall_delay_seconds").notNull().default(0),
  responseTimeMs: integer("response_time_ms").notNull().default(0),
  resultingState: text("resulting_state").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("learning_attempts_user_idx").on(table.userId), index("learning_attempts_objective_idx").on(table.objectiveId), index("learning_attempts_question_idx").on(table.questionId)]);

export const learningReminders = sqliteTable("learning_reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  objectiveId: text("objective_id").notNull().references(() => learningObjectives.id),
  attemptId: text("attempt_id").notNull().references(() => learningAttempts.id),
  cadence: text("cadence").notNull(),
  dueAt: text("due_at").notNull(),
  status: text("status").notNull().default("scheduled"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
}, (table) => [index("learning_reminders_user_due_idx").on(table.userId, table.dueAt), index("learning_reminders_objective_idx").on(table.objectiveId)]);

export const teachCheckpoints = sqliteTable("teach_checkpoints", {
  userId: text("user_id").primaryKey().references(() => users.id),
  lessonId: text("lesson_id").notNull().references(() => teachLessons.id),
  objectiveId: text("objective_id").references(() => learningObjectives.id),
  questionId: text("question_id").references(() => learningQuestions.id),
  masteryState: text("mastery_state").notNull().default("new"),
  assistanceLevel: text("assistance_level").notNull().default("wait"),
  phase: text("phase").notNull().default("attempt"),
  sessionElapsedSeconds: integer("session_elapsed_seconds").notNull().default(0),
  nextReviewAt: text("next_review_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const strengthObservations = sqliteTable("strength_observations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  statement: text("statement").notNull(),
  evidence: text("evidence").notNull(),
  contradiction: text("contradiction").notNull().default(""),
  learnerCorrection: text("learner_correction").notNull().default(""),
  confidenceBasisPoints: integer("confidence_basis_points").notNull().default(0),
  sourceKind: text("source_kind").notNull(),
  status: text("status").notNull().default("pending_student_review"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("strength_observations_user_idx").on(table.userId), index("strength_observations_status_idx").on(table.status)]);

export const algoquestLearningEvents = sqliteTable("algoquest_learning_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(),
  artifactRef: text("artifact_ref").notNull(),
  purpose: text("purpose").notNull(),
  payload: text("payload").notNull().default("{}"),
  idempotencyKey: text("idempotency_key").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("algoquest_events_user_idx").on(table.userId), uniqueIndex("algoquest_events_idempotency_idx").on(table.userId, table.idempotencyKey)]);

/** The personal assistant graph is private to its owner; other assistants receive projections only. */
export const teachAssistantGraphRecords = sqliteTable("teach_assistant_graph_records", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  recordKind: text("record_kind").notNull(),
  subjectRef: text("subject_ref").notNull(),
  summary: text("summary").notNull(),
  provenanceRef: text("provenance_ref").notNull(),
  status: text("status").notNull().default("active"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_assistant_graph_user_idx").on(table.userId), index("teach_assistant_graph_status_idx").on(table.userId, table.status)]);

/** Cross-assistant records contain bounded projections and an auditable receipt, never the private graph. */
export const teachAssistantExchanges = sqliteTable("teach_assistant_exchanges", {
  id: text("id").primaryKey(),
  senderUserId: text("sender_user_id").notNull().references(() => users.id),
  recipientUserId: text("recipient_user_id").notNull().references(() => users.id),
  courseId: text("course_id").notNull().references(() => teachCourses.id),
  senderRole: text("sender_role").notNull(),
  recipientRole: text("recipient_role").notNull(),
  purpose: text("purpose").notNull(),
  projection: text("projection").notNull(),
  consentReceiptId: text("consent_receipt_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  expiresAt: text("expires_at").notNull(),
  status: text("status").notNull().default("prepared"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  receivedAt: text("received_at"),
}, (table) => [
  index("teach_assistant_exchange_sender_idx").on(table.senderUserId, table.createdAt),
  index("teach_assistant_exchange_recipient_idx").on(table.recipientUserId, table.expiresAt),
  uniqueIndex("teach_assistant_exchange_idempotency_idx").on(table.senderUserId, table.idempotencyKey),
]);

export const teachWeeklyObjectives = sqliteTable("teach_weekly_objectives", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  schoolYear: text("school_year").notNull(),
  weekStart: text("week_start").notNull(),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull().default("planned"),
  evidenceRefs: text("evidence_refs").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_weekly_objectives_user_week_idx").on(table.userId, table.weekStart)]);

export const teachInterventionPreferences = sqliteTable("teach_intervention_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id),
  frequency: text("frequency").notNull().default("off"),
  contexts: text("contexts").notNull().default("[]"),
  quietMode: integer("quiet_mode", { mode: "boolean" }).notNull().default(true),
  quietUntil: text("quiet_until"),
  maxDailyInterventions: integer("max_daily_interventions").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const growthStories = sqliteTable("growth_stories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  publicationId: text("publication_id").references(() => publications.id),
  domain: text("domain").notNull(),
  title: text("title").notNull(),
  context: text("context").notNull().default(""),
  reflection: text("reflection").notNull(),
  originalExpression: text("original_expression").notNull().default(""),
  suggestedReframe: text("suggested_reframe").notNull().default(""),
  reframeChoice: text("reframe_choice").notNull().default("keep_original"),
  evidenceRef: text("evidence_ref").notNull().default(""),
  evidenceKind: text("evidence_kind").notNull().default("other"),
  evidenceStatus: text("evidence_status").notNull().default("self_reported"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("growth_stories_user_idx").on(table.userId), index("growth_stories_publication_idx").on(table.publicationId)]);

export const teachProjectThreads = sqliteTable("teach_project_threads", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  circleId: text("circle_id"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("active"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_project_threads_owner_idx").on(table.ownerUserId, table.updatedAt), index("teach_project_threads_circle_idx").on(table.circleId)]);

export const teachProjectEntries = sqliteTable("teach_project_entries", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => teachProjectThreads.id),
  contributorUserId: text("contributor_user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  reflection: text("reflection").notNull().default(""),
  reference: text("reference").notNull().default(""),
  status: text("status").notNull().default("active"),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_project_entries_project_idx").on(table.projectId, table.occurredAt), index("teach_project_entries_contributor_idx").on(table.contributorUserId)]);

export const teachCircles = sqliteTable("teach_circles", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull().references(() => users.id),
  organizationId: text("organization_id").references(() => organizations.id),
  courseId: text("course_id").references(() => teachCourses.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  visibility: text("visibility").notNull().default("private"),
  membershipMode: text("membership_mode").notNull().default("invite_only"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_circles_owner_idx").on(table.ownerUserId), index("teach_circles_organization_idx").on(table.organizationId)]);

export const teachCircleMemberships = sqliteTable("teach_circle_memberships", {
  id: text("id").primaryKey(),
  circleId: text("circle_id").notNull().references(() => teachCircles.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_circle_memberships_user_idx").on(table.userId), uniqueIndex("teach_circle_memberships_unique_idx").on(table.circleId, table.userId)]);

export const teachRecognitions = sqliteTable("teach_recognitions", {
  id: text("id").primaryKey(),
  issuerUserId: text("issuer_user_id").notNull().references(() => users.id),
  recipientUserId: text("recipient_user_id").notNull().references(() => users.id),
  circleId: text("circle_id").references(() => teachCircles.id),
  category: text("category").notNull(),
  statement: text("statement").notNull(),
  context: text("context").notNull().default(""),
  evidenceRef: text("evidence_ref").notNull(),
  status: text("status").notNull().default("pending_recipient_review"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
}, (table) => [index("teach_recognitions_recipient_idx").on(table.recipientUserId, table.createdAt), index("teach_recognitions_circle_idx").on(table.circleId)]);

export const teachRecaps = sqliteTable("teach_recaps", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  period: text("period").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_recaps_user_period_idx").on(table.userId, table.period, table.periodStart), uniqueIndex("teach_recaps_unique_idx").on(table.userId, table.period, table.periodStart, table.periodEnd)]);

export const teachOrganizationScopes = sqliteTable("teach_organization_scopes", {
  id: text("id").primaryKey(),
  parentOrganizationId: text("parent_organization_id").notNull().references(() => organizations.id),
  childOrganizationId: text("child_organization_id").notNull().references(() => organizations.id),
  kind: text("kind").notNull().default("commission_school"),
  status: text("status").notNull().default("active"),
  validFrom: text("valid_from").notNull(),
  validUntil: text("valid_until"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_organization_scopes_parent_idx").on(table.parentOrganizationId), uniqueIndex("teach_organization_scopes_unique_idx").on(table.parentOrganizationId, table.childOrganizationId, table.kind)]);

export const teachMediaRequests = sqliteTable("teach_media_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(),
  sourceRef: text("source_ref").notNull(),
  sourceKind: text("source_kind").notNull().default("lesson"),
  sourceTitle: text("source_title").notNull().default(""),
  sourceContextDigest: text("source_context_digest").notNull().default(""),
  evidenceRefs: text("evidence_refs").notNull().default("[]"),
  sourceIds: text("source_ids").notNull().default("[]"),
  scriptDigest: text("script_digest").notNull().default(""),
  providerLimitSource: text("provider_limit_source").notNull().default("scholarium_conservative_fallback"),
  durationMinutes: integer("duration_minutes").notNull(),
  manifestExpiresAt: text("manifest_expires_at"),
  manifestDigest: text("manifest_digest").notNull().default(""),
  status: text("status").notNull().default("prepared"),
  requestedDay: text("requested_day").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_media_requests_quota_idx").on(table.userId, table.kind, table.requestedDay)]);

export const teachMediaPublicationConfirmations = sqliteTable("teach_media_publication_confirmations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  mediaRequestId: text("media_request_id").notNull().references(() => teachMediaRequests.id),
  destination: text("destination").notNull(),
  artifactDigest: text("artifact_digest").notNull(),
  status: text("status").notNull().default("confirmed"),
  confirmedAt: text("confirmed_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("teach_media_publication_user_idx").on(table.userId, table.createdAt),
  uniqueIndex("teach_media_publication_once_idx").on(table.mediaRequestId, table.destination, table.artifactDigest),
]);

/** Durable Gate5 outbox. The stored envelope is pseudonymized before insertion. */
export const teachGate5Jobs = sqliteTable("teach_gate5_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  target: text("target").notNull(),
  capability: text("capability").notNull(),
  requestDigest: text("request_digest").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  nonce: text("nonce").notNull(),
  envelope: text("envelope").notNull(),
  status: text("status").notNull().default("pending"),
  receiptDigest: text("receipt_digest").notNull().default(""),
  receiptSignature: text("receipt_signature").notNull().default(""),
  receiptKeyFingerprint: text("receipt_key_fingerprint").notNull().default(""),
  expiresAt: text("expires_at").notNull(),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("teach_gate5_jobs_target_status_idx").on(table.target, table.status, table.expiresAt),
  index("teach_gate5_jobs_user_idx").on(table.userId, table.createdAt),
  uniqueIndex("teach_gate5_jobs_idempotency_idx").on(table.userId, table.idempotencyKey),
  uniqueIndex("teach_gate5_jobs_nonce_idx").on(table.target, table.nonce),
]);

/** Purpose consent is separate from provider authorization and can be revoked independently. */
export const teachPurposeConsents = sqliteTable("teach_purpose_consents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("granted"),
  consentVersion: text("consent_version").notNull().default("teach-v1"),
  expiresAt: text("expires_at"),
  grantedAt: text("granted_at").notNull(),
  revokedAt: text("revoked_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("teach_consents_user_idx").on(table.userId), uniqueIndex("teach_consents_purpose_idx").on(table.userId, table.purpose)]);
