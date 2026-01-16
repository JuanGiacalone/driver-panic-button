import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { PinInput } from "@/components/pin-input";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import * as PinApi from "@/lib/_core/api-pin";
import * as Auth from "@/lib/_core/auth";

export default function LoginScreen() {
  const colors = useColors();
  const { isAuthenticated, loading, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState(false);

  // Load stored credentials on mount
  useEffect(() => {
    const loadCredentials = async () => {
      const stored = await Auth.getStoredCredentials();
      if (stored.username) {
        setUsername(stored.username);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async (finalPin?: string) => {
    const pinToUse = finalPin || pin;
    
    if (!username) {
      setError("Por favor ingresa tu nombre de usuario");
      return;
    }
    if (pinToUse.length < 6) {
      setError("Por favor ingresa tu PIN de 6 dígitos");
      return;
    }

    setError("");
    setPinError(false);
    setIsLoggingIn(true);

    try {
      const result = await PinApi.loginWithPin(username, pinToUse);

      // Store session token and user info
      if (result.sessionToken) {
        await Auth.setSessionToken(result.sessionToken);
      }

      if (result.user) {
        const userInfo: Auth.User = {
          id: result.user.id,
          deviceId: result.user.deviceId,
          name: result.user.name,
          role: result.user.role,
          lastSignedIn: new Date(result.user.lastSignedIn),
        };
        await Auth.setUserInfo(userInfo);
      }

      // Save credentials for future use
      await Auth.setStoredCredentials(username, pinToUse);

      // Refresh auth state and redirect
      await refresh();
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setPinError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePinComplete = (completedPin: string) => {
    setPin(completedPin);
    handleLogin(completedPin);
  };

  // Redirect if already authenticated
  if (isAuthenticated && !loading) {
    router.replace("/(tabs)");
    return null;
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center px-6 py-8">
        {/* Logo and Title */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <Text className="text-5xl text-white font-bold">SOS</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">
            Botón de Pánico para Conductores
          </Text>
          <Text className="text-base text-muted text-center">
            Sistema de alerta de emergencia para conductores
          </Text>
        </View>

        {/* Login Form */}
        <View className="gap-6">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2 ml-1">
              Nombre de Usuario
            </Text>
            <TextInput
              className="w-full h-14 px-4 rounded-xl border-2 border-border bg-background text-foreground text-lg"
              placeholder="Ingresa tu nombre de usuario"
              placeholderTextColor={colors.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="items-center">
            <Text className="text-sm font-medium text-foreground mb-4 self-start ml-1">
              Ingresa tu PIN de 6 Dígitos
            </Text>
            <PinInput
              length={6}
              onComplete={handlePinComplete}
              onChangePin={setPin}
              error={pinError}
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-xl p-3">
              <Text className="text-error text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Login Button (Optional, as PIN complete triggers login) */}
          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center ${isLoggingIn ? 'bg-primary/50' : 'bg-primary'}`}
            onPress={() => handleLogin()}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            onPress={() => router.push("/register")}
            disabled={isLoggingIn}
            className="h-14 rounded-xl items-center justify-center border-2 border-primary bg-background"
          >
            <Text className="text-primary text-lg font-bold">Crear Cuenta Nueva</Text>
          </TouchableOpacity>

          {/* Help Text */}
          <View className="mt-4">
            <Text className="text-muted text-xs text-center">
              Crea una cuenta para comenzar a usar el botón de pánico
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
