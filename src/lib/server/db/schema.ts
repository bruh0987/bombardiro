import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const rooms = sqliteTable('rooms', {
	id: text('id').primaryKey(), // 4-letter code
	status: text('status', { enum: ['LOBBY', 'PLAYING', 'ENDED'] }).default('LOBBY').notNull(),
	seed: text('seed').notNull(), // For procedural generation
	timeLimit: integer('time_limit').default(300).notNull(), // 5 minutes default
	startTime: integer('start_time', { mode: 'timestamp' }),
	moduleConfig: text('module_config', { mode: 'json' }), // JSON blob for bomb/manual layout
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const players = sqliteTable('players', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	roomId: text('room_id').references(() => rooms.id).notNull(),
	name: text('name').notNull(),
	role: text('role', { enum: ['HOST', 'JOINER'] }).notNull(), // HOST or JOINER
	gameRole: text('game_role', { enum: ['DEFUSER', 'EXPERT', 'NONE'] }).default('NONE'), // Assigned in lobby
	socketId: text('socket_id'), // To map websocket connections
	joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
