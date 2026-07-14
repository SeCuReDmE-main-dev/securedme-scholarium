CREATE TABLE `provider_consents` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `provider` text NOT NULL,
  `scopes` text DEFAULT '[]' NOT NULL,
  `consent_version` text DEFAULT 'v1' NOT NULL,
  `status` text DEFAULT 'granted' NOT NULL,
  `granted_at` text,
  `revoked_at` text,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `provider_consents_user_idx` ON `provider_consents` (`user_id`);
CREATE UNIQUE INDEX `provider_consents_user_provider_idx` ON `provider_consents` (`user_id`, `provider`);

CREATE TABLE `webauth_handoff_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `provider` text NOT NULL,
  `purpose` text NOT NULL,
  `context_kind` text DEFAULT 'none' NOT NULL,
  `context_reference` text,
  `status` text DEFAULT 'provider_auth_required' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE INDEX `webauth_handoff_requests_user_idx` ON `webauth_handoff_requests` (`user_id`);
CREATE INDEX `webauth_handoff_requests_provider_idx` ON `webauth_handoff_requests` (`provider`);
CREATE INDEX `webauth_handoff_requests_created_idx` ON `webauth_handoff_requests` (`created_at`);
