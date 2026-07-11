CREATE TABLE `payment_receipts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `provider` text NOT NULL,
  `provider_order_id` text NOT NULL,
  `provider_capture_id` text,
  `amount_cents` integer NOT NULL,
  `currency` text NOT NULL,
  `status` text NOT NULL DEFAULT 'created',
  `provider_event_id` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `payment_receipts_user_idx` ON `payment_receipts` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_provider_order_idx` ON `payment_receipts` (`provider`,`provider_order_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_provider_event_idx` ON `payment_receipts` (`provider`,`provider_event_id`);
