CREATE TABLE `external_media_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`canonical_url` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `external_media_links_publication_idx` ON `external_media_links` (`publication_id`);
--> statement-breakpoint
CREATE INDEX `external_media_links_user_idx` ON `external_media_links` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_media_links_provider_external_idx` ON `external_media_links` (`provider`,`external_id`);
