ALTER TABLE `publication_versions` ADD `title` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `publication_versions` ADD `abstract` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE `publication_versions`
SET `title` = COALESCE((SELECT `title` FROM `publications` WHERE `publications`.`id` = `publication_versions`.`publication_id`), ''),
    `abstract` = COALESCE((SELECT `abstract` FROM `publications` WHERE `publications`.`id` = `publication_versions`.`publication_id`), '');
