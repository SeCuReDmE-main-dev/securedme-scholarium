CREATE TABLE `interaction_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`publication_id` text,
	`comment_id` text,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`comment_id`) REFERENCES `publication_comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `interaction_reports_reporter_idx` ON `interaction_reports` (`reporter_id`);--> statement-breakpoint
CREATE INDEX `interaction_reports_publication_idx` ON `interaction_reports` (`publication_id`);--> statement-breakpoint
CREATE INDEX `interaction_reports_comment_idx` ON `interaction_reports` (`comment_id`);--> statement-breakpoint
CREATE TABLE `publication_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_comment_id` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'visible' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_comment_id`) REFERENCES `publication_comments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `publication_comments_publication_idx` ON `publication_comments` (`publication_id`);--> statement-breakpoint
CREATE INDEX `publication_comments_author_idx` ON `publication_comments` (`author_id`);--> statement-breakpoint
CREATE INDEX `publication_comments_parent_idx` ON `publication_comments` (`parent_comment_id`);--> statement-breakpoint
CREATE TABLE `publication_reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`user_id` text NOT NULL,
	`kind` text DEFAULT 'insightful' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `publication_reactions_publication_idx` ON `publication_reactions` (`publication_id`);--> statement-breakpoint
CREATE INDEX `publication_reactions_user_idx` ON `publication_reactions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `publication_reactions_unique_idx` ON `publication_reactions` (`publication_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user_boundaries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_user_id` text NOT NULL,
	`kind` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_boundaries_user_idx` ON `user_boundaries` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_boundaries_target_idx` ON `user_boundaries` (`target_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_boundaries_unique_idx` ON `user_boundaries` (`user_id`,`target_user_id`,`kind`);