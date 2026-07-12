CREATE TABLE `reader_preferences` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `users`(`id`),
  `keyboard_first` integer NOT NULL DEFAULT 1,
  `reduced_motion` integer NOT NULL DEFAULT 0,
  `screen_reader_optimized` integer NOT NULL DEFAULT 0,
  `notification_channels` text NOT NULL DEFAULT '["in_app"]',
  `digest_cadence` text NOT NULL DEFAULT 'off',
  `topic_alerts` integer NOT NULL DEFAULT 1,
  `moderation_alerts` integer NOT NULL DEFAULT 1,
  `interface_language` text NOT NULL DEFAULT 'en',
  `show_original_first` integer NOT NULL DEFAULT 1,
  `allow_publication_translation` integer NOT NULL DEFAULT 0,
  `glossary_terms` text NOT NULL DEFAULT '[]',
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
