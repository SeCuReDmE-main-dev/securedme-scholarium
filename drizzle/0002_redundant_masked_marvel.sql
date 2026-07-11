CREATE TABLE `external_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`display_name` text,
	`profile_url` text,
	`verified_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `external_identities_user_idx` ON `external_identities` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `external_identities_provider_subject_idx` ON `external_identities` (`provider`,`external_id`);--> statement-breakpoint
CREATE TABLE `integration_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'disconnected' NOT NULL,
	`scopes` text DEFAULT '[]' NOT NULL,
	`token_vault_ref` text,
	`expires_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `integration_connections_user_idx` ON `integration_connections` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `integration_connections_provider_idx` ON `integration_connections` (`user_id`,`provider`);