import * as bcrypt from "bcryptjs";
import { getUserByPinHash, createUser as dbCreateUser, updateUserPin as dbUpdateUserPin, getUserByDeviceId, getUserByUsername } from "../db";
import { sdk } from "./sdk";

/**
 * Hash a PIN using bcrypt.
 */
export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
}

/**
 * Verify a PIN against a hash.
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
}

/**
 * Generate a session token for a device.
 */
export async function generateSessionToken(deviceId: string, username: string): Promise<string> {
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    return sdk.createSessionToken(deviceId, {
        name: username,
        expiresInMs: ONE_YEAR_MS,
    });
}

/**
 * Create a new user with username and PIN (registration).
 */
export async function createUser(
    deviceId: string,
    username: string,
    pin: string,
    name?: string,
    role?: "user" | "admin",
    phone?: string,
    email?: string
): Promise<void> {
    const pinHash = await hashPin(pin);
    await dbCreateUser(deviceId, username, pinHash, name, role, phone, email);
}

/**
 * Authenticate a user with username and PIN.
 */
export async function authenticateUser(username: string, deviceId: string, pin: string) {
    const user = await getUserByUsername(username);

    if (!user) {
        throw new Error("Usuario o PIN inválido");
    }

    // Check if user's device matches in production
    if (process.env.NODE_ENV !== "development") {
        if (user.deviceId !== deviceId) {
            console.log("Device ID mismatch", user.deviceId, deviceId);
            throw new Error("Este usuario está registrado en otro dispositivo");
        }
    }

    const isValid = await verifyPin(pin, user.pinHash);

    if (!isValid) {
        throw new Error("Usuario o PIN inválido");
    }

    // Check if user is active
    if (user.isActive !== 1) {
        throw new Error("Tu cuenta está inactiva. Contacta al administrador para activarla.");
    }

    // Update last signed in
    const db = await import("../db").then(m => m.getDb());
    if (db) {
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await (await db).update(users).set({ lastSignedIn: new Date().toUTCString() }).where(eq(users.username, username));
    }

    return user;
}

/**
 * Update a user's PIN (admin only).
 */
export async function updateUserPin(deviceId: string, newPin: string): Promise<void> {
    const pinHash = await hashPin(newPin);
    await dbUpdateUserPin(deviceId, pinHash);
}

/**
 * Get device ID from the request or generate one.
 * For mobile apps, this comes from the client.
 * For web, we can use a combination of user agent and other factors.
 */
export function getDeviceIdFromRequest(req: any): string | null {
    // Device ID should be sent in the request body or headers
    return req.body?.deviceId || req.headers["x-device-id"] || null;
}
