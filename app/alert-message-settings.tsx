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

const DEFAULT_MESSAGE = "EMERGENCY! I need help. My location:";
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
      Alert.alert("Validation Error", "Message cannot be empty");
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

      Alert.alert("Success", "Alert message updated", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to save message"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Default",
      `Reset message to: "${DEFAULT_MESSAGE}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
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
          <Text style={{ color: colors.foreground }}>Loading...</Text>
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
                Alert Message
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.muted }}>
                Customize the message sent to emergency contacts
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
                ℹ️ Message Info
              </Text>
              <Text className="text-xs" style={{ color: colors.primary }}>
                Your location will be automatically appended to this message when
                sending alerts.
              </Text>
            </View>

            {/* Message Input */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.foreground }}
                >
                  Message Template
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
                placeholder="Enter your alert message"
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
                  {remainingLength} characters remaining
                </Text>
              )}
            </View>

            {/* Preview Section */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.foreground }}
              >
                Preview
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
                Quick Templates
              </Text>
              <View className="gap-2">
                {[
                  "EMERGENCY! I need help. My location:",
                  "Help needed immediately! Location:",
                  "SOS - Please send help. My location:",
                  "I'm in danger. Please help. Location:",
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
                  {isSaving ? "Saving..." : "Save Message"}
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
                  Reset to Default
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
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
