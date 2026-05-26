import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { apiClient } from "@/services/api/client";

export type PushRegistrationResult =
  | { status: "registered"; token: string; deviceId: string }
  | { status: "unsupported" | "denied" | "missing-project-id" | "not-registered"; message: string };

const PUSH_DEVICE_ID_KEY = "chessplay.pushDeviceId";
const PUSH_TOKEN_KEY = "chessplay.expoPushToken";

function randomDeviceId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  return `expo-${bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function getDeviceId() {
  const existing = await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY);
  if (existing) return existing;
  const next = randomDeviceId();
  await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, next);
  return next;
}

export async function getExpoPushTokenAfterLogin(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { status: "unsupported", message: "Push tokens require a physical device." };
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;
  if (current.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }
  if (finalStatus !== "granted") {
    return { status: "denied", message: "Notification permission was not granted." };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) {
    return { status: "missing-project-id", message: "EAS project ID is required before collecting Expo push tokens." };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ChessPlay",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  const deviceId = await getDeviceId();
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token.data);
  return { status: "registered", token: token.data, deviceId };
}

export async function registerDevicePushTokenAfterLogin(): Promise<PushRegistrationResult> {
  const result = await getExpoPushTokenAfterLogin();
  if (result.status !== "registered") return result;

  await apiClient("/notifications/device-token", {
    method: "POST",
    body: JSON.stringify({
      token: result.token,
      platform: Platform.OS === "ios" ? "ios" : "android",
      deviceId: result.deviceId,
      appVersion: Constants.expoConfig?.version || "1.0.0"
    })
  });
  return result;
}

export async function revokeDevicePushToken() {
  const [token, deviceId] = await Promise.all([
    SecureStore.getItemAsync(PUSH_TOKEN_KEY),
    SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY)
  ]);
  if (!token && !deviceId) return { status: "not-registered" as const, message: "No push token is registered on this device." };

  try {
    await apiClient("/notifications/device-token", {
      method: "DELETE",
      body: JSON.stringify({ token: token || undefined, deviceId: deviceId || undefined }),
      preserveSessionOnUnauthorized: true
    });
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
  return { status: "not-registered" as const, message: "Device push token revoked." };
}
