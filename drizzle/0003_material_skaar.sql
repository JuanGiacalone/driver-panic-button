ALTER TABLE `users` MODIFY COLUMN `name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email` varchar(100) NOT NULL;