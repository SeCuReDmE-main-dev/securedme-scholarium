CREATE TABLE `publication_relationships` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `publication_id` text NOT NULL REFERENCES `publications`(`id`),
  `relation_type` text NOT NULL,
  `source_url` text NOT NULL,
  `source_title` text,
  `source_license` text,
  `declaration` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `publication_relationships_publication_idx` ON `publication_relationships` (`publication_id`);
--> statement-breakpoint
CREATE INDEX `publication_relationships_user_idx` ON `publication_relationships` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_relationships_source_idx` ON `publication_relationships` (`publication_id`,`relation_type`,`source_url`);
