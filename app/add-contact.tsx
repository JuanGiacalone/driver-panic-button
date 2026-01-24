import { useState } from "react";
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
import { addContact } from "@/lib/storage";
import type { AlertMethod } from "@/types";

export default function AddContactScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alertMethod, setAlertMethod] = useState<AlertMethod>("sms");
  const [isSaving, setIsSaving] = useState(false);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    // Check if it has at least 10 digits
    return cleaned.length >= 10;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error de Validación", "Por favor ingresa un nombre de contacto");
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert("Error de Validación", "Por favor ingresa un número de teléfono");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        "Error de Validación",
        "Por favor ingresa un número de teléfono válido con al menos 10 dígitos"
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSaving(true);

    try {
      await addContact({
        id: Date.now().toString(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        alertMethod,
      });

      Alert.alert("Éxito", "Contacto de emergencia agregado", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al guardar contacto"
      );
    } finally {
      setIsSaving(false);
    }
  };

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
                Agregar Contacto de Emergencia
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                Este contacto recibirá alertas cuando actives el botón de pánico
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.foreground }}
                >
                  Nombre Completo *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  returnKeyType="next"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-base"
                  style={{ color: colors.foreground }}
                />
              </View>

              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.foreground }}
                >
                  Número de Teléfono *
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-base"
                  style={{ color: colors.foreground }}
                />
                <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                  Incluye el código de país para números internacionales
                </Text>
              </View>

              <View>
                <Text
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.foreground }}
                >
                  Método de Alerta *
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setAlertMethod("sms");
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    className="flex-1 border rounded-xl p-4"
                    style={{
                      backgroundColor:
                        alertMethod === "sms" ? colors.primary + "10" : colors.surface,
                      borderColor:
                        alertMethod === "sms" ? colors.primary : colors.border,
                      borderWidth: alertMethod === "sms" ? 2 : 1,
                    }}
                  >
                    <Text
                      className="text-center font-semibold"
                      style={{
                        color:
                          alertMethod === "sms" ? colors.primary : colors.foreground,
                      }}
                    >
                      SMS
                    </Text>
                    <Text
                      className="text-xs text-center mt-1"
                      style={{ color: colors.muted }}
                    >
                      Mensaje de texto
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-8 gap-3">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="bg-primary rounded-xl py-4 items-center"
              style={{
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              <Text className="text-white text-base font-semibold">
                {isSaving ? "Guardando..." : "Guardar Contacto"}
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
              <Text style={{ color: colors.foreground }} className="text-base font-semibold">
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
