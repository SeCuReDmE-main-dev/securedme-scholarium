ALTER TABLE `teach_engine_attempts` ADD COLUMN `expected_checkpoint_digest` text NOT NULL DEFAULT '';
CREATE TRIGGER `teach_engine_attempt_checkpoint_guard`
BEFORE INSERT ON `teach_engine_attempts`
FOR EACH ROW
WHEN COALESCE((SELECT `checkpoint_digest` FROM `teach_engine_sessions` WHERE `id` = NEW.`session_id`), '') != NEW.`expected_checkpoint_digest`
BEGIN
  SELECT RAISE(ABORT, 'teach_engine_checkpoint_conflict');
END;

CREATE TABLE `teach_engine_privacy_consents` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `purpose` text NOT NULL,
  `status` text NOT NULL DEFAULT 'granted',
  `policy_version` text NOT NULL,
  `receipt_digest` text NOT NULL,
  `granted_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` text NOT NULL,
  `revoked_at` text,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);
CREATE INDEX `teach_engine_privacy_consents_user_idx` ON `teach_engine_privacy_consents` (`user_id`,`purpose`,`status`,`expires_at`);

CREATE TABLE `teach_engine_educator_assignments` (
  `id` text PRIMARY KEY NOT NULL,
  `educator_user_id` text NOT NULL,
  `learner_user_id` text NOT NULL,
  `status` text NOT NULL DEFAULT 'active',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` text,
  FOREIGN KEY (`educator_user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`learner_user_id`) REFERENCES `users`(`id`)
);
CREATE UNIQUE INDEX `teach_engine_educator_assignment_unique_idx` ON `teach_engine_educator_assignments` (`educator_user_id`,`learner_user_id`);
CREATE INDEX `teach_engine_educator_assignment_learner_idx` ON `teach_engine_educator_assignments` (`learner_user_id`,`status`);

CREATE TABLE `teach_engine_organization_aggregates` (
  `id` text PRIMARY KEY NOT NULL,
  `organization_scope` text NOT NULL,
  `metric_key` text NOT NULL,
  `time_bucket` text NOT NULL,
  `cohort_size` integer NOT NULL,
  `value_integer` integer NOT NULL,
  `source_window_digest` text NOT NULL,
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX `teach_engine_organization_aggregates_scope_idx` ON `teach_engine_organization_aggregates` (`organization_scope`,`metric_key`,`time_bucket`);
CREATE TRIGGER `teach_engine_organization_aggregate_k_guard`
BEFORE INSERT ON `teach_engine_organization_aggregates`
FOR EACH ROW
WHEN NEW.`cohort_size` < 10
BEGIN
  SELECT RAISE(ABORT, 'teach_engine_aggregate_k_anonymity_violation');
END;
