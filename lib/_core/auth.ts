import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY, USERNAME_KEY, PIN_KEY } from "@/constants/const";

export type User = {
  id: number;
  deviceId: string;
  name: string | null;
  email: string | null;
  role: string | null;
  lastSignedIn: Date;
};

export async function getSessionToken(): Promise<string | null> {
  try {
    // Web platform uses cookie-based auth, no manual token management needed
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token retrieval");
      return null;
    }

    // Use SecureStore for native
    console.log("[Auth] Getting session token...");
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    console.log(
      "[Auth] Session token retrieved from SecureStore:",
      token ? `present (${token.substring(0, 20)}...)` : "missing",
    );
    return token;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    // Web platform uses cookie-based auth, no manual token management needed
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token storage");
      return;
    }

    // Use SecureStore for native
    console.log("[Auth] Setting session token...", token.substring(0, 20) + "...");
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    console.log("[Auth] Session token stored in SecureStore successfully");
  } catch (error) {
    console.error("[Auth] Failed to set session token:", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    // Web platform uses cookie-based auth, logout is handled by server clearing cookie
    if (Platform.OS === "web") {
      console.log("[Auth] Web platform uses cookie-based auth, skipping token removal");
      return;
    }

    // Use SecureStore for native
    console.log("[Auth] Removing session token...");
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    console.log("[Auth] Session token removed from SecureStore successfully");
  } catch (error) {
    console.error("[Auth] Failed to remove session token:", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    console.log("[Auth] Getting user info...");

    let info: string | null = null;
    if (Platform.OS === "web") {
      // Use localStorage for web
      info = window.localStorage.getItem(USER_INFO_KEY);
    } else {
      // Use SecureStore for native
      info = await SecureStore.getItemAsync(USER_INFO_KEY);
    }

    if (!info) {
      console.log("[Auth] No user info found");
      return null;
    }
    const user = JSON.parse(info);
    console.log("[Auth] User info retrieved:", user);
    return user;
  } catch (error) {
    console.error("[Auth] Failed to get user info:", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    console.log("[Auth] Setting user info...", user);

    if (Platform.OS === "web") {
      // Use localStorage for web
      window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      console.log("[Auth] User info stored in localStorage successfully");
      return;
    }

    // Use SecureStore for native
    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
    console.log("[Auth] User info stored in SecureStore successfully");
  } catch (error) {
    console.error("[Auth] Failed to set user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      // Use localStorage for web
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }

    // Use SecureStore for native
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear user info:", error);
  }
}

export async function getStoredCredentials(): Promise<{ username: string | null; pin: string | null }> {
  try {
    let username: string | null = null;
    let pin: string | null = null;

    if (Platform.OS === "web") {
      username = window.localStorage.getItem(USERNAME_KEY);
      pin = window.localStorage.getItem(PIN_KEY);
    } else {
      username = await SecureStore.getItemAsync(USERNAME_KEY);
      pin = await SecureStore.getItemAsync(PIN_KEY);
    }

    return { username, pin };
  } catch (error) {
    console.error("[Auth] Failed to get stored credentials:", error);
    return { username: null, pin: null };
  }
}

export async function setStoredCredentials(username: string, pin: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(USERNAME_KEY, username);
      window.localStorage.setItem(PIN_KEY, pin);
    } else {
      await SecureStore.setItemAsync(USERNAME_KEY, username);
      await SecureStore.setItemAsync(PIN_KEY, pin);
    }
  } catch (error) {
    console.error("[Auth] Failed to set stored credentials:", error);
  }
}

export async function clearStoredCredentials(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USERNAME_KEY);
      window.localStorage.removeItem(PIN_KEY);
    } else {
      await SecureStore.deleteItemAsync(USERNAME_KEY);
      await SecureStore.deleteItemAsync(PIN_KEY);
    }
  } catch (error) {
    console.error("[Auth] Failed to clear stored credentials:", error);
  }
}
