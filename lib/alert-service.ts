import * as SMS from "expo-sms";
import { Linking, Platform } from "react-native";
import type { EmergencyContact, LocationCoordinates } from "@/types";

export interface AlertResult {
  success: boolean;
  contact: EmergencyContact;
  error?: string;
}

/**
 * Format coordinates as a Google Maps link
 */
export function formatLocationLink(coords: LocationCoordinates): string {
  return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

/**
 * Create the alert message with location
 */
export function createAlertMessage(baseMessage: string, coords: LocationCoordinates): string {
  const locationLink = formatLocationLink(coords);
  return `${baseMessage} ${locationLink}`;
}

/**
 * Send SMS to a phone number
 */
async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  const isAvailable = await SMS.isAvailableAsync();
  
  if (!isAvailable) {
    throw new Error("SMS no está disponible en este dispositivo");
  }

  const { result } = await SMS.sendSMSAsync([phoneNumber], message);
  
  if (result !== "sent") {
    throw new Error(`SMS no enviado: ${result}`);
  }
}

/**
 * Send WhatsApp message to a phone number
 */
async function sendWhatsApp(phoneNumber: string, message: string): Promise<void> {
  // Remove all non-numeric characters from phone number
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  
  // WhatsApp URL scheme
  const url = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  
  const canOpen = await Linking.canOpenURL(url);
  
  if (!canOpen) {
    throw new Error("WhatsApp no está instalado en este dispositivo");
  }
  
  await Linking.openURL(url);
}

/**
 * Send alert to a single contact
 */
async function sendAlertToContact(
  contact: EmergencyContact,
  message: string
): Promise<AlertResult> {
  try {
    if (contact.alertMethod === "sms") {
      await sendSMS(contact.phoneNumber, message);
    } else {
      await sendWhatsApp(contact.phoneNumber, message);
    }
    
    return {
      success: true,
      contact,
    };
  } catch (error) {
    return {
      success: false,
      contact,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Send alerts to all emergency contacts
 */
export async function sendAlertsToContacts(
  contacts: EmergencyContact[],
  baseMessage: string,
  coordinates: LocationCoordinates
): Promise<AlertResult[]> {
  const message = createAlertMessage(baseMessage, coordinates);
  
  // Send alerts in parallel
  const results = await Promise.all(
    contacts.map((contact) => sendAlertToContact(contact, message))
  );
  
  return results;
}

/**
 * Check if SMS is available on the device
 */
export async function isSMSAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  return await SMS.isAvailableAsync();
}

/**
 * Check if WhatsApp is available on the device
 */
export async function isWhatsAppAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  try {
    return await Linking.canOpenURL("whatsapp://send");
  } catch {
    return false;
  }
}
