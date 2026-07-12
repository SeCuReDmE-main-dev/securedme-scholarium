CREATE TABLE `academia_migrations` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `source_profile_url` text NOT NULL,
  `ownership_confirmed_at` text NOT NULL,
  `state` text NOT NULL DEFAULT 'review',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `academia_migrations_user_idx` ON `academia_migrations` (`user_id`);
--> statement-breakpoint
CREATE TABLE `academia_migration_items` (
  `id` text PRIMARY KEY NOT NULL,
  `migration_id` text NOT NULL REFERENCES `academia_migrations`(`id`),
  `source_url` text NOT NULL,
  `title` text NOT NULL,
  `abstract` text NOT NULL DEFAULT '',
  `type` text NOT NULL DEFAULT 'research_article',
  `topic_slugs` text NOT NULL DEFAULT '[]',
  `selected` integer NOT NULL DEFAULT 1,
  `visibility` text NOT NULL DEFAULT 'private',
  `status` text NOT NULL DEFAULT 'pending',
  `imported_publication_id` text REFERENCES `publications`(`id`),
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `academia_migration_items_migration_idx` ON `academia_migration_items` (`migration_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `academia_migration_items_source_idx` ON `academia_migration_items` (`migration_id`,`source_url`);
