import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { bluetoothService, type BluetoothDevice } from "@/lib/bluetooth-service";

export default function BluetoothSetupScreen() {
  const colors = useColors();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [pairedDevice, setPairedDevice] = useState<{
    deviceId: string;
    deviceName: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    initializeBluetooth();
    loadPairedDevice();

    return () => {
      bluetoothService.destroy();
    };
  }, []);

  const initializeBluetooth = async () => {
    try {
      await bluetoothService.initialize();
      const hasPermission = await bluetoothService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          "Bluetooth Permission",
          "Bluetooth permission is required to pair with a panic button device."
        );
      }
    } catch (error) {
      Alert.alert(
        "Bluetooth Error",
        error instanceof Error ? error.message : "Failed to initialize Bluetooth"
      );
    }
  };

  const loadPairedDevice = async () => {
    try {
      const paired = await bluetoothService.getPairedDevice();
      setPairedDevice(paired);
    } catch (error) {
      console.error("Failed to load paired device:", error);
    }
  };

  const handleStartScan = async () => {
    if (isScanning) {
      await bluetoothService.stopScanning();
      setIsScanning(false);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsScanning(true);
    setDevices([]);

    try {
      await bluetoothService.startScanning((device) => {
        setDevices((prevDevices) => {
          const exists = prevDevices.find((d) => d.id === device.id);
          if (exists) {
            return prevDevices.map((d) =>
              d.id === device.id ? device : d
            );
          }
          return [...prevDevices, device];
        });
      });

      // Auto-stop scanning after 10 seconds
      setTimeout(async () => {
        await bluetoothService.stopScanning();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      Alert.alert(
        "Scan Error",
        error instanceof Error ? error.message : "Failed to scan for devices"
      );
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (device: BluetoothDevice) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsConnecting(true);

    try {
      await bluetoothService.connectToDevice(device.id);
      await bluetoothService.savePairedDevice(device.id, device.name);

      setPairedDevice({
        deviceId: device.id,
        deviceName: device.name,
      });
      setConnectedDeviceId(device.id);

      Alert.alert(
        "Connected",
        `Successfully paired with ${device.name}. Press the button to test the connection.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error instanceof Error ? error.message : "Failed to connect to device"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await bluetoothService.disconnectFromDevice();
      await bluetoothService.removePairedDevice();
      setPairedDevice(null);
      setConnectedDeviceId(null);
      Alert.alert("Disconnected", "Device has been disconnected");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to disconnect"
      );
    }
  };

  const renderDevice = ({ item }: { item: BluetoothDevice }) => {
    const isPaired = pairedDevice?.deviceId === item.id;
    const isConnected = connectedDeviceId === item.id;

    return (
      <TouchableOpacity
        onPress={() => handleConnectDevice(item)}
        disabled={isConnecting || isPaired}
        className="bg-surface border border-border rounded-xl p-4 mb-3"
        style={{
          backgroundColor: colors.surface,
          borderColor: isPaired ? colors.primary : colors.border,
          borderWidth: isPaired ? 2 : 1,
          opacity: isConnecting ? 0.6 : 1,
        }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className="text-lg font-semibold mb-1"
              style={{ color: colors.foreground }}
            >
              {item.name}
            </Text>
            <Text className="text-sm mb-2" style={{ color: colors.muted }}>
              ID: {item.id.substring(0, 8)}...
            </Text>
            <Text className="text-xs" style={{ color: colors.muted }}>
              Signal: {item.rssi} dBm
            </Text>
          </View>
          <View className="items-end gap-2">
            {isPaired && (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.primary }}
                >
                  {isConnected ? "Connected" : "Paired"}
                </Text>
              </View>
            )}
            {!isPaired && (
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Tap to pair
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.surface }}
      >
        <Text className="text-4xl">📡</Text>
      </View>
      <Text
        className="text-lg font-semibold mb-2"
        style={{ color: colors.foreground }}
      >
        {isScanning ? "Scanning..." : "No Devices Found"}
      </Text>
      <Text
        className="text-sm text-center px-8"
        style={{ color: colors.muted }}
      >
        {isScanning
          ? "Make sure your panic button is powered on and nearby"
          : "Tap the scan button to find Bluetooth devices"}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.foreground }}
          >
            Bluetooth Setup
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.muted }}>
            Pair with a physical panic button device
          </Text>
        </View>

        {/* Paired Device Info */}
        {pairedDevice && (
          <View
            className="bg-success/10 border border-success rounded-xl p-4 mb-6"
            style={{ backgroundColor: colors.success + "15" }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.success }}
                >
                  Paired Device
                </Text>
                <Text
                  className="text-base font-semibold mt-1"
                  style={{ color: colors.foreground }}
                >
                  {pairedDevice.deviceName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDisconnect}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: colors.error + "20",
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: colors.error }}
                >
                  Unpair
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity
          onPress={handleStartScan}
          disabled={isConnecting}
          className="bg-primary rounded-xl py-4 items-center mb-6"
          style={{
            opacity: isConnecting ? 0.6 : 1,
          }}
        >
          <View className="flex-row items-center gap-2">
            {isScanning && <ActivityIndicator color="white" size="small" />}
            <Text className="text-white text-base font-semibold">
              {isScanning ? "Scanning..." : "Scan for Devices"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Devices List */}
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={renderEmpty}
          scrollEnabled={devices.length > 0}
          showsVerticalScrollIndicator={false}
        />

        {/* Info Box */}
        <View
          className="bg-surface border border-border rounded-xl p-4 mb-4"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Text
            className="text-xs font-semibold uppercase mb-2"
            style={{ color: colors.muted }}
          >
            How to pair
          </Text>
          <Text className="text-sm leading-relaxed" style={{ color: colors.muted }}>
            1. Make sure your panic button is powered on{"\n"}
            2. Tap "Scan for Devices"{"\n"}
            3. Select your device from the list{"\n"}
            4. Press the button to test the connection
          </Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-surface border border-border rounded-xl py-4 items-center mb-4"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground }} className="text-base font-semibold">
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
