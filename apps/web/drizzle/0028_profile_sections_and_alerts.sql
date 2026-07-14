CREATE TABLE `profile_sections` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `section_kind` text NOT NULL,
  `title` text NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `visibility` text DEFAULT 'private' NOT NULL,
  `display_order` integer DEFAULT 0 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `profile_sections_user_idx` ON `profile_sections` (`user_id`);
CREATE INDEX `profile_sections_user_visibility_idx` ON `profile_sections` (`user_id`, `visibility`);

CREATE TABLE `search_alerts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `label` text NOT NULL,
  `query` text DEFAULT '' NOT NULL,
  `topic_slugs` text DEFAULT '[]' NOT NULL,
  `cadence` text DEFAULT 'weekly' NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `search_alerts_user_idx` ON `search_alerts` (`user_id`);

CREATE TABLE `citation_alerts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `publication_id` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `citation_alerts_user_idx` ON `citation_alerts` (`user_id`);
CREATE INDEX `citation_alerts_publication_idx` ON `citation_alerts` (`publication_id`);
CREATE UNIQUE INDEX `citation_alerts_user_publication_idx` ON `citation_alerts` (`user_id`, `publication_id`);
