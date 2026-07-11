CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`kind` text DEFAULT 'collection' NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `collections_user_idx` ON `collections` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_user_title_idx` ON `collections` (`user_id`,`title`);
--> statement-breakpoint
CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`publication_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `collection_items_collection_idx` ON `collection_items` (`collection_id`);
--> statement-breakpoint
CREATE INDEX `collection_items_publication_idx` ON `collection_items` (`publication_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `collection_items_unique_idx` ON `collection_items` (`collection_id`,`publication_id`);
