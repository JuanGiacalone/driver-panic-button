import { BleManager, Device, Characteristic } from "react-native-ble-plx";
import { Platform, NativeEventEmitter, NativeModules } from "react-native";
import { getSettings, saveSettings } from "./storage";
import type { AppSettings } from "@/types";

// BLE UUIDs - Standard HID UUIDs for button devices
const HID_SERVICE_UUID = "180A"; // Device Information Service
const BUTTON_CHARACTERISTIC_UUID = "2A19"; // Battery Level (common for buttons)
const GENERIC_BUTTON_CHARACTERISTIC = "2A37"; // Heart Rate Measurement (often used for button events)

export interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  isConnectable: boolean;
}

export interface BluetoothButtonEvent {
  deviceId: string;
  deviceName: string;
  timestamp: number;
}

class BluetoothService {
  private bleManager: BleManager | null = null;
  private scanListener: any = null;
  private connectedDevice: Device | null = null;
  private characteristic: Characteristic | null = null;
  private listeners: ((event: BluetoothButtonEvent) => void)[] = [];

  constructor() {}

  /**
   * Get or create BleManager instance
   */
  private getBleManager(): BleManager {
    if (!this.bleManager) {
      this.bleManager = new BleManager();
    }
    return this.bleManager;
  }

  /**
   * Initialize Bluetooth manager
   */
  async initialize(): Promise<void> {
    try {
      const state = await this.getBleManager().state();
      console.log("BLE State:", state);
    } catch (error) {
      console.error("Failed to initialize BLE:", error);
      throw error;
    }
  }

  /**
   * Request Bluetooth permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "ios") {
        // iOS handles permissions automatically through Info.plist
        return true;
      } else if (Platform.OS === "android") {
        // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions
        // These should be declared in app.config.ts
        return true;
      }
      return true;
    } catch (error) {
      console.error("Failed to request BLE permissions:", error);
      return false;
    }
  }

  /**
   * Start scanning for Bluetooth devices
   */
  async startScanning(
    onDeviceFound: (device: BluetoothDevice) => void
  ): Promise<void> {
    try {
      await this.getBleManager().startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error("Scan error:", error);
          return;
        }

        if (device && device.name) {
          onDeviceFound({
            id: device.id,
            name: device.name,
            rssi: device.rssi || 0,
            isConnectable: device.isConnectable || false,
          });
        }
      });

      this.scanListener = true;
    } catch (error) {
      console.error("Failed to start scanning:", error);
      throw error;
    }
  }

  /**
   * Stop scanning for devices
   */
  async stopScanning(): Promise<void> {
    try {
      if (this.scanListener) {
        await this.getBleManager().stopDeviceScan();
        this.scanListener = null;
      }
    } catch (error) {
      console.error("Failed to stop scanning:", error);
    }
  }

  /**
   * Connect to a Bluetooth device
   */
  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      // Stop scanning first
      await this.stopScanning();

      // Connect to device
      const device = await this.getBleManager().connectToDevice(deviceId, {
        autoConnect: true,
      });

      // Discover services and characteristics
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;

      // Try to find button characteristic
      await this.setupButtonListener(device);

      return device;
    } catch (error) {
      console.error("Failed to connect to device:", error);
      throw error;
    }
  }

  /**
   * Setup listener for button press events
   */
  private async setupButtonListener(device: Device): Promise<void> {
    try {
      const services = await device.services();

      for (const service of services) {
        const characteristics = await service.characteristics();

        for (const characteristic of characteristics) {
          // Look for characteristics that might indicate button presses
          if (
            characteristic.isNotifiable ||
            characteristic.isIndicatable
          ) {
            this.characteristic = characteristic;

            // Subscribe to notifications
            await characteristic.monitor((error, char) => {
              if (error) {
                console.error("Characteristic monitor error:", error);
                return;
              }

              if (char && char.value) {
                // Button press detected
                this.emitButtonEvent({
                  deviceId: device.id,
                  deviceName: device.name || "Unknown Device",
                  timestamp: Date.now(),
                });
              }
            });

            return;
          }
        }
      }

      console.warn("No button characteristic found on device");
    } catch (error) {
      console.error("Failed to setup button listener:", error);
    }
  }

  /**
   * Disconnect from device
   */
  async disconnectFromDevice(): Promise<void> {
    try {
      if (this.connectedDevice) {
        await this.getBleManager().cancelDeviceConnection(this.connectedDevice.id);
        this.connectedDevice = null;
        this.characteristic = null;
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }

  /**
   * Get currently connected device
   */
  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  /**
   * Subscribe to button press events
   */
  onButtonPress(callback: (event: BluetoothButtonEvent) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Emit button press event to all listeners
   */
  private emitButtonEvent(event: BluetoothButtonEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Save paired device to settings
   */
  async savePairedDevice(deviceId: string, deviceName: string): Promise<void> {
    try {
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        pairedBluetoothDeviceId: deviceId,
        pairedBluetoothDeviceName: deviceName,
      });
    } catch (error) {
      console.error("Failed to save paired device:", error);
      throw error;
    }
  }

  /**
   * Get paired device from settings
   */
  async getPairedDevice(): Promise<{
    deviceId: string;
    deviceName: string;
  } | null> {
    try {
      const settings = await getSettings();
      if (settings.pairedBluetoothDeviceId && settings.pairedBluetoothDeviceName) {
        return {
          deviceId: settings.pairedBluetoothDeviceId,
          deviceName: settings.pairedBluetoothDeviceName,
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get paired device:", error);
      return null;
    }
  }

  /**
   * Remove paired device
   */
  async removePairedDevice(): Promise<void> {
    try {
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        pairedBluetoothDeviceId: undefined,
        pairedBluetoothDeviceName: undefined,
      });
    } catch (error) {
      console.error("Failed to remove paired device:", error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    try {
      await this.disconnectFromDevice();
      await this.stopScanning();
      this.listeners = [];
    } catch (error) {
      console.error("Failed to destroy BLE service:", error);
    }
  }
}

// Export singleton instance
export const bluetoothService = new BluetoothService();
