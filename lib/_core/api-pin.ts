import { Platform } from "react-native";
import { getDeviceId } from "./device";

/**
 * Get the API base URL, deriving from current hostname if not set.
 */
function getApiBaseUrl(): string {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

    if (API_BASE_URL) {
        return API_BASE_URL.replace(/\/$/, "");
    }

    if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
        const { protocol, hostname } = window.location;
        const apiHostname = hostname.replace(/^8081-/, "3000-");
        if (apiHostname !== hostname) {
            return `${protocol}//${apiHostname}`;
        }
    }

    return "";
}

/**
 * Login with PIN.
 */
export async function loginWithPin(username: string, pin: string) {
    const deviceId = await getDeviceId();
    const apiBaseUrl = getApiBaseUrl();

    console.log("[PIN-API] loginWithPin:", { username, deviceId, apiBaseUrl });

    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, deviceId, pin }),
    });

    console.log("[PIN-API] Response status:", response.status);

    if (!response.ok) {
        let errorMessage = "Login failed";
        try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
        } catch (e) {
            // Response is not JSON, try to get text
            const text = await response.text();
            console.error("[PIN-API] Non-JSON error response:", text);
            errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Logout the current user.
 */
export async function logout() {
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Logout failed");
    }

    return response.json();
}

/**
 * Get the current authenticated user.
 */
export async function getMe() {
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return data.user;
}
