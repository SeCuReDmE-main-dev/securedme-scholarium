CREATE TABLE `project_starter_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `publication_id` text NOT NULL,
  `source_provider` text NOT NULL,
  `source_repository_url` text NOT NULL,
  `source_repository_path` text NOT NULL,
  `target_provider` text DEFAULT 'github' NOT NULL,
  `target_visibility` text DEFAULT 'private' NOT NULL,
  `target_repository_name` text NOT NULL,
  `license_status` text DEFAULT 'requires_review' NOT NULL,
  `provenance_manifest_status` text DEFAULT 'required' NOT NULL,
  `status` text DEFAULT 'provider_auth_required' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `project_starter_requests_user_idx` ON `project_starter_requests` (`user_id`);
CREATE INDEX `project_starter_requests_publication_idx` ON `project_starter_requests` (`publication_id`);
CREATE UNIQUE INDEX `project_starter_requests_unique_idx` ON `project_starter_requests` (`user_id`, `publication_id`, `source_provider`, `source_repository_path`);
