import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique device identifier. Each device is linked to one user account. */
  deviceId: varchar("deviceId", { length: 255 }).notNull().unique(),
  /** Unique username for login. */
  username: varchar("username", { length: 100 }).notNull().unique(),
  /** Bcrypt hash of the user's 6-digit PIN. */
  pinHash: varchar("pinHash", { length: 255 }).notNull(),
  /** Optional display name for the user. */
  name: text("name"),
  /** Whether the user's subscription is active (controlled by admin). */
  isActive: int("isActive").default(0).notNull(),
  /** User role: 'user' or 'admin'. */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here
