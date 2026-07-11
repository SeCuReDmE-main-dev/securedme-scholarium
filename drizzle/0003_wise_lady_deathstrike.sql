CREATE TABLE `profile_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar_object_key` text,
	`banner_object_key` text,
	`color_scheme` text DEFAULT 'scholarium-dark' NOT NULL,
	`accent_color` text DEFAULT '#2157ee' NOT NULL,
	`badge_visibility` text DEFAULT 'public' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `profile_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'unverified' NOT NULL,
	`document_provider` text,
	`document_session_ref` text,
	`passkey_verified_at` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `profile_verifications_user_idx` ON `profile_verifications` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profile_verifications_user_unique_idx` ON `profile_verifications` (`user_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text DEFAULT 'verified_contributor' NOT NULL,
	`monthly_cents` integer DEFAULT 99 NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`payment_provider` text,
	`provider_subscription_ref` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_plan_idx` ON `subscriptions` (`user_id`,`plan`);