import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: Partial<InsertUser> & { deviceId: string }): Promise<void> {
  if (!user.deviceId) {
    throw new Error("User deviceId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: Partial<InsertUser> & { deviceId: string } = {
      deviceId: user.deviceId,
    };
    const updateSet: Record<string, unknown> = {};

    // Handle pinHash
    if (user.pinHash !== undefined) {
      values.pinHash = user.pinHash;
      updateSet.pinHash = user.pinHash;
    }

    // Handle name
    if (user.name !== undefined) {
      const normalized = user.name ?? null;
      values.name = normalized;
      updateSet.name = normalized;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toUTCString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toUTCString();
    }

    await db.insert(users).values(values as any).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByDeviceId(deviceId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.deviceId, deviceId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByPinHash(pinHash: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  console.log("[Database] Getting user by pin hash:", pinHash);
  const result = await db.select().from(users).where(eq(users.pinHash, pinHash)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(
  deviceId: string,
  username: string,
  pinHash: string,
  name?: string,
  role?: "user" | "admin",
  phone: string = "",
  email: string = ""
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(users).values({
    deviceId,
    username,
    phone: phone || "0000000000",
    pinHash,
    name: name ?? "New User",
    email: email || "user@example.com",
    isActive: 0, // Inactive by default, admin must activate
    role: role ?? "user",
    lastSignedIn: new Date().toUTCString(),
  });
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserActiveStatus(userId: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ isActive: isActive ? 1 : 0 }).where(eq(users.id, userId));
}

export async function updateUserPaymentDate(userId: number, paymentDate: Date): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ lastPaymentDate: paymentDate.toUTCString() }).where(eq(users.id, userId));
}

export async function getUsersWithExpiredPayments(daysThreshold: number = 30): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const result = await db
    .select()
    .from(users)
    .where(eq(users.isActive, 1));

  // Filter users whose lastPaymentDate is older than threshold or null
  return result.filter(user =>
    !user.lastPaymentDate || new Date(user.lastPaymentDate) < thresholdDate
  );
}

export async function updateUser(userId: number, data: Partial<InsertUser>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserPin(deviceId: string, pinHash: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set({ pinHash }).where(eq(users.deviceId, deviceId));
}

// TODO: add feature queries here as your schema grows.
