CREATE TABLE `teach_engine_sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `block_id` text NOT NULL,
  `block_version` text NOT NULL,
  `block_digest` text NOT NULL,
  `policy_digest` text NOT NULL,
  `checkpoint_json` text NOT NULL,
  `checkpoint_digest` text NOT NULL,
  `status` text DEFAULT 'active' NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `teach_engine_sessions_user_block_idx` ON `teach_engine_sessions` (`user_id`,`block_id`,`block_version`);
CREATE INDEX `teach_engine_sessions_user_idx` ON `teach_engine_sessions` (`user_id`);

CREATE TABLE `teach_engine_attempts` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `user_id` text NOT NULL,
  `idempotency_key` text NOT NULL,
  `request_digest` text NOT NULL,
  `node_id` text NOT NULL,
  `answer_redacted` text DEFAULT '[bounded evidence]' NOT NULL,
  `receipt_id` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `teach_engine_sessions`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `teach_engine_attempts_idempotency_idx` ON `teach_engine_attempts` (`session_id`,`idempotency_key`);
CREATE INDEX `teach_engine_attempts_user_idx` ON `teach_engine_attempts` (`user_id`);

CREATE TABLE `teach_engine_receipts` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `attempt_id` text NOT NULL,
  `receipt_json` text NOT NULL,
  `receipt_digest` text NOT NULL,
  `previous_checkpoint_digest` text NOT NULL,
  `next_checkpoint_digest` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `teach_engine_sessions`(`id`),
  FOREIGN KEY (`attempt_id`) REFERENCES `teach_engine_attempts`(`id`)
);
CREATE UNIQUE INDEX `teach_engine_receipts_attempt_idx` ON `teach_engine_receipts` (`attempt_id`);
CREATE INDEX `teach_engine_receipts_session_idx` ON `teach_engine_receipts` (`session_id`);

CREATE TABLE `teach_engine_outbox` (
  `id` text PRIMARY KEY NOT NULL,
  `session_id` text NOT NULL,
  `event_type` text NOT NULL,
  `payload_json` text NOT NULL,
  `payload_digest` text NOT NULL,
  `destination` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `next_attempt_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `delivered_at` text,
  FOREIGN KEY (`session_id`) REFERENCES `teach_engine_sessions`(`id`)
);
CREATE INDEX `teach_engine_outbox_delivery_idx` ON `teach_engine_outbox` (`destination`,`status`,`next_attempt_at`);
