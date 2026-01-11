import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const [locationStatus, setLocationStatus] = useState<string>("Checking...");
  const [bluetoothStatus] = useState<string>("Not Connected");

  useEffect(() => {
    checkLocationPermissions();
  }, []);

  const checkLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

    if (foregroundStatus === "granted" && backgroundStatus === "granted") {
      setLocationStatus("Enabled (Always)");
    } else if (foregroundStatus === "granted") {
      setLocationStatus("Enabled (While Using)");
    } else {
      setLocationStatus("Disabled");
    }
  };

  const handleRequestLocationPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus === "granted") {
      await Location.requestBackgroundPermissionsAsync();
      await checkLocationPermissions();
    } else {
      Alert.alert(
        "Permission Denied",
        "Location permission is required for emergency alerts to include your coordinates."
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const SettingRow = ({
    label,
    value,
    onPress,
    showChevron = false,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row justify-between items-center py-4 border-b"
      style={{
        borderBottomColor: colors.border,
        opacity: onPress ? 1 : 0.6,
      }}
    >
      <Text className="text-base" style={{ color: colors.foreground }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        {value && (
          <Text className="text-sm" style={{ color: colors.muted }}>
            {value}
          </Text>
        )}
        {showChevron && (
          <Text style={{ color: colors.muted }}>›</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="mb-6">
          <Text
            className="text-2xl font-bold"
            style={{ color: colors.foreground }}
          >
            Settings
          </Text>
        </View>

        {/* Account Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Account
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow label="Name" value={user?.name || "Not set"} />
            <SettingRow label="Email" value={user?.email || "Not set"} />
          </View>
        </View>

        {/* Permissions Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Permissions
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow
              label="Location Access"
              value={locationStatus}
              onPress={
                locationStatus !== "Enabled (Always)"
                  ? handleRequestLocationPermissions
                  : undefined
              }
              showChevron={locationStatus !== "Enabled (Always)"}
            />
            <SettingRow
              label="Bluetooth"
              value={bluetoothStatus}
              onPress={() => router.push("/bluetooth-setup")}
              showChevron
            />
          </View>
        </View>

        {/* Alert Settings Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            Alert Settings
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow
              label="Custom Alert Message"
              onPress={() => router.push("/alert-message-settings")}
              showChevron
            />
          </View>
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text
            className="text-xs font-semibold uppercase mb-3"
            style={{ color: colors.muted }}
          >
            About
          </Text>
          <View
            className="bg-surface rounded-xl p-4"
            style={{ backgroundColor: colors.surface }}
          >
            <SettingRow label="Version" value="1.0.0" />
            <SettingRow
              label="Help & Support"
              onPress={() => {
                Alert.alert(
                  "Help & Support",
                  "For assistance, please contact support@example.com"
                );
              }}
              showChevron
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-error/10 border border-error rounded-xl py-4 items-center mb-8"
        >
          <Text className="font-semibold" style={{ color: colors.error }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
