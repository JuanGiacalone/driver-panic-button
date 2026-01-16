import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, Alert, Modal } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { useBluetooth } from "@/hooks/use-bluetooth";
import { getContacts } from "@/lib/storage";
import { getSettings } from "@/lib/storage";
import { sendAlertsToContacts } from "@/lib/alert-service";
import { getCurrentLocation } from "@/lib/location-service";
import type { EmergencyContact } from "@/types";

export default function HomeScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const bluetooth = useBluetooth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Load contacts and check permissions
  useEffect(() => {
    loadContacts();
    checkPermissions();
  }, []);

  // Subscribe to Bluetooth button press events
  useEffect(() => {
    if (bluetooth.connectedDevice) {
      const unsubscribe = bluetooth.subscribeToButtonPress(async () => {
        console.log("Botón Bluetooth presionado, activando pánico");
        await handlePanicPress();
      });

      return () => unsubscribe();
    }
  }, [bluetooth.connectedDevice]);

  const loadContacts = async () => {
    const loadedContacts = await getContacts();
    setContacts(loadedContacts);
  };

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setHasLocationPermission(status === "granted");
  };

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setHasLocationPermission(status === "granted");
    
    if (status === "granted") {
      await Location.requestBackgroundPermissionsAsync();
    }
  };

  const handlePanicPress = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        "Sin Contactos de Emergencia",
        "Por favor agrega al menos un contacto de emergencia antes de usar el botón de pánico.",
        [{ text: "Agregar Contactos", onPress: () => router.push("/contacts") }]
      );
      return;
    }

    if (!hasLocationPermission) {
      Alert.alert(
        "Permiso de Ubicación Requerido",
        "Por favor otorga permiso de ubicación para enviar tus coordenadas en alertas de emergencia.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Otorgar Permiso", onPress: requestPermissions },
        ]
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setIsSending(true);

    try {
      const location = await getCurrentLocation();
      const settings = await getSettings();
      const results = await sendAlertsToContacts(
        contacts,
        settings.alertMessage,
        location
      );

      const failedCount = results.filter((r) => !r.success).length;
      
      if (failedCount > 0) {
        Alert.alert(
          "Éxito Parcial",
          `Alerta enviada a ${results.length - failedCount} de ${results.length} contactos.`,
          [{ text: "OK" }]
        );
      } else {
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      }
    } catch (error) {
      Alert.alert(
        "Alerta Fallida",
        error instanceof Error ? error.message : "Error al enviar alerta de emergencia",
        [{ text: "OK" }]
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const canUsePanicButton = contacts.length > 0 && hasLocationPermission;

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 items-center justify-center px-6">
        {/* Status Indicators */}
        <View className="absolute top-4 left-0 right-0 px-6">
          <View className="flex-row justify-between items-center gap-2">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-2 h-2 rounded-full ${hasLocationPermission ? "bg-success" : "bg-error"}`}
              />
              <Text className="text-sm text-muted">
                {hasLocationPermission ? "GPS Listo" : "GPS Desactivado"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 flex-wrap justify-end">
              {bluetooth.connectedDevice && (
                <View className="flex-row items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: colors.success + "20" }}>
                  <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.success }} />
                  <Text className="text-xs font-medium" style={{ color: colors.success }}>
                    BT
                  </Text>
                </View>
              )}
              <Text className="text-sm text-muted">
                {contacts.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Panic Button */}
        <View className="items-center">
          <TouchableOpacity
            onPress={handlePanicPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            disabled={!canUsePanicButton || isSending}
            activeOpacity={0.8}
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: !canUsePanicButton
                ? colors.muted
                : isPressed
                  ? "#991B1B"
                  : colors.primary,
              justifyContent: "center",
              alignItems: "center",
              transform: [{ scale: isPressed ? 0.95 : 1 }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "white",
              }}
            >
              {isSending ? "..." : "SOS"}
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-muted mt-6 text-base">
            {!canUsePanicButton
              ? contacts.length === 0
                ? "Agrega contactos de emergencia para activar"
                : "Otorga permiso de ubicación para activar"
              : bluetooth.connectedDevice
                ? "Toca o presiona el botón Bluetooth"
                : "Toca para enviar alerta de emergencia"}
          </Text>
        </View>

        {/* Quick Actions */}
        {!canUsePanicButton && (
          <View className="absolute bottom-8 left-0 right-0 px-6">
            {contacts.length === 0 && (
              <TouchableOpacity
                onPress={() => router.push("/contacts")}
                className="bg-surface border border-border rounded-xl py-3 items-center"
              >
                <Text className="text-primary font-semibold">
                  Agregar Contactos de Emergencia
                </Text>
              </TouchableOpacity>
            )}
            {contacts.length > 0 && !hasLocationPermission && (
              <TouchableOpacity
                onPress={requestPermissions}
                className="bg-surface border border-border rounded-xl py-3 items-center"
              >
                <Text className="text-primary font-semibold">
                  Habilitar Acceso a Ubicación
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              minWidth: 280,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.success,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32, color: "white" }}>✓</Text>
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              Alerta Enviada
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                textAlign: "center",
              }}
            >
              Alerta de emergencia enviada a {contacts.length}{" "}
              {contacts.length === 1 ? "contacto" : "contactos"}
            </Text>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
