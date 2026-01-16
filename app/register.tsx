import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { PinInput } from "@/components/pin-input";
import { useColors } from "@/hooks/use-colors";
import { getDeviceId } from "@/lib/_core/device";

export default function RegisterScreen() {
  const colors = useColors();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState(false);
  const [confirmPinError, setConfirmPinError] = useState(false);

  const validateUsername = (text: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(text);
  };

  const handleRegister = async () => {
    // Validations
    if (!username.trim()) {
      setError("Por favor ingresa un nombre de usuario");
      return;
    }

    if (!validateUsername(username)) {
      setError("El nombre de usuario debe tener entre 3 y 20 caracteres alfanuméricos");
      return;
    }

    if (pin.length !== 6) {
      setError("El PIN debe ser de 6 dígitos");
      setPinError(true);
      return;
    }

    if (confirmPin.length !== 6) {
      setError("Por favor confirma tu PIN");
      setConfirmPinError(true);
      return;
    }

    if (pin !== confirmPin) {
      setError("Los PINs no coinciden");
      setPinError(true);
      setConfirmPinError(true);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setError("");
    setPinError(false);
    setConfirmPinError(false);
    setIsRegistering(true);

    try {
      const deviceId = await getDeviceId();
      
      // Get API base URL
      const getApiBaseUrl = () => {
        const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
        if (API_BASE_URL) {
          return API_BASE_URL.replace(/\/$/, "");
        }
        if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
          const { protocol, hostname } = window.location;
          const apiHostname = hostname.replace(/^8081-/, "3000-");
          if (apiHostname !== hostname) {
            return `${protocol}//${apiHostname}`;
          }
        }
        return "";
      };

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          deviceId,
          username: username.trim(),
          pin,
          name: name.trim() || username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      Alert.alert(
        "¡Registro Exitoso!",
        "Tu cuenta ha sido creada. El administrador debe activarla antes de que puedas iniciar sesión.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "Error al registrar usuario");
    } finally {
      setIsRegistering(false);
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
          <View className="flex-1 justify-center px-6 py-8">
            {/* Logo and Title */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
                <Text className="text-5xl text-white font-bold">SOS</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground mb-2">
                Crear Cuenta
              </Text>
              <Text className="text-base text-muted text-center">
                Regístrate para usar el botón de pánico
              </Text>
            </View>

            {/* Registration Form */}
            <View className="gap-6">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2 ml-1">
                  Nombre de Usuario *
                </Text>
                <TextInput
                  className="w-full h-14 px-4 rounded-xl border-2 border-border bg-background text-foreground text-lg"
                  placeholder="usuario123"
                  placeholderTextColor={colors.muted}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setError("");
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isRegistering}
                />
                <Text className="text-xs text-muted mt-1 ml-1">
                  3-20 caracteres alfanuméricos
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2 ml-1">
                  Nombre (Opcional)
                </Text>
                <TextInput
                  className="w-full h-14 px-4 rounded-xl border-2 border-border bg-background text-foreground text-lg"
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isRegistering}
                />
              </View>

              <View className="items-center">
                <Text className="text-sm font-medium text-foreground mb-4 self-start ml-1">
                  Crear PIN de 6 Dígitos *
                </Text>
                <PinInput
                  length={6}
                  onComplete={(completedPin) => {
                    setPin(completedPin);
                    setPinError(false);
                    setError("");
                  }}
                  onChangePin={(newPin) => {
                    setPin(newPin);
                    setPinError(false);
                  }}
                  error={pinError}
                />
              </View>

              <View className="items-center">
                <Text className="text-sm font-medium text-foreground mb-4 self-start ml-1">
                  Confirmar PIN *
                </Text>
                <PinInput
                  length={6}
                  onComplete={(completedPin) => {
                    setConfirmPin(completedPin);
                    setConfirmPinError(false);
                    setError("");
                  }}
                  onChangePin={(newPin) => {
                    setConfirmPin(newPin);
                    setConfirmPinError(false);
                  }}
                  error={confirmPinError}
                />
              </View>

              {/* Error Message */}
              {error ? (
                <View className="bg-error/10 border border-error rounded-xl p-3">
                  <Text className="text-error text-sm text-center">{error}</Text>
                </View>
              ) : null}

              {/* Register Button */}
              <TouchableOpacity
                className={`h-14 rounded-xl items-center justify-center ${isRegistering ? 'bg-primary/50' : 'bg-primary'}`}
                onPress={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-bold">Registrarse</Text>
                )}
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={isRegistering}
                className="items-center py-2"
              >
                <Text className="text-primary text-base font-semibold">
                  ¿Ya tienes cuenta? Inicia Sesión
                </Text>
              </TouchableOpacity>

              {/* Info Text */}
              <View className="mt-4">
                <Text className="text-muted text-xs text-center">
                  Tu cuenta será revisada y activada por un administrador antes de que puedas usarla.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
