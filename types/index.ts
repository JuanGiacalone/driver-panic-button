export type AlertMethod = "sms";

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  alertMethod: AlertMethod;
}

export interface AppSettings {
  alertMessage: string;
  pairedBluetoothDeviceId?: string;
  pairedBluetoothDeviceName?: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}
