import { useEffect, useState, useCallback } from "react";
import { bluetoothService, type BluetoothDevice, type BluetoothButtonEvent } from "@/lib/bluetooth-service";
import {
  setupBluetoothBackgroundListener,
  isBluetoothListenerActive,
} from "@/lib/background-tasks";

export interface UseBluetoothState {
  isScanning: boolean;
  isConnecting: boolean;
  connectedDevice: { id: string; name: string } | null;
  devices: BluetoothDevice[];
  error: string | null;
}

export function useBluetooth() {
  const [state, setState] = useState<UseBluetoothState>({
    isScanning: false,
    isConnecting: false,
    connectedDevice: null,
    devices: [],
    error: null,
  });

  const [unsubscribeListener, setUnsubscribeListener] = useState<(() => void) | null>(null);

  // Initialize Bluetooth on mount
  useEffect(() => {
    const initBluetooth = async () => {
      try {
        await bluetoothService.initialize();
        const hasPermission = await bluetoothService.requestPermissions();
        if (!hasPermission) {
          setState((prev) => ({
            ...prev,
            error: "Bluetooth permission required",
          }));
        }

        // Load paired device
        const paired = await bluetoothService.getPairedDevice();
        if (paired) {
          setState((prev) => ({
            ...prev,
            connectedDevice: {
              id: paired.deviceId,
              name: paired.deviceName,
            },
          }));

          // Setup background listener if device is paired
          const unsubscribe = setupBluetoothBackgroundListener((event) => {
            console.log("Bluetooth panic triggered from background:", event);
          });
          setUnsubscribeListener(unsubscribe);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to initialize Bluetooth",
        }));
      }
    };

    initBluetooth();

    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
      bluetoothService.destroy();
    };
  }, []);

  const startScanning = useCallback(
    async (onDeviceFound: (device: BluetoothDevice) => void) => {
      setState((prev) => ({ ...prev, isScanning: true, error: null }));

      try {
        await bluetoothService.startScanning(onDeviceFound);

        // Auto-stop after 10 seconds
        setTimeout(async () => {
          await bluetoothService.stopScanning();
          setState((prev) => ({ ...prev, isScanning: false }));
        }, 10000);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isScanning: false,
          error: error instanceof Error ? error.message : "Failed to scan",
        }));
      }
    },
    []
  );

  const stopScanning = useCallback(async () => {
    try {
      await bluetoothService.stopScanning();
      setState((prev) => ({ ...prev, isScanning: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to stop scan",
      }));
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId: string, deviceName: string) => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      await bluetoothService.connectToDevice(deviceId);
      await bluetoothService.savePairedDevice(deviceId, deviceName);

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        connectedDevice: { id: deviceId, name: deviceName },
      }));

      // Setup background listener
      if (unsubscribeListener) {
        unsubscribeListener();
      }

      const unsubscribe = setupBluetoothBackgroundListener((event) => {
        console.log("Bluetooth panic triggered:", event);
      });
      setUnsubscribeListener(unsubscribe);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect",
      }));
    }
  }, [unsubscribeListener]);

  const disconnectDevice = useCallback(async () => {
    try {
      await bluetoothService.disconnectFromDevice();
      await bluetoothService.removePairedDevice();

      if (unsubscribeListener) {
        unsubscribeListener();
        setUnsubscribeListener(null);
      }

      setState((prev) => ({
        ...prev,
        connectedDevice: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to disconnect",
      }));
    }
  }, [unsubscribeListener]);

  const subscribeToButtonPress = useCallback(
    (callback: (event: BluetoothButtonEvent) => void) => {
      return bluetoothService.onButtonPress(callback);
    },
    []
  );

  return {
    ...state,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectDevice,
    subscribeToButtonPress,
    isListenerActive: isBluetoothListenerActive(),
  };
}
