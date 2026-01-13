import { useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePinComplete = async (pin: string) => {
    setError("");
    setPinError(false);
    setIsLoggingIn(true);

    try {
      const result = await PinApi.loginWithPin(pin);

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

      // Refresh auth state and redirect
      await refresh();
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
      setPinError(true);
    } finally {
      setIsLoggingIn(false);
    }
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
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <Text className="text-5xl text-white font-bold">SOS</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground mb-2">
            Driver Panic Button
          </Text>
          <Text className="text-base text-muted text-center">
            Emergency alert system for drivers
          </Text>
        </View>

        {/* PIN Input */}
        <View className="gap-6">
          <View className="items-center">
            <Text className="text-xl font-semibold text-foreground mb-2">
              Enter Your PIN
            </Text>
            <Text className="text-sm text-muted text-center mb-6">
              Enter the 6-digit PIN assigned by your administrator
            </Text>

            <PinInput
              length={6}
              onComplete={handlePinComplete}
              error={pinError}
            />
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-error/10 border border-error rounded-xl p-3">
              <Text className="text-error text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Loading Indicator */}
          {isLoggingIn ? (
            <View className="items-center">
              <ActivityIndicator color={colors.primary} />
              <Text className="text-muted text-sm mt-2">Authenticating...</Text>
            </View>
          ) : null}

          {/* Help Text */}
          <View className="mt-8">
            <Text className="text-muted text-xs text-center">
              Don't have a PIN? Contact your administrator
            </Text>
            <Text className="text-muted text-xs text-center mt-2">
              Development: Use device ID "dev-device-user" with PIN 123456
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
