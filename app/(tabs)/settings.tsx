import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const [locationStatus, setLocationStatus] = useState<string>("Verificando...");
  const [bluetoothStatus] = useState<string>("No Conectado");

  useEffect(() => {
    checkLocationPermissions();
  }, []);

  const checkLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

    if (foregroundStatus === "granted" && backgroundStatus === "granted") {
      setLocationStatus("Habilitado (Siempre)");
    } else if (foregroundStatus === "granted") {
      setLocationStatus("Habilitado (En Uso)");
    } else {
      setLocationStatus("Deshabilitado");
    }
  };

  const handleRequestLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus === "granted") {
      await Location.requestBackgroundPermissionsAsync();
      await checkLocationPermissions();
    } else {
      Alert.alert(
        "Permiso Denegado",
        "El permiso de ubicación es necesario para que las alertas de emergencia incluyan tus coordenadas."
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const SettingRow = ({
    label,
    value,
    onPress,
    showChevron = false,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row justify-between items-center py-4 border-b"
      style={{
        borderBottomColor: colors.border,
        opacity: onPress ? 1 : 0.6,
      }}
    >
      <Text className="text-base" style={{ color: colors.foreground }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text className="text-sm" style={{ color: colors.muted }}>
            {value}
          </Text>
        )}
        {showChevron && (
          <Text style={{ color: colors.muted }}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.foreground }}
          >
            Configuración
          </Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Cuenta
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow label="Nombre" value={user?.name || "No establecido"} />
            <SettingRow label="Correo" value={user?.email || "No establecido"} />
          </View>
        </View>

        {/* Permissions Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Permisos
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow
              label="Acceso a Ubicación"
              value={locationStatus}
              onPress={
                locationStatus !== "Habilitado (Siempre)"
                  ? handleRequestLocationPermissions
                  : undefined
              }
              showChevron={locationStatus !== "Habilitado (Siempre)"}
            />
            <SettingRow
              label="Bluetooth"
              value={bluetoothStatus}
              onPress={() => router.push("/bluetooth-setup")}
              showChevron
            />
          </View>
        </View>

        {/* Alert Settings Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Configuración de Alertas
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow
              label="Mensaje de Alerta Personalizado"
              onPress={() => router.push("/alert-message-settings")}
              showChevron
            />
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Acerca de
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow label="Versión" value="1.0.0" />
            <SettingRow
              label="Ayuda y Soporte"
              onPress={() => {
                Alert.alert(
                  "Ayuda y Soporte",
                  "Para asistencia, por favor contacta a support@example.com"
                );
              }}
              showChevron
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-error/10 border border-error rounded-xl py-4 items-center mb-8"
        >
          <Text className="font-semibold" style={{ color: colors.error }}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
