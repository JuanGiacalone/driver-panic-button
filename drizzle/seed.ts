import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import * as bcrypt from "bcryptjs";

/**
 * Seed script to create default development users.
 * Run this after database migration to set up test accounts.
 */
async function seed() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL not set. Skipping seed.");
        process.exit(1);
    }

    const db = drizzle(process.env.DATABASE_URL);

    // Hash default PINs
    const userPinHash = await bcrypt.hash("123456", 10);
    const adminPinHash = await bcrypt.hash("654321", 10);

    // Create default users
    const defaultUsers = [
        {
            deviceId: "dev-device-user",
            pinHash: userPinHash,
            name: "Test User",
            role: "user" as const,
        },
        {
            deviceId: "dev-device-admin",
            pinHash: adminPinHash,
            name: "Admin User",
            role: "admin" as const,
        },
    ];

    try {
        for (const user of defaultUsers) {
            await db
                .insert(users)
                .values(user)
                .onDuplicateKeyUpdate({
                    set: {
                        pinHash: user.pinHash,
                        name: user.name,
                        role: user.role,
                    },
                });
            console.log(`✓ Created/updated user: ${user.name} (${user.deviceId})`);
        }

        console.log("\n✅ Seed completed successfully!");
        console.log("\nDevelopment credentials:");
        console.log("  Regular User - Device ID: dev-device-user, PIN: 123456");
        console.log("  Admin User   - Device ID: dev-device-admin, PIN: 654321");
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
