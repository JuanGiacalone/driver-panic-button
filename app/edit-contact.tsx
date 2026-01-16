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
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getContacts, updateContact } from "@/lib/storage";
import type { EmergencyContact, AlertMethod } from "@/types";

export default function EditContactScreen() {
  const colors = useColors();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [alertMethod, setAlertMethod] = useState<AlertMethod>("sms");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contact, setContact] = useState<EmergencyContact | null>(null);

  // Load contact data on mount
  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      if (!contactId) {
        Alert.alert("Error", "No se proporcionó ID de contacto");
        router.back();
        return;
      }

      const contacts = await getContacts();
      const foundContact = contacts.find((c) => c.id === contactId);

      if (!foundContact) {
        Alert.alert("Error", "Contacto no encontrado");
        router.back();
        return;
      }

      setContact(foundContact);
      setName(foundContact.name);
      setPhoneNumber(foundContact.phoneNumber);
      setAlertMethod(foundContact.alertMethod);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al cargar contacto"
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
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
      if (!contact) {
        throw new Error("Datos de contacto no disponibles");
      }

      const updatedContact: EmergencyContact = {
        ...contact,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        alertMethod,
      };

      await updateContact(updatedContact);

      Alert.alert("Éxito", "Contacto de emergencia actualizado", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Error al actualizar contacto"
      );
    } finally {
      setIsSaving(false);
    }
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
                Editar Contacto de Emergencia
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                Actualiza la información del contacto
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
                  editable={!isSaving}
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
                  editable={!isSaving}
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
                    disabled={isSaving}
                    className="flex-1 border rounded-xl p-4"
                    style={{
                      backgroundColor:
                        alertMethod === "sms" ? colors.primary + "10" : colors.surface,
                      borderColor:
                        alertMethod === "sms" ? colors.primary : colors.border,
                      borderWidth: alertMethod === "sms" ? 2 : 1,
                      opacity: isSaving ? 0.6 : 1,
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

                  <TouchableOpacity
                    onPress={() => {
                      setAlertMethod("whatsapp");
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    disabled={isSaving}
                    className="flex-1 border rounded-xl p-4"
                    style={{
                      backgroundColor:
                        alertMethod === "whatsapp"
                          ? "#25D366" + "10"
                          : colors.surface,
                      borderColor:
                        alertMethod === "whatsapp" ? "#25D366" : colors.border,
                      borderWidth: alertMethod === "whatsapp" ? 2 : 1,
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    <Text
                      className="text-center font-semibold"
                      style={{
                        color:
                          alertMethod === "whatsapp" ? "#25D366" : colors.foreground,
                      }}
                    >
                      WhatsApp
                    </Text>
                    <Text
                      className="text-xs text-center mt-1"
                      style={{ color: colors.muted }}
                    >
                      Mensaje instantáneo
                    </Text>
                  </TouchableOpacity>
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
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
