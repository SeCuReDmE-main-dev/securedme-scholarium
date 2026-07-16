ALTER TABLE `teach_media_requests` ADD `source_kind` text DEFAULT 'lesson' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `source_title` text DEFAULT '' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `source_context_digest` text DEFAULT '' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `evidence_refs` text DEFAULT '[]' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `source_ids` text DEFAULT '[]' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `script_digest` text DEFAULT '' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `provider_limit_source` text DEFAULT 'scholarium_conservative_fallback' NOT NULL;
ALTER TABLE `teach_media_requests` ADD `manifest_expires_at` text;
ALTER TABLE `teach_media_requests` ADD `manifest_digest` text DEFAULT '' NOT NULL;

CREATE TABLE `teach_media_publication_confirmations` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `media_request_id` text NOT NULL,
  `destination` text NOT NULL,
  `artifact_digest` text NOT NULL,
  `status` text DEFAULT 'confirmed' NOT NULL,
  `confirmed_at` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`media_request_id`) REFERENCES `teach_media_requests`(`id`)
);
CREATE INDEX `teach_media_publication_user_idx` ON `teach_media_publication_confirmations` (`user_id`,`created_at`);
CREATE UNIQUE INDEX `teach_media_publication_once_idx` ON `teach_media_publication_confirmations` (`media_request_id`,`destination`,`artifact_digest`);
