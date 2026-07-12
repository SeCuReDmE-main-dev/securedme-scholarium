CREATE TABLE `publication_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `publication_topics_publication_idx` ON `publication_topics` (`publication_id`);--> statement-breakpoint
CREATE INDEX `publication_topics_topic_idx` ON `publication_topics` (`topic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `publication_topics_unique_idx` ON `publication_topics` (`publication_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `topic_follows` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `topic_follows_user_idx` ON `topic_follows` (`user_id`);--> statement-breakpoint
CREATE INDEX `topic_follows_topic_idx` ON `topic_follows` (`topic_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `topic_follows_unique_idx` ON `topic_follows` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_idx` ON `topics` (`slug`);