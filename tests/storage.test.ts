import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getContacts,
  saveContacts,
  addContact,
  updateContact,
  deleteContact,
  getSettings,
  saveSettings,
} from "@/lib/storage";
import type { EmergencyContact, AppSettings } from "@/types";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("Storage - Emergency Contacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when no contacts exist", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const contacts = await getContacts();
    expect(contacts).toEqual([]);
  });

  it("should save and retrieve contacts", async () => {
    const mockContacts: EmergencyContact[] = [
      {
        id: "1",
        name: "John Doe",
        phoneNumber: "+1234567890",
        alertMethod: "sms",
      },
    ];

    await saveContacts(mockContacts);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@panic_button_contacts",
      JSON.stringify(mockContacts)
    );
  });

  it("should add a new contact", async () => {
    const existingContacts: EmergencyContact[] = [
      {
        id: "1",
        name: "John Doe",
        phoneNumber: "+1234567890",
        alertMethod: "sms",
      },
    ];

    const newContact: EmergencyContact = {
      id: "2",
      name: "Jane Smith",
      phoneNumber: "+0987654321",
      alertMethod: "sms",
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify(existingContacts)
    );

    await addContact(newContact);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@panic_button_contacts",
      JSON.stringify([...existingContacts, newContact])
    );
  });

  it("should update an existing contact", async () => {
    const contacts: EmergencyContact[] = [
      {
        id: "1",
        name: "John Doe",
        phoneNumber: "+1234567890",
        alertMethod: "sms",
      },
      {
        id: "2",
        name: "Jane Smith",
        phoneNumber: "+0987654321",
        alertMethod: "sms",
      },
    ];

    const updatedContact: EmergencyContact = {
      id: "1",
      name: "John Updated",
      phoneNumber: "+1111111111",
      alertMethod: "sms",
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(contacts));

    await updateContact(updatedContact);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@panic_button_contacts",
      JSON.stringify([updatedContact, contacts[1]])
    );
  });

  it("should delete a contact", async () => {
    const contacts: EmergencyContact[] = [
      {
        id: "1",
        name: "John Doe",
        phoneNumber: "+1234567890",
        alertMethod: "sms",
      },
      {
        id: "2",
        name: "Jane Smith",
        phoneNumber: "+0987654321",
        alertMethod: "sms",
      },
    ];

    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(contacts));

    await deleteContact("1");

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@panic_button_contacts",
      JSON.stringify([contacts[1]])
    );
  });
});

describe("Storage - App Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default settings when none exist", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const settings = await getSettings();
    expect(settings).toEqual({
      alertMessage: "EMERGENCY! I need help. My location:",
    });
  });

  it("should save and retrieve settings", async () => {
    const mockSettings: AppSettings = {
      alertMessage: "Custom alert message",
      pairedBluetoothDeviceId: "device-123",
      pairedBluetoothDeviceName: "BT Button",
    };

    await saveSettings(mockSettings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@panic_button_settings",
      JSON.stringify(mockSettings)
    );
  });

  it("should merge with default settings", async () => {
    const partialSettings = {
      pairedBluetoothDeviceId: "device-456",
    };

    vi.mocked(AsyncStorage.getItem).mockResolvedValue(
      JSON.stringify(partialSettings)
    );

    const settings = await getSettings();
    expect(settings).toEqual({
      alertMessage: "EMERGENCY! I need help. My location:",
      pairedBluetoothDeviceId: "device-456",
    });
  });
});
