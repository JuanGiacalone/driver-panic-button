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
          "Permiso de Bluetooth",
          "El permiso de Bluetooth es necesario para emparejar con un dispositivo de botón de pánico."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error de Bluetooth",
        error instanceof Error ? error.message : "Error al inicializar Bluetooth"
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
        "Error de Escaneo",
        error instanceof Error ? error.message : "Error al escanear dispositivos"
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
        "Conectado",
        `Emparejado exitosamente con ${device.name}. Presiona el botón para probar la conexión.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert(
        "Error de Conexión",
        error instanceof Error ? error.message : "Error al conectar con el dispositivo"
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
      Alert.alert("Desconectado", "El dispositivo ha sido desconectado");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al desconectar"
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
                  {isConnected ? "Conectado" : "Emparejado"}
                </Text>
              </View>
            )}
            {!isPaired && (
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
              >
                Toca para emparejar
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
        {isScanning ? "Escaneando..." : "No se Encontraron Dispositivos"}
      </Text>
      <Text
        className="text-sm text-center px-8"
        style={{ color: colors.muted }}
      >
        {isScanning
          ? "Asegúrate de que tu botón de pánico esté encendido y cerca"
          : "Toca el botón de escaneo para encontrar dispositivos Bluetooth"}
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
            Configuración de Bluetooth
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.muted }}>
            Empareja con un dispositivo físico de botón de pánico
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
                  Dispositivo Emparejado
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
                  Desemparejar
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
              {isScanning ? "Escaneando..." : "Escanear Dispositivos"}
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
            Cómo emparejar
          </Text>
          <Text className="text-sm leading-relaxed" style={{ color: colors.muted }}>
            1. Asegúrate de que tu botón de pánico esté encendido{"\n"}
            2. Toca "Escanear Dispositivos"{"\n"}
            3. Selecciona tu dispositivo de la lista{"\n"}
            4. Presiona el botón para probar la conexión
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
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
