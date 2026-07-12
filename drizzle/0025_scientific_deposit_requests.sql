CREATE TABLE `scientific_deposit_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `publication_id` text,
  `provider` text NOT NULL DEFAULT 'zenodo',
  `title` text NOT NULL,
  `license` text NOT NULL DEFAULT 'cc-by-4.0',
  `metadata` text NOT NULL DEFAULT '{}',
  `status` text NOT NULL DEFAULT 'draft',
  `irreversible_confirmed_at` text,
  `provider_draft_ref` text,
  `doi` text,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `scientific_deposit_requests_user_idx` ON `scientific_deposit_requests` (`user_id`);
CREATE INDEX `scientific_deposit_requests_publication_idx` ON `scientific_deposit_requests` (`publication_id`);
CREATE INDEX `scientific_deposit_requests_provider_idx` ON `scientific_deposit_requests` (`provider`);
