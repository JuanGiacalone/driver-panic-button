import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EmergencyContact, AppSettings } from "@/types";
import apiClient from "./api-client";

const CONTACTS_KEY = "@cached_contacts";
const SETTINGS_KEY = "@cached_settings";

const DEFAULT_SETTINGS: AppSettings = {
  alertMessage: "¡EMERGENCIA! Necesito ayuda. Mi ubicación:",
};

// ──────────────────────────────────────────────
// Emergency Contacts
// ──────────────────────────────────────────────

// Helper to map API response to app type
function mapContactFromApi(apiContact: any): EmergencyContact {
  return {
    id: apiContact.id.toString(),
    name: apiContact.name,
    phoneNumber: apiContact.phone,
    alertMethod: apiContact.alert_method,
  };
}

export async function getContacts(): Promise<EmergencyContact[]> {
  try {
    const response = await apiClient.get('/contacts');
    const mappedContacts = response.data.map(mapContactFromApi);
    
    // Save to cache for offline fallback
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(mappedContacts));
    return mappedContacts;
  } catch (error) {
    console.warn("Network error or timeout when fetching contacts. Falling back to cache.", error);
    try {
      const json = await AsyncStorage.getItem(CONTACTS_KEY);
      return json ? JSON.parse(json) : [];
    } catch (cacheError) {
      console.error("Failed to load contacts from cache:", cacheError);
      return [];
    }
  }
}

export async function addContact(contact: EmergencyContact): Promise<void> {
  try {
    // API Call
    await apiClient.post('/contacts', {
      name: contact.name,
      phone: contact.phoneNumber,
      alert_method: contact.alertMethod,
    });
    // We intentionally do not mutate the local cache directly here, 
    // relying on subsequent getContacts() calls to refresh it.
  } catch (error) {
    console.error("Failed to add contact via API:", error);
    throw new Error("No se pudo agregar el contacto. Revisa tu conexión de red.");
  }
}

export async function updateContact(updatedContact: EmergencyContact): Promise<void> {
  try {
    await apiClient.put(`/contacts/${updatedContact.id}`, {
      name: updatedContact.name,
      phone: updatedContact.phoneNumber,
      alert_method: updatedContact.alertMethod,
    });
  } catch (error) {
    console.error("Failed to update contact via API:", error);
    throw new Error("No se pudo actualizar el contacto. Revisa tu conexión de red.");
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  try {
    await apiClient.delete(`/contacts/${contactId}`);
  } catch (error) {
    console.error("Failed to delete contact via API:", error);
    throw new Error("No se pudo eliminar el contacto. Revisa tu conexión de red.");
  }
}

// ──────────────────────────────────────────────
// App Settings (Message)
// ──────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const response = await apiClient.get('/settings/message');
    const customMessage = response.data.custom_message;
    
    const settings: AppSettings = {
      alertMessage: customMessage || DEFAULT_SETTINGS.alertMessage,
    };
    
    // Cache for offline
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  } catch (error) {
    console.warn("Network error fetching settings. Falling back to cache.", error);
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : DEFAULT_SETTINGS;
    } catch (cacheError) {
      console.error("Failed to load settings from cache:", cacheError);
      return DEFAULT_SETTINGS;
    }
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await apiClient.post('/settings/message', {
      custom_message: settings.alertMessage,
    });
  } catch (error) {
    console.error("Failed to save settings via API:", error);
    throw new Error("No se pudo guardar el mensaje. Revisa tu conexión de red.");
  }
}
