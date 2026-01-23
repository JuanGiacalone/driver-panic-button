import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	deviceId: varchar({ length: 255 }).default(sql`NULL`),
	username: varchar({ length: 100 }).notNull(),
	phone: varchar({ length: 20 }).notNull(),
	pinHash: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	isActive: int().default(0).notNull(),
	lastPaymentDate: timestamp({ mode: 'string' }),
	role: mysqlEnum(['user', 'admin']).default('user').notNull(),
	createdAt: varchar({ length: 255 }).default(sql`(now())`).notNull(),
	updatedAt: varchar({ length: 255 }).default(sql`(now())`).notNull(),
	lastSignedIn: varchar({ length: 255 }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
		unique("users_deviceId_unique").on(table.deviceId),
		unique("users_username_unique").on(table.username),
	]);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
