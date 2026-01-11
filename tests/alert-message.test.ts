import { describe, it, expect, beforeEach } from "vitest";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";

describe("Alert Message Customization", () => {
  const DEFAULT_MESSAGE = "EMERGENCY! I need help. My location:";

  beforeEach(async () => {
    // Reset settings before each test
    const defaultSettings: AppSettings = {
      alertMessage: DEFAULT_MESSAGE,
    };
    await saveSettings(defaultSettings);
  });

  it("should load default alert message", async () => {
    const settings = await getSettings();
    expect(settings.alertMessage).toBe(DEFAULT_MESSAGE);
  });

  it("should save custom alert message", async () => {
    const customMessage = "Help needed immediately! Location:";
    const settings = await getSettings();
    const updatedSettings: AppSettings = {
      ...settings,
      alertMessage: customMessage,
    };
    await saveSettings(updatedSettings);

    const loaded = await getSettings();
    expect(loaded.alertMessage).toBe(customMessage);
  });

  it("should trim whitespace from message", async () => {
    const messageWithWhitespace = "  SOS - Please help. Location:  ";
    const settings = await getSettings();
    const updatedSettings: AppSettings = {
      ...settings,
      alertMessage: messageWithWhitespace.trim(),
    };
    await saveSettings(updatedSettings);

    const loaded = await getSettings();
    expect(loaded.alertMessage).toBe("SOS - Please help. Location:");
  });

  it("should preserve other settings when updating message", async () => {
    const settings = await getSettings();
    const updatedSettings: AppSettings = {
      ...settings,
      alertMessage: "New message",
      pairedBluetoothDeviceId: "device-123",
      pairedBluetoothDeviceName: "Test Button",
    };
    await saveSettings(updatedSettings);

    const loaded = await getSettings();
    expect(loaded.alertMessage).toBe("New message");
    expect(loaded.pairedBluetoothDeviceId).toBe("device-123");
    expect(loaded.pairedBluetoothDeviceName).toBe("Test Button");
  });

  it("should handle long messages within limit", async () => {
    const longMessage =
      "This is a very long emergency message that contains detailed information about the situation and what kind of help is needed";
    const settings = await getSettings();
    const updatedSettings: AppSettings = {
      ...settings,
      alertMessage: longMessage,
    };
    await saveSettings(updatedSettings);

    const loaded = await getSettings();
    expect(loaded.alertMessage).toBe(longMessage);
  });

  it("should reset to default message", async () => {
    // First set a custom message
    let settings = await getSettings();
    let updatedSettings: AppSettings = {
      ...settings,
      alertMessage: "Custom message",
    };
    await saveSettings(updatedSettings);

    // Verify custom message is saved
    let loaded = await getSettings();
    expect(loaded.alertMessage).toBe("Custom message");

    // Reset to default
    updatedSettings = {
      ...settings,
      alertMessage: DEFAULT_MESSAGE,
    };
    await saveSettings(updatedSettings);

    // Verify reset
    loaded = await getSettings();
    expect(loaded.alertMessage).toBe(DEFAULT_MESSAGE);
  });

  it("should handle multiple message updates", async () => {
    const messages = [
      "First message",
      "Second message",
      "Third message",
      DEFAULT_MESSAGE,
    ];

    for (const msg of messages) {
      const settings = await getSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        alertMessage: msg,
      };
      await saveSettings(updatedSettings);

      const loaded = await getSettings();
      expect(loaded.alertMessage).toBe(msg);
    }
  });
});
