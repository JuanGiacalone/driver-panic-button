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
      setError("Please enter your username");
      return;
    }
    if (pinToUse.length < 6) {
      setError("Please enter your 6-digit PIN");
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
      setError(err instanceof Error ? err.message : "Login failed");
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
            Driver Panic Button
          </Text>
          <Text className="text-base text-muted text-center">
            Emergency alert system for drivers
          </Text>
        </View>

        {/* Login Form */}
        <View className="gap-6">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2 ml-1">
              Username
            </Text>
            <TextInput
              className="w-full h-14 px-4 rounded-xl border-2 border-border bg-background text-foreground text-lg"
              placeholder="Enter your username"
              placeholderTextColor={colors.muted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="items-center">
            <Text className="text-sm font-medium text-foreground mb-4 self-start ml-1">
              Enter Your 6-Digit PIN
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
              <Text className="text-white text-lg font-bold">Login</Text>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View className="mt-4">
            <Text className="text-muted text-xs text-center">
              Don't have a login? Contact your administrator
            </Text>
            <Text className="text-muted text-xs text-center mt-2">
              Development: Use username "driver1" with PIN 123456
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
