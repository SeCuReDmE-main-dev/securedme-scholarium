CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`archive_status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `artifacts_publication_idx` ON `artifacts` (`publication_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `artifacts_object_key_idx` ON `artifacts` (`object_key`);--> statement-breakpoint
CREATE TABLE `publication_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`version` integer NOT NULL,
	`content_hash` text NOT NULL,
	`provenance_receipt` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_versions_unique_idx` ON `publication_versions` (`publication_id`,`version`);--> statement-breakpoint
CREATE TABLE `publications` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`abstract` text NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`verification_status` text DEFAULT 'processing' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `publications_author_idx` ON `publications` (`author_id`);--> statement-breakpoint
CREATE INDEX `publications_status_idx` ON `publications` (`verification_status`);--> statement-breakpoint
CREATE TABLE `ranking_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`relevance_weight` integer DEFAULT 78 NOT NULL,
	`freshness_weight` integer DEFAULT 52 NOT NULL,
	`diversity_weight` integer DEFAULT 66 NOT NULL,
	`personalized` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`primary_role` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);