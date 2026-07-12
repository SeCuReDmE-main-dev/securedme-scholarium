CREATE TABLE `repository_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`provider` text NOT NULL,
	`canonical_url` text NOT NULL,
	`repository_path` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `repository_links_publication_idx` ON `repository_links` (`publication_id`);
--> statement-breakpoint
CREATE INDEX `repository_links_user_idx` ON `repository_links` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `repository_links_publication_provider_path_idx` ON `repository_links` (`publication_id`,`provider`,`repository_path`);
