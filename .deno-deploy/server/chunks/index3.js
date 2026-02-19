import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { b as private_env } from "./shared-server.js";
const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  // 4-letter code
  status: text("status", { enum: ["LOBBY", "PLAYING", "ENDED"] }).default("LOBBY").notNull(),
  seed: text("seed").notNull(),
  // For procedural generation
  timeLimit: integer("time_limit").default(300).notNull(),
  // 5 minutes default
  startTime: integer("start_time", { mode: "timestamp" }),
  moduleConfig: text("module_config", { mode: "json" }),
  // JSON blob for bomb/manual layout
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const players = sqliteTable("players", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id").references(() => rooms.id).notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["HOST", "JOINER"] }).notNull(),
  // HOST or JOINER
  gameRole: text("game_role", { enum: ["DEFUSER", "EXPERT", "NONE"] }).default("NONE"),
  // Assigned in lobby
  socketId: text("socket_id"),
  // To map websocket connections
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  players,
  rooms
}, Symbol.toStringTag, { value: "Module" }));
if (!private_env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
if (!private_env.DATABASE_AUTH_TOKEN) throw new Error("DATABASE_AUTH_TOKEN is not set");
const client = createClient({ url: private_env.DATABASE_URL, authToken: private_env.DATABASE_AUTH_TOKEN });
const db = drizzle(client, { schema });
export {
  db as d,
  rooms as r
};
