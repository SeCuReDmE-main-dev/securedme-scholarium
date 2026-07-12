CREATE TABLE `guardian_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`minor_user_id` text NOT NULL,
	`guardian_user_id` text NOT NULL,
	`scope` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`minor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guardian_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `guardian_consents_minor_idx` ON `guardian_consents` (`minor_user_id`);--> statement-breakpoint
CREATE INDEX `guardian_consents_guardian_idx` ON `guardian_consents` (`guardian_user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `role_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`role` text NOT NULL,
	`age_band` text DEFAULT 'unknown' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `role_assignments_user_idx` ON `role_assignments` (`user_id`);--> statement-breakpoint
CREATE INDEX `role_assignments_org_idx` ON `role_assignments` (`organization_id`);