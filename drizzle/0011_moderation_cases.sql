CREATE TABLE `moderation_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`source` text NOT NULL,
	`reason_code` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` text,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `moderation_cases_publication_idx` ON `moderation_cases` (`publication_id`);
--> statement-breakpoint
CREATE INDEX `moderation_cases_status_idx` ON `moderation_cases` (`status`);
