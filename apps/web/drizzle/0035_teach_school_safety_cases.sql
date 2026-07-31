CREATE TABLE `teach_school_safety_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`version` text NOT NULL,
	`status` text DEFAULT 'inactive' NOT NULL,
	`data_mode` text DEFAULT 'synthetic_only' NOT NULL,
	`urgent_minutes` integer DEFAULT 60 NOT NULL,
	`high_minutes` integer DEFAULT 240 NOT NULL,
	`standard_minutes` integer DEFAULT 1440 NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`notification_policy` text DEFAULT '{"channels":["in_app"],"age_adapted":true}' NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`activated_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_policy_version_idx` ON `teach_school_safety_policies` (`organization_id`,`version`);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_policy_status_idx` ON `teach_school_safety_policies` (`organization_id`,`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_policy_active_idx` ON `teach_school_safety_policies` (`organization_id`) WHERE `status` = 'active';
--> statement-breakpoint
CREATE TABLE `teach_school_safety_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`kind` text DEFAULT 'initial_report' NOT NULL,
	`content` text NOT NULL,
	`content_sha256` text NOT NULL,
	`content_type` text DEFAULT 'text/plain' NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_evidence_org_idx` ON `teach_school_safety_evidence` (`organization_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `teach_school_safety_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`reporter_user_id` text NOT NULL,
	`reporter_role` text NOT NULL,
	`evidence_id` text NOT NULL,
	`source_report_id` text,
	`subject_type` text NOT NULL,
	`subject_id` text,
	`category` text NOT NULL,
	`proposed_severity` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`policy_version` text NOT NULL,
	`assigned_admin_user_id` text,
	`resolution_code` text,
	`telemetry_status` text DEFAULT 'disabled' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`resolved_at` text,
	`closed_at` text,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reporter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidence_id`) REFERENCES `teach_school_safety_evidence`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_report_id`) REFERENCES `interaction_reports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_case_evidence_idx` ON `teach_school_safety_cases` (`evidence_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_case_source_report_idx` ON `teach_school_safety_cases` (`source_report_id`);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_case_reporter_idx` ON `teach_school_safety_cases` (`reporter_user_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_case_queue_idx` ON `teach_school_safety_cases` (`organization_id`,`status`,`proposed_severity`,`created_at`);
--> statement-breakpoint
CREATE TABLE `teach_school_safety_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`admin_user_id` text NOT NULL,
	`assigned_by_user_id` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`released_at` text,
	FOREIGN KEY (`case_id`) REFERENCES `teach_school_safety_cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_assignment_case_idx` ON `teach_school_safety_assignments` (`case_id`,`active`,`created_at`);
--> statement-breakpoint
CREATE TABLE `teach_school_safety_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`actor_user_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`from_state` text,
	`to_state` text NOT NULL,
	`rationale_code` text NOT NULL,
	`rationale_digest` text NOT NULL,
	`previous_hash` text NOT NULL,
	`event_hash` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `teach_school_safety_cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_event_sequence_idx` ON `teach_school_safety_events` (`case_id`,`sequence`);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_event_idempotency_idx` ON `teach_school_safety_events` (`case_id`,`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_event_case_idx` ON `teach_school_safety_events` (`case_id`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER `teach_school_safety_events_no_update` BEFORE UPDATE ON `teach_school_safety_events` BEGIN SELECT RAISE(ABORT, 'school safety events are append-only'); END;
--> statement-breakpoint
CREATE TRIGGER `teach_school_safety_events_no_delete` BEFORE DELETE ON `teach_school_safety_events` BEGIN SELECT RAISE(ABORT, 'school safety events are append-only'); END;
--> statement-breakpoint
CREATE TABLE `teach_school_safety_appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`appellant_user_id` text NOT NULL,
	`reviewer_user_id` text,
	`evidence_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`outcome_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`case_id`) REFERENCES `teach_school_safety_cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appellant_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`evidence_id`) REFERENCES `teach_school_safety_evidence`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_appeal_pending_idx` ON `teach_school_safety_appeals` (`case_id`) WHERE `status` = 'pending';
--> statement-breakpoint
CREATE INDEX `teach_school_safety_appeal_reviewer_idx` ON `teach_school_safety_appeals` (`reviewer_user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `teach_school_safety_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`event_id` text NOT NULL,
	`operation` text NOT NULL,
	`redacted_payload` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`status` text DEFAULT 'disabled' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text,
	`external_case_id` text,
	`last_error_code` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`case_id`) REFERENCES `teach_school_safety_cases`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `teach_school_safety_events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teach_school_safety_outbox_idempotency_idx` ON `teach_school_safety_outbox` (`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `teach_school_safety_outbox_status_idx` ON `teach_school_safety_outbox` (`status`,`next_attempt_at`,`created_at`);
