CREATE TABLE `funding_campaigns` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `publication_id` text,
  `title` text NOT NULL,
  `purpose` text NOT NULL DEFAULT '',
  `goal_cents` integer NOT NULL,
  `currency` text NOT NULL DEFAULT 'USD',
  `deadline_at` text,
  `beneficiary_status` text NOT NULL DEFAULT 'verification_required',
  `public_progress` integer NOT NULL DEFAULT false,
  `status` text NOT NULL DEFAULT 'draft',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `funding_campaigns_user_idx` ON `funding_campaigns` (`user_id`);
CREATE INDEX `funding_campaigns_publication_idx` ON `funding_campaigns` (`publication_id`);
CREATE INDEX `funding_campaigns_status_idx` ON `funding_campaigns` (`status`);

CREATE TABLE `contribution_intents` (
  `id` text PRIMARY KEY NOT NULL,
  `campaign_id` text NOT NULL,
  `contributor_id` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `currency` text NOT NULL DEFAULT 'USD',
  `provider` text NOT NULL,
  `status` text NOT NULL DEFAULT 'provider_setup_required',
  `anonymous` integer NOT NULL DEFAULT false,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `funding_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`contributor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `contribution_intents_campaign_idx` ON `contribution_intents` (`campaign_id`);
CREATE INDEX `contribution_intents_contributor_idx` ON `contribution_intents` (`contributor_id`);
