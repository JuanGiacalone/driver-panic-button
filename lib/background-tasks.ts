import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { bluetoothService, type BluetoothButtonEvent } from "./bluetooth-service";
import { getContacts, getSettings } from "./storage";
import { sendAlertsToContacts } from "./alert-service";
import { getCurrentLocation } from "./location-service";

const BLUETOOTH_TASK_NAME = "BLUETOOTH_PANIC_BUTTON_LISTENER";
const BACKGROUND_FETCH_TASK_NAME = "BACKGROUND_PANIC_CHECK";

// Global variable to track if listener is active
let bluetoothListenerActive = false;

/**
 * Define the background task for Bluetooth button events
 * This runs when the app is in the background
 */
TaskManager.defineTask(BLUETOOTH_TASK_NAME, async () => {
  try {
    console.log("Bluetooth panic button task triggered");
    return "NewData";
  } catch (error) {
    console.error("Background Bluetooth task error:", error);
    return "Failed";
  }
});

/**
 * Define the background fetch task for periodic checks
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK_NAME, async () => {
  try {
    console.log("Background fetch task running");
    return "NoData";
  } catch (error) {
    console.error("Background fetch task error:", error);
    return "Failed";
  }
});

/**
 * Register background tasks
 */
export async function registerBackgroundTasks(): Promise<void> {
  try {
    // Register background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK_NAME, {
      minimumInterval: 60 * 15,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("Background tasks registered");
  } catch (error) {
    console.error("Failed to register background tasks:", error);
  }
}

/**
 * Unregister background tasks
 */
export async function unregisterBackgroundTasks(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK_NAME);
    console.log("Background tasks unregistered");
  } catch (error) {
    console.error("Failed to unregister background tasks:", error);
  }
}

/**
 * Setup Bluetooth button listener for background panic triggers
 * This should be called when the app starts and a device is paired
 */
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

/**
 * Check if Bluetooth listener is active
 */
export function isBluetoothListenerActive(): boolean {
  return bluetoothListenerActive;
}

/**
 * Get registered background task status
 */
export async function getBackgroundTaskStatus(): Promise<{
  isRegistered: boolean;
  taskName: string;
}> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_FETCH_TASK_NAME
    );
    return {
      isRegistered,
      taskName: BACKGROUND_FETCH_TASK_NAME,
    };
  } catch (error) {
    console.error("Failed to get background task status:", error);
    return {
      isRegistered: false,
      taskName: BACKGROUND_FETCH_TASK_NAME,
    };
  }
}
