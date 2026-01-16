import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getContacts, deleteContact } from "@/lib/storage";
import type { EmergencyContact } from "@/types";

export default function ContactsScreen() {
  const colors = useColors();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  // Reload contacts when screen is focused (after edit/delete)
  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    const loadedContacts = await getContacts();
    setContacts(loadedContacts);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      "Eliminar Contacto",
      `¿Eliminar a ${contact.name} de los contactos de emergencia?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await deleteContact(contact.id);
            await loadContacts();
          },
        },
      ]
    );
  };

  const handleEditContact = (contact: EmergencyContact) => {
    router.push({
      pathname: "/edit-contact",
      params: { contactId: contact.id },
    });
  };

  const handleAddContact = () => {
    router.push("/add-contact");
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View
      className="bg-surface border border-border rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text
            className="text-lg font-semibold mb-1"
            style={{ color: colors.foreground }}
          >
            {item.name}
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.muted }}>
            {item.phoneNumber}
          </Text>
          <View
            className="self-start px-2 py-1 rounded-md"
            style={{
              backgroundColor:
                item.alertMethod === "sms"
                  ? colors.primary + "20"
                  : "#25D366" + "20",
            }}
          >
            <Text
              className="text-xs font-medium"
              style={{
                color: item.alertMethod === "sms" ? colors.primary : "#25D366",
              }}
            >
              {item.alertMethod === "sms" ? "SMS" : "WhatsApp"}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleEditContact(item)}
            className="bg-background border border-border rounded-lg px-3 py-2"
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: pressed ? 0.6 : 1,
              backgroundColor: colors.background,
              borderColor: colors.border,
            })}
          >
            <Text style={{ color: colors.primary, fontSize: 12 }}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteContact(item)}
            className="bg-error/10 border border-error rounded-lg px-3 py-2"
            style={({ pressed }: { pressed: boolean }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: colors.error, fontSize: 12 }}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: colors.surface }}
      >
        <Text className="text-4xl">👥</Text>
      </View>
      <Text
        className="text-xl font-semibold mb-2"
        style={{ color: colors.foreground }}
      >
        Sin Contactos de Emergencia
      </Text>
      <Text
        className="text-sm text-center px-8 mb-6"
        style={{ color: colors.muted }}
      >
        Agrega al menos un contacto de emergencia para activar el botón de pánico
      </Text>
      <TouchableOpacity
        onPress={handleAddContact}
        className="bg-primary rounded-xl px-6 py-3"
        style={({ pressed }: { pressed: boolean }) => ({
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <Text className="text-white font-semibold">Agregar Primer Contacto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer>
      <View className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text
              className="text-2xl font-bold"
              style={{ color: colors.foreground }}
            >
              Contactos de Emergencia
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.muted }}>
              {contacts.length} {contacts.length === 1 ? "contacto" : "contactos"}{" "}
              agregado{contacts.length === 1 ? "" : "s"}
            </Text>
          </View>
          {contacts.length > 0 && (
            <TouchableOpacity
              onPress={handleAddContact}
              className="bg-primary rounded-full w-12 h-12 items-center justify-center"
              style={({ pressed }: { pressed: boolean }) => ({
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <Text className="text-white text-2xl font-light">+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contacts List */}
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={renderEmpty}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenContainer>
  );
}
