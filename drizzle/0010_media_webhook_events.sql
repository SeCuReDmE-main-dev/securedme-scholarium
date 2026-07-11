CREATE TABLE `media_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`external_event_id` text NOT NULL,
	`external_subject_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_hash` text NOT NULL,
	`delivery_status` text DEFAULT 'recorded' NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `media_webhook_events_user_idx` ON `media_webhook_events` (`user_id`);
--> statement-breakpoint
CREATE INDEX `media_webhook_events_subject_idx` ON `media_webhook_events` (`provider`,`external_subject_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_webhook_events_delivery_idx` ON `media_webhook_events` (`provider`,`external_event_id`,`payload_hash`);
