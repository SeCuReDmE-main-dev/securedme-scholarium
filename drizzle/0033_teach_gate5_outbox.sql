CREATE TABLE `teach_gate5_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target` text NOT NULL,
	`capability` text NOT NULL,
	`request_digest` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`nonce` text NOT NULL,
	`envelope` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`receipt_digest` text DEFAULT '' NOT NULL,
	`receipt_signature` text DEFAULT '' NOT NULL,
	`receipt_key_fingerprint` text DEFAULT '' NOT NULL,
	`expires_at` text NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teach_gate5_jobs_target_status_idx` ON `teach_gate5_jobs` (`target`,`status`,`expires_at`);
--> statement-breakpoint
CREATE INDEX `teach_gate5_jobs_user_idx` ON `teach_gate5_jobs` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_gate5_jobs_idempotency_idx` ON `teach_gate5_jobs` (`user_id`,`idempotency_key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_gate5_jobs_nonce_idx` ON `teach_gate5_jobs` (`target`,`nonce`);
