CREATE TABLE `live_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `publication_id` text,
  `title` text NOT NULL,
  `agenda` text NOT NULL DEFAULT '',
  `scheduled_at` text NOT NULL,
  `audience_mode` text NOT NULL DEFAULT 'public_review',
  `moderator_plan` text NOT NULL DEFAULT 'author_moderated',
  `youth_mode` text NOT NULL DEFAULT 'restricted_until_consent',
  `status` text NOT NULL DEFAULT 'planned',
  `replay_consent` integer NOT NULL DEFAULT false,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `live_sessions_user_idx` ON `live_sessions` (`user_id`);
CREATE INDEX `live_sessions_publication_idx` ON `live_sessions` (`publication_id`);
CREATE INDEX `live_sessions_scheduled_idx` ON `live_sessions` (`scheduled_at`);
