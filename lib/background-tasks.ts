import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { bluetoothService, type BluetoothButtonEvent } from "./bluetooth-service";
import { getContacts, getSettings } from "./storage";
import { sendAlertsToContacts } from "./alert-service";
import { getCurrentLocation } from "./location-service";
import { updatePanicLocation } from "./panic-service";

const BLUETOOTH_TASK_NAME = "BLUETOOTH_PANIC_BUTTON_LISTENER";
const BACKGROUND_LOCATION_TASK_NAME = "BACKGROUND_PANIC_LOCATION";

let bluetoothListenerActive = false;

TaskManager.defineTask(BLUETOOTH_TASK_NAME, async () => {
  try {
    console.log("Bluetooth panic button task triggered");
    return "NewData";
  } catch (error) {
    console.error("Background Bluetooth task error:", error);
    return "Failed";
  }
});

// Define the background location task configured for ~1 minute intervals
TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background Location task error:", error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const { coords } = locations[0];
      console.log("[Background Location] Relaying to backend:", coords);
      await updatePanicLocation(coords.latitude, coords.longitude);
    }
  }
});

export async function registerPanicLocationTask(): Promise<void> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Background location permission denied');
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60000, 
      distanceInterval: 10,
      deferredUpdatesInterval: 60000, 
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Panic Mode Active",
        notificationBody: "Continually sharing your location for emergency contacts",
        notificationColor: "#FF0000",
      },
    });
    console.log("Background location updates registered");
  } catch (error) {
    console.error("Failed to register background location task:", error);
  }
}

export async function unregisterPanicLocationTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK_NAME);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
      console.log("Background location updates stopped");
    }
  } catch (error) {
    console.error("Failed to unregister background location task:", error);
  }
}

export function setupBluetoothBackgroundListener(
  onPanicTriggered: (event: BluetoothButtonEvent) => void
): () => void {
  if (bluetoothListenerActive) {
    console.warn("Bluetooth listener already active");
    return () => {};
  }

  const unsubscribe = bluetoothService.onButtonPress(async (event) => {
    console.log("Bluetooth panic button pressed:", event);
    try {
      const contacts = await getContacts();
      const settings = await getSettings();

      if (contacts.length === 0) {
        console.warn("No emergency contacts configured");
        return;
      }

      const location = await getCurrentLocation();
      const results = await sendAlertsToContacts(
        contacts,
        settings.alertMessage,
        location
      );

      console.log("Panic alerts sent:", results);
      onPanicTriggered(event);
    } catch (error) {
      console.error("Failed to send panic alerts from background:", error);
    }
  });

  bluetoothListenerActive = true;

  return () => {
    unsubscribe();
    bluetoothListenerActive = false;
  };
}

export function isBluetoothListenerActive(): boolean {
  return bluetoothListenerActive;
}

export async function getBackgroundTaskStatus(): Promise<{
  isRegistered: boolean;
  taskName: string;
}> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_LOCATION_TASK_NAME
    );
    return {
      isRegistered,
      taskName: BACKGROUND_LOCATION_TASK_NAME,
    };
  } catch (error) {
    console.error("Failed to get background task status:", error);
    return {
      isRegistered: false,
      taskName: BACKGROUND_LOCATION_TASK_NAME,
    };
  }
}
