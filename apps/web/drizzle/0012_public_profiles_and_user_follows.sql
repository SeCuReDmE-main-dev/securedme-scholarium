CREATE TABLE `public_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`public_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_profiles_public_id_idx` ON `public_profiles` (`public_id`);
--> statement-breakpoint
CREATE TABLE `user_follows` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target_user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `user_follows_user_idx` ON `user_follows` (`user_id`);
--> statement-breakpoint
CREATE INDEX `user_follows_target_idx` ON `user_follows` (`target_user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_follows_unique_idx` ON `user_follows` (`user_id`,`target_user_id`);
