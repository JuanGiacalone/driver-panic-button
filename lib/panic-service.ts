import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./api-client";
import { registerPanicLocationTask, unregisterPanicLocationTask } from "./background-tasks";

const PANIC_STATE_KEY = "@active_panic_event_id";

export interface TriggerPanicResponse {
  eventId: string;
  trackingUrl: string;
  username: string;
  customMessage: string;
}

export async function triggerPanicEvent(latitude: number, longitude: number): Promise<TriggerPanicResponse> {
  const response = await apiClient.post("/panic/trigger", { latitude, longitude });
  const eventId = response.data.event_id.toString();
  
  await AsyncStorage.setItem(PANIC_STATE_KEY, eventId);
  await registerPanicLocationTask();
  
  return {
    eventId,
    trackingUrl: response.data.tracking_url,
    username: response.data.username,
    customMessage: response.data.custom_message
  };
}

export async function updatePanicLocation(latitude: number, longitude: number): Promise<void> {
  const eventId = await AsyncStorage.getItem(PANIC_STATE_KEY);
  if (eventId) {
    try {
      await apiClient.post("/panic/update", { 
        event_id: parseInt(eventId, 10), 
        latitude, 
        longitude 
      });
    } catch (err) {
      console.warn("Offline or error updating panic location. Ignoring until next tick.", err);
    }
  }
}

export async function resolvePanicEvent(): Promise<void> {
  try {
    const eventId = await AsyncStorage.getItem(PANIC_STATE_KEY);
    if (eventId) {
      await apiClient.post("/panic/resolve", { event_id: parseInt(eventId, 10) });
    } else {
      await apiClient.post("/panic/resolve", {});
    }
  } catch (err) {
    console.warn("Error resolving panic event via API (might be offline)", err);
  } finally {
    await AsyncStorage.removeItem(PANIC_STATE_KEY);
    await unregisterPanicLocationTask();
  }
}

export async function getActivePanicEvent(): Promise<string | null> {
  return await AsyncStorage.getItem(PANIC_STATE_KEY);
}
