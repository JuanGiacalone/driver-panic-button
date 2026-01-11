import { useState } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const OAUTH_PORTAL_URL = process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL;
const APP_ID = process.env.EXPO_PUBLIC_APP_ID;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const colors = useColors();
  const { isAuthenticated, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!OAUTH_PORTAL_URL || !APP_ID) {
      setError("OAuth configuration missing");
      return;
    }

    setError("");
    setIsLoggingIn(true);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (Platform.OS === "web") {
        // Web: redirect to OAuth portal
        const redirectUri = `${window.location.origin}/oauth/callback`;
        const authUrl = `${OAUTH_PORTAL_URL}?appId=${APP_ID}&redirectUri=${encodeURIComponent(redirectUri)}`;
        window.location.href = authUrl;
      } else {
        // Native: open OAuth in browser
        const redirectUri = `exp://`;
        const authUrl = `${OAUTH_PORTAL_URL}?appId=${APP_ID}&redirectUri=${encodeURIComponent(redirectUri)}`;
        
        const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
        
        if (result.type === "success") {
          // OAuth callback will handle the rest
          router.replace("/(tabs)");
        } else {
          setError("Login cancelled");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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

        {/* Login Button */}
        <View className="gap-4">
          {error ? (
            <View className="bg-error/10 border border-error rounded-xl p-3">
              <Text className="text-error text-sm text-center">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoggingIn}
            className="bg-primary rounded-xl py-4 items-center"
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: pressed || isLoggingIn ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            {isLoggingIn ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Sign In with Manus
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-muted text-xs text-center mt-4">
            You'll be redirected to Manus OAuth to sign in securely
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
