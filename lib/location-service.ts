import * as Location from "expo-location";
import type { LocationCoordinates } from "@/types";

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== "granted") {
    return false;
  }
  
  // Request background location permission for panic button to work in background
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  return backgroundStatus === "granted";
}

/**
 * Check if location permissions are granted
 */
export async function hasLocationPermissions(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
  const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
  
  return foregroundStatus === "granted" && backgroundStatus === "granted";
}

/**
 * Get current location coordinates
 */
export async function getCurrentLocation(): Promise<LocationCoordinates> {
  const hasPermissions = await hasLocationPermissions();
  
  if (!hasPermissions) {
    throw new Error("Location permissions not granted");
  }
  
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Start watching location in the background
 */
export async function startBackgroundLocationTracking(): Promise<void> {
  const hasPermissions = await hasLocationPermissions();
  
  if (!hasPermissions) {
    throw new Error("Background location permissions not granted");
  }
  
  // This will be used with expo-task-manager for background location updates
  await Location.startLocationUpdatesAsync("BACKGROUND_LOCATION_TASK", {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000, // Update every 10 seconds
    distanceInterval: 0,
    foregroundService: {
      notificationTitle: "Panic Button Active",
      notificationBody: "Location tracking is active for emergency alerts",
    },
  });
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundLocationTracking(): Promise<void> {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync("BACKGROUND_LOCATION_TASK");
  
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync("BACKGROUND_LOCATION_TASK");
  }
}
