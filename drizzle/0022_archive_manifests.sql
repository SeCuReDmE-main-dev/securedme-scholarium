CREATE TABLE `archive_manifests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `publication_id` text REFERENCES `publications`(`id`),
  `provider` text NOT NULL,
  `provider_path` text NOT NULL,
  `object_count` integer NOT NULL DEFAULT 0,
  `status` text NOT NULL DEFAULT 'planned',
  `last_verified_at` text,
  `restore_requested_at` text,
  `resync_requested_at` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `archive_manifests_user_idx` ON `archive_manifests` (`user_id`);
--> statement-breakpoint
CREATE INDEX `archive_manifests_publication_idx` ON `archive_manifests` (`publication_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `archive_manifests_provider_path_idx` ON `archive_manifests` (`user_id`, `provider`, `provider_path`);
