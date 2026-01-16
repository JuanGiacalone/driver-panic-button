import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	deviceId: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 100 }).notNull(),
	pinHash: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	isActive: int().default(0).notNull(),
	lastPaymentDate: timestamp({ mode: 'string' }),
	role: mysqlEnum(['user', 'admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`(now())`).onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`(now())`).notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
		unique("users_deviceId_unique").on(table.deviceId),
		unique("users_username_unique").on(table.username),
	]);
