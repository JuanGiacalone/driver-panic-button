import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getSettings, saveSettings } from "@/lib/storage";
import type { AppSettings } from "@/types";

const DEFAULT_MESSAGE = "¡EMERGENCIA! Necesito ayuda. Mi ubicación:";
const MAX_MESSAGE_LENGTH = 160;

export default function AlertMessageSettingsScreen() {
  const colors = useColors();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current message on mount
  useEffect(() => {
    loadMessage();
  }, []);

  const loadMessage = async () => {
    try {
      const settings = await getSettings();
      setMessage(settings.alertMessage || DEFAULT_MESSAGE);
    } catch (error) {
      console.error("Failed to load message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageChange = (text: string) => {
    if (text.length <= MAX_MESSAGE_LENGTH) {
      setMessage(text);
      setHasChanges(text !== DEFAULT_MESSAGE);
    }
  };

  const handleSave = async () => {
    if (!message.trim()) {
      Alert.alert("Error de Validación", "El mensaje no puede estar vacío");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      const settings = await getSettings();
      const updatedSettings: AppSettings = {
        ...settings,
        alertMessage: message.trim(),
      };
      await saveSettings(updatedSettings);

      Alert.alert("Éxito", "Mensaje de alerta actualizado", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al guardar mensaje"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Restablecer a Predeterminado",
      `¿Restablecer mensaje a: "${DEFAULT_MESSAGE}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restablecer",
          style: "destructive",
          onPress: () => {
            setMessage(DEFAULT_MESSAGE);
            setHasChanges(false);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: colors.foreground }}>Cargando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const messageLength = message.length;
  const remainingLength = MAX_MESSAGE_LENGTH - messageLength;
  const isNearLimit = remainingLength <= 20;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-4">
            {/* Header */}
            <View className="mb-6">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.foreground }}
              >
                Mensaje de Alerta
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                Personaliza el mensaje enviado a los contactos de emergencia
              </Text>
            </View>

            {/* Info Box */}
            <View
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: colors.primary + "10" }}
            >
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.primary }}
              >
                ℹ️ Información del Mensaje
              </Text>
              <Text className="text-xs" style={{ color: colors.primary }}>
                Tu ubicación se agregará automáticamente a este mensaje al
                enviar alertas.
              </Text>
            </View>

            {/* Message Input */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.foreground }}
                >
                  Plantilla de Mensaje
                </Text>
                <Text
                  className="text-xs font-medium"
                  style={{
                    color: isNearLimit ? colors.warning : colors.muted,
                  }}
                >
                  {messageLength}/{MAX_MESSAGE_LENGTH}
                </Text>
              </View>
              <TextInput
                value={message}
                onChangeText={handleMessageChange}
                placeholder="Ingresa tu mensaje de alerta"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                editable={!isSaving}
                className="bg-surface border rounded-xl px-4 py-3 text-base"
                style={{
                  color: colors.foreground,
                  borderColor: isNearLimit ? colors.warning : colors.border,
                  borderWidth: isNearLimit ? 2 : 1,
                  textAlignVertical: "top",
                }}
              />
              {remainingLength <= 20 && (
                <Text className="text-xs mt-2" style={{ color: colors.warning }}>
                  {remainingLength} caracteres restantes
                </Text>
              )}
            </View>

            {/* Preview Section */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.foreground }}
              >
                Vista Previa
              </Text>
              <View
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-sm" style={{ color: colors.foreground }}>
                  {message}
                </Text>
                <Text
                  className="text-xs mt-2"
                  style={{ color: colors.muted }}
                >
                  https://maps.google.com/?q=37.7749,-122.4194
                </Text>
              </View>
            </View>

            {/* Example Messages */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium mb-3"
                style={{ color: colors.foreground }}
              >
                Plantillas Rápidas
              </Text>
              <View className="gap-2">
                {[
                  "¡EMERGENCIA! Necesito ayuda. Mi ubicación:",
                  "¡Ayuda necesaria inmediatamente! Ubicación:",
                  "SOS - Por favor envía ayuda. Mi ubicación:",
                  "Estoy en peligro. Por favor ayuda. Ubicación:",
                ].map((template, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setMessage(template);
                      setHasChanges(template !== DEFAULT_MESSAGE);
                    }}
                    disabled={isSaving}
                    className="bg-surface border border-border rounded-lg p-3"
                    style={{
                      opacity: isSaving ? 0.6 : 1,
                      backgroundColor:
                        message === template
                          ? colors.primary + "10"
                          : colors.surface,
                      borderColor:
                        message === template ? colors.primary : colors.border,
                      borderWidth: message === template ? 2 : 1,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color:
                          message === template ? colors.primary : colors.foreground,
                      }}
                    >
                      {template}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-auto gap-3 mb-4">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-primary rounded-xl py-4 items-center"
                style={{
                  opacity: isSaving || !hasChanges ? 0.6 : 1,
                }}
              >
                <Text className="text-white text-base font-semibold">
                  {isSaving ? "Guardando..." : "Guardar Mensaje"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReset}
                disabled={isSaving}
                className="bg-surface border border-border rounded-xl py-4 items-center"
                style={{
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Text
                  style={{ color: colors.foreground }}
                  className="text-base font-semibold"
                >
                  Restablecer a Predeterminado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isSaving}
                className="bg-surface border border-border rounded-xl py-4 items-center"
                style={{
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                <Text
                  style={{ color: colors.foreground }}
                  className="text-base font-semibold"
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
