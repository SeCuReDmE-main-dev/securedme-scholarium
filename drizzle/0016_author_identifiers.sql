CREATE TABLE `author_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scheme` text NOT NULL,
	`identifier` text NOT NULL,
	`canonical_url` text NOT NULL,
	`status` text DEFAULT 'claimed' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `author_identifiers_user_idx` ON `author_identifiers` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `author_identifiers_user_scheme_idx` ON `author_identifiers` (`user_id`,`scheme`);
--> statement-breakpoint
