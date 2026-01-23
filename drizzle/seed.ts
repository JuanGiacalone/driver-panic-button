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
            username: "test-user",
            deviceId: "dev-device-user",
            phone: "+1234567890",
            email: "user@example.com",
            pinHash: userPinHash,
            name: "Test User",
            isActive: 1,
            role: "user" as const,
        },
        {
            username: "test-admin",
            deviceId: "dev-device-admin",
            phone: "+1098765432",
            email: "admin@example.com",
            pinHash: adminPinHash,
            name: "Admin User",
            isActive: 1,
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
                        username: user.username,
                        deviceId: user.deviceId,
                        phone: user.phone,
                        email: user.email,
                        pinHash: user.pinHash,
                        name: user.name,
                        isActive: user.isActive,
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
