CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`game_role` text DEFAULT 'NONE',
	`socket_id` text,
	`joined_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'LOBBY' NOT NULL,
	`seed` text NOT NULL,
	`time_limit` integer DEFAULT 300 NOT NULL,
	`start_time` integer,
	`module_config` text,
	`created_at` integer
);
