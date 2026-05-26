import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "unsupported" | "denied" | "missing-project-id"; message: string };

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
  return { status: "registered", token: token.data };
}
