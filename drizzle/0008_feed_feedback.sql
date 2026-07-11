CREATE TABLE `feed_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`preference` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `feed_feedback_user_idx` ON `feed_feedback` (`user_id`);
--> statement-breakpoint
CREATE INDEX `feed_feedback_publication_idx` ON `feed_feedback` (`publication_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `feed_feedback_user_publication_idx` ON `feed_feedback` (`user_id`,`publication_id`);
