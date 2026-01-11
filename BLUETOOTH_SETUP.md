# Bluetooth Panic Button Integration Guide

This guide explains how the Driver Panic Button app integrates with physical Bluetooth panic buttons for hands-free emergency alerts.

## Overview

The app supports pairing with standard Bluetooth button devices that emit HID (Human Interface Device) signals. When paired, the physical button can trigger emergency alerts even when the app is in the background.

## Architecture

### Components

**1. Bluetooth Service** (`lib/bluetooth-service.ts`)
- Manages BLE (Bluetooth Low Energy) device scanning
- Handles device pairing and connection
- Subscribes to button press notifications
- Stores paired device information

**2. Background Tasks** (`lib/background-tasks.ts`)
- Registers background fetch tasks for continuous operation
- Manages Bluetooth event listeners in the background
- Triggers panic alerts when button is pressed

**3. Bluetooth Hook** (`hooks/use-bluetooth.ts`)
- React hook for managing Bluetooth state
- Provides scanning, connecting, and disconnecting functions
- Manages subscription to button press events

**4. Setup Screen** (`app/bluetooth-setup.tsx`)
- User interface for device discovery
- Device pairing workflow
- Connection status display

## Device Compatibility

The app works with any Bluetooth button device that:
- Supports BLE (Bluetooth Low Energy)
- Emits HID button press events
- Is discoverable during scanning

Common compatible devices:
- Bluetooth panic buttons for personal safety
- Smart home buttons (adapted)
- Bluetooth remote controls
- Custom BLE button devices

## How It Works

### Pairing Flow

1. User navigates to Settings → Bluetooth Setup
2. Taps "Scan for Devices"
3. App scans for nearby Bluetooth devices for 10 seconds
4. User selects their panic button from the list
5. App connects and subscribes to button press notifications
6. Device ID and name are stored in app settings

### Panic Trigger Flow

**When App is Foreground:**
1. User presses physical Bluetooth button
2. Button press notification received
3. `useBluetooth` hook triggers callback
4. `handlePanicPress()` is called on home screen
5. Emergency alerts sent to all contacts with current location

**When App is Background:**
1. Background task listener remains active
2. Button press notification received
3. Background task processes the event
4. Emergency alerts sent automatically
5. User is notified of alert delivery

## Implementation Details

### Bluetooth Service Methods

```typescript
// Initialize Bluetooth
await bluetoothService.initialize();

// Request permissions
await bluetoothService.requestPermissions();

// Start scanning for devices
await bluetoothService.startScanning((device) => {
  console.log("Found device:", device.name);
});

// Connect to a device
await bluetoothService.connectToDevice(deviceId);

// Subscribe to button events
const unsubscribe = bluetoothService.onButtonPress((event) => {
  console.log("Button pressed:", event);
});

// Save paired device
await bluetoothService.savePairedDevice(deviceId, deviceName);

// Get paired device
const paired = await bluetoothService.getPairedDevice();

// Disconnect
await bluetoothService.disconnectFromDevice();
```

### Using the Bluetooth Hook

```typescript
import { useBluetooth } from "@/hooks/use-bluetooth";

function MyComponent() {
  const bluetooth = useBluetooth();

  // Check connection status
  if (bluetooth.connectedDevice) {
    console.log("Connected to:", bluetooth.connectedDevice.name);
  }

  // Subscribe to button presses
  useEffect(() => {
    const unsubscribe = bluetooth.subscribeToButtonPress((event) => {
      console.log("Button pressed at:", event.timestamp);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View>
      <Text>Status: {bluetooth.connectedDevice ? "Connected" : "Not Connected"}</Text>
    </View>
  );
}
```

## Permissions

### iOS
The app requests the following permissions via `Info.plist`:
- `NSBluetoothPeripheralUsageDescription` - For connecting to Bluetooth devices
- `NSBluetoothAlwaysAndWhenInUseUsageDescription` - For background Bluetooth operation
- `NSLocationWhenInUseUsageDescription` - For location in alerts
- `NSLocationAlwaysAndWhenInUseUsageDescription` - For background location

### Android
The app requests the following permissions:
- `BLUETOOTH` - Basic Bluetooth access
- `BLUETOOTH_ADMIN` - Bluetooth admin operations
- `BLUETOOTH_SCAN` - Scanning for devices (Android 12+)
- `BLUETOOTH_CONNECT` - Connecting to devices (Android 12+)
- `ACCESS_FINE_LOCATION` - Precise location for alerts
- `ACCESS_COARSE_LOCATION` - Approximate location for alerts
- `ACCESS_BACKGROUND_LOCATION` - Background location access

## Testing

### Manual Testing Steps

1. **Pairing Test**
   - Open Settings → Bluetooth Setup
   - Tap "Scan for Devices"
   - Select your Bluetooth button
   - Verify "Connected" status appears

2. **Foreground Trigger Test**
   - Ensure app is in foreground
   - Press the Bluetooth button
   - Verify emergency alert is sent
   - Check SMS/WhatsApp messages received

3. **Background Trigger Test**
   - Close app or send to background
   - Press the Bluetooth button
   - Verify emergency alert is sent
   - Check notification received

4. **Disconnect Test**
   - Go to Bluetooth Setup
   - Tap "Unpair" on connected device
   - Verify device is removed
   - Verify button presses no longer trigger alerts

## Troubleshooting

### Device Not Found During Scan
- Ensure Bluetooth button is powered on
- Check that button is in pairing mode
- Move closer to the device
- Try scanning again

### Connection Fails
- Verify Bluetooth permissions are granted
- Restart the app
- Restart the Bluetooth button device
- Check device battery level

### Button Press Not Triggering Alert
- Verify device is still connected (check home screen status)
- Check that emergency contacts are configured
- Verify location permission is granted
- Check app logs for errors

### Background Trigger Not Working
- Ensure background fetch is enabled in app settings
- Verify device is still paired
- Check that app has not been force-closed
- On iOS, ensure "Background App Refresh" is enabled

## Security Considerations

1. **Device Pairing** - Only one device can be paired at a time
2. **Automatic Alerts** - Button presses trigger alerts without confirmation
3. **Location Sharing** - Coordinates are sent to all emergency contacts
4. **Background Operation** - App continues monitoring even when closed

## Future Enhancements

- Support for multiple paired devices
- Customizable button press actions
- Device battery level monitoring
- Signal strength optimization
- Bluetooth mesh network support for range extension

## API Reference

See `lib/bluetooth-service.ts` for complete API documentation and type definitions.
