import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * Get a unique device identifier.
 * This combines multiple device properties to create a stable identifier.
 */
export async function getDeviceId(): Promise<string> {
    if (Platform.OS === "web") {
        // For web, use a combination of user agent and screen properties
        // Store in localStorage to maintain consistency
        const stored = localStorage.getItem("device_id");
        if (stored) {
            return stored;
        }

        const deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("device_id", deviceId);
        return deviceId;
    }

    // For native platforms, use expo-application and expo-device
    let androidId: string | null = null;
    let iosIdForVendor: string | null = null;

    if (Platform.OS === "android") {
        androidId = await Application.getAndroidId();
    } else if (Platform.OS === "ios") {
        iosIdForVendor = await Application.getIosIdForVendorAsync();
    }

    if (androidId) {
        return `android-${androidId}`;
    }

    if (iosIdForVendor) {
        return `ios-${iosIdForVendor}`;
    }

    // Fallback: create a unique ID based on device properties
    const deviceName = Device.deviceName || "unknown";
    const modelName = Device.modelName || "unknown";
    const osVersion = Device.osVersion || "unknown";

    return `${Platform.OS}-${deviceName}-${modelName}-${osVersion}`.replace(/\s+/g, "-");
}
