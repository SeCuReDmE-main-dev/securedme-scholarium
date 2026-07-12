CREATE TABLE `quantech_render_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`),
  `provider` text NOT NULL DEFAULT 'QuaNTecH-ViD',
  `status` text NOT NULL DEFAULT 'prepared',
  `aspect` text NOT NULL,
  `quality_preset` text NOT NULL,
  `review_mode` text NOT NULL DEFAULT 'none',
  `entitlement_status` text NOT NULL,
  `script_digest` text NOT NULL,
  `source_url_count` integer NOT NULL DEFAULT 0,
  `handoff_url` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `quantech_render_requests_user_idx` ON `quantech_render_requests` (`user_id`);
--> statement-breakpoint
CREATE INDEX `quantech_render_requests_created_idx` ON `quantech_render_requests` (`created_at`);
