import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EmergencyContact, AppSettings } from "@/types";

const CONTACTS_KEY = "@panic_button_contacts";
const SETTINGS_KEY = "@panic_button_settings";

const DEFAULT_SETTINGS: AppSettings = {
  alertMessage: "EMERGENCY! I need help. My location:",
};

// Emergency Contacts
export async function getContacts(): Promise<EmergencyContact[]> {
  try {
    const json = await AsyncStorage.getItem(CONTACTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Failed to load contacts:", error);
    return [];
  }
}

export async function saveContacts(contacts: EmergencyContact[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error("Failed to save contacts:", error);
    throw error;
  }
}

export async function addContact(contact: EmergencyContact): Promise<void> {
  const contacts = await getContacts();
  contacts.push(contact);
  await saveContacts(contacts);
}

export async function updateContact(updatedContact: EmergencyContact): Promise<void> {
  const contacts = await getContacts();
  const index = contacts.findIndex((c) => c.id === updatedContact.id);
  if (index !== -1) {
    contacts[index] = updatedContact;
    await saveContacts(contacts);
  }
}

export async function deleteContact(contactId: string): Promise<void> {
  const contacts = await getContacts();
  const filtered = contacts.filter((c) => c.id !== contactId);
  await saveContacts(filtered);
}

// App Settings
export async function getSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    return json ? { ...DEFAULT_SETTINGS, ...JSON.parse(json) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
    throw error;
  }
}
